/* Amplify Params - DO NOT EDIT
	API_AMPLIFYREMINDERAPP_GRAPHQLAPIIDOUTPUT
	API_AMPLIFYREMINDERAPP_REMINDERTABLE_ARN
	API_AMPLIFYREMINDERAPP_REMINDERTABLE_NAME
	ENV
	REGION
Amplify Params - DO NOT EDIT */

'use strict';

const { SFNClient, StartExecutionCommand, StopExecutionCommand } = require('@aws-sdk/client-sfn');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const REGION = process.env.REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const TABLE_NAME =
  process.env.API_AMPLIFYREMINDERAPP_REMINDERTABLE_NAME || process.env.REMINDER_TABLE_NAME;
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN;
const LOG_LEVEL = (process.env.LOG_LEVEL || 'INFO').toUpperCase(); // DEBUG | INFO | WARN | ERROR

const missingEnv = [];
if (!REGION) missingEnv.push('REGION/AWS_REGION');
if (!TABLE_NAME) missingEnv.push('API_AMPLIFYREMINDERAPP_REMINDERTABLE_NAME/REMINDER_TABLE_NAME');
if (!STATE_MACHINE_ARN) missingEnv.push('STATE_MACHINE_ARN');
if (missingEnv.length) {
  throw new Error(`Missing env vars: ${missingEnv.join(', ')}`);
}

const sfn = new SFNClient({ region: REGION });
const ddbDoc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

/** ---------------- Logger ---------------- */
const LEVELS = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
const THRESHOLD = LEVELS[LOG_LEVEL] ?? LEVELS.INFO;

function log(level, message, fields = {}) {
  const lvl = LEVELS[level] ?? LEVELS.INFO;
  if (lvl < THRESHOLD) return;

  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    service: 'reminder-stream-processor',
    region: REGION,
    ...fields,
  };

  const line = JSON.stringify(payload);

  if (level === 'ERROR') console.error(line);
  else if (level === 'WARN') console.warn(line);
  else console.log(line);
}

function shortId(id) {
  return String(id || '').replace(/-/g, '').slice(0, 12);
}

function safeReminderLog(reminderItem) {
  return {
    reminderId: reminderItem?.id,
    reminderIdShort: shortId(reminderItem?.id),
    userIdShort: shortId(reminderItem?.userId),
    title: reminderItem?.title,
    remindAt: reminderItem?.remindAt,
    version: reminderItem?._version,
  };
}

/** ---------------- Helpers ---------------- */
function isoNoMillis(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString; // fallback if invalid date
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function buildStepFnInput(reminderItem) {
  return {
    reminderId: reminderItem.id,
    userId: reminderItem.userId,
    title: reminderItem.title,
    description: reminderItem.description,
    reminderAt: isoNoMillis(reminderItem.remindAt),
  };
}

// Step Functions execution name constraints: <=80 chars, [0-9A-Za-z-_]+
function makeExecutionName(reminderItem) {
  const ver = reminderItem._version ?? 1;
  const ts = Date.parse(reminderItem.remindAt);
  const safeTs = Number.isFinite(ts) ? ts : Date.now();
  return `rem-${shortId(reminderItem.id)}-v${ver}-${safeTs}`.slice(0, 80);
}

function deriveExecutionArn(stateMachineArn, executionName) {
  // arn:aws:states:REGION:ACCT:stateMachine:ReminderStateMachine
  // -> arn:aws:states:REGION:ACCT:execution:ReminderStateMachine:<executionName>
  const parts = stateMachineArn.split(':');
  const smIndex = parts.indexOf('stateMachine');
  if (smIndex === -1 || smIndex + 1 >= parts.length) return null;

  const region = parts[3];
  const account = parts[4];
  const machineName = parts[smIndex + 1];

  return `arn:aws:states:${region}:${account}:execution:${machineName}:${executionName}`;
}

function relevantFieldsChanged(oldItem, newItem) {
  if (!oldItem) return true;
  const keys = ['title', 'description', 'remindAt', 'userId'];
  return keys.some((k) => (oldItem[k] ?? null) !== (newItem[k] ?? null));
}

async function getExecutionArnFromTable(reminderId, logCtx) {
  const t0 = Date.now();
  const resp = await ddbDoc.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id: reminderId },
      ProjectionExpression: 'id, stepFnExecutionArn',
    })
  );

  log('DEBUG', 'DynamoDB GetItem completed', {
    ...logCtx,
    durationMs: Date.now() - t0,
    found: !!resp.Item,
    hasStepFnExecutionArn: !!resp.Item?.stepFnExecutionArn,
  });

  return resp.Item?.stepFnExecutionArn || null;
}

async function persistExecutionArn(reminderId, executionArn, onlyIfMissing = false, logCtx) {
  const t0 = Date.now();
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: { id: reminderId },
      UpdateExpression: 'SET stepFnExecutionArn = :arn',
      ExpressionAttributeValues: { ':arn': executionArn },
      ConditionExpression: 'attribute_exists(id)',
      ReturnValues: 'UPDATED_NEW',
    };

    // For INSERT flow, this helps avoid overwriting if already set
    if (onlyIfMissing) {
      params.ConditionExpression += ' AND attribute_not_exists(stepFnExecutionArn)';
    }

    const resp = await ddbDoc.send(new UpdateCommand(params));

    log('INFO', 'Persisted stepFnExecutionArn to DynamoDB', {
      ...logCtx,
      durationMs: Date.now() - t0,
      onlyIfMissing,
      updatedAttributes: resp?.Attributes,
    });
  } catch (e) {
    // If condition fails, we safely ignore (idempotency / race conditions)
    if (e && e.name === 'ConditionalCheckFailedException') {
      log('WARN', 'Skipped persisting stepFnExecutionArn (ConditionalCheckFailed)', {
        ...logCtx,
        durationMs: Date.now() - t0,
        onlyIfMissing,
      });
      return;
    }

    log('ERROR', 'Failed to persist stepFnExecutionArn', {
      ...logCtx,
      durationMs: Date.now() - t0,
      errName: e?.name,
      errMsg: e?.message,
      stack: e?.stack,
    });
    throw e;
  }
}

async function stopExecutionIfRunning(executionArn, logCtx) {
  if (!executionArn) {
    log('DEBUG', 'No previous executionArn found; skip StopExecution', logCtx);
    return;
  }

  const t0 = Date.now();
  try {
    await sfn.send(
      new StopExecutionCommand({
        executionArn,
        cause: 'Reminder updated/deleted - cancelling previous schedule',
      })
    );

    log('INFO', 'Stopped Step Functions execution', {
      ...logCtx,
      durationMs: Date.now() - t0,
      executionArn,
    });
  } catch (e) {
    // Common benign cases: already finished, bad arn, not found
    log('WARN', 'StopExecution warning (may be already finished/not found)', {
      ...logCtx,
      durationMs: Date.now() - t0,
      executionArn,
      errName: e?.name,
      errMsg: e?.message,
    });
  }
}

async function startExecution(reminderItem, logCtx) {
  const inputObj = buildStepFnInput(reminderItem);
  const executionName = makeExecutionName(reminderItem);

  log('INFO', 'Starting Step Functions execution', {
    ...logCtx,
    executionName,
    input: {
      reminderId: inputObj.reminderId,
      userIdShort: shortId(inputObj.userId),
      title: inputObj.title,
      reminderAt: inputObj.reminderAt,
      // not logging full description to keep logs tidy; add if you want
    },
  });

  const t0 = Date.now();

  try {
    const resp = await sfn.send(
      new StartExecutionCommand({
        stateMachineArn: STATE_MACHINE_ARN,
        name: executionName, // idempotent per version+remindAt
        input: JSON.stringify(inputObj),
      })
    );

    log('INFO', 'Started Step Functions execution', {
      ...logCtx,
      durationMs: Date.now() - t0,
      executionArn: resp.executionArn,
      executionName,
    });

    return resp.executionArn;
  } catch (e) {
    // If retried and same name already exists, derive the arn deterministically
    if (e && e.name === 'ExecutionAlreadyExists') {
      const derived = deriveExecutionArn(STATE_MACHINE_ARN, executionName);
      log('WARN', 'ExecutionAlreadyExists; using derived executionArn', {
        ...logCtx,
        durationMs: Date.now() - t0,
        executionName,
        derivedExecutionArn: derived,
      });
      if (derived) return derived;
    }

    log('ERROR', 'Failed to start Step Functions execution', {
      ...logCtx,
      durationMs: Date.now() - t0,
      executionName,
      errName: e?.name,
      errMsg: e?.message,
      stack: e?.stack,
    });
    throw e;
  }
}

/** ---------------- Handler ---------------- */
exports.handler = async (event, context) => {
  const start = Date.now();
  const failures = [];

  log('INFO', 'Lambda invoked', {
    requestId: context?.awsRequestId,
    recordCount: event?.Records?.length || 0,
    tableName: TABLE_NAME,
    stateMachineArn: STATE_MACHINE_ARN,
  });

  // Partial batch response so one bad record doesn't retry the whole batch
  await Promise.all(
    (event.Records || []).map(async (record) => {
      const recordCtx = {
        requestId: context?.awsRequestId,
        eventID: record.eventID,
        eventName: record.eventName,
        eventSourceARN: record.eventSourceARN,
      };

      try {
        const eventName = record.eventName;

        log('DEBUG', 'Processing stream record', {
          ...recordCtx,
          approxCreationDateTime: record?.dynamodb?.ApproximateCreationDateTime,
        });

        if (eventName === 'INSERT') {
          const newItem = unmarshall(record.dynamodb.NewImage);
          const itemCtx = { ...recordCtx, ...safeReminderLog(newItem) };

          // If already has arn, do nothing
          if (newItem.stepFnExecutionArn) {
            log('INFO', 'INSERT ignored: stepFnExecutionArn already present', {
              ...itemCtx,
              hasStepFnExecutionArn: true,
            });
            return;
          }

          const newArn = await startExecution(newItem, itemCtx);
          await persistExecutionArn(newItem.id, newArn, true, itemCtx);
          return;
        }

        if (eventName === 'MODIFY') {
          const newItem = unmarshall(record.dynamodb.NewImage);
          const oldItem = record.dynamodb.OldImage ? unmarshall(record.dynamodb.OldImage) : null;
          const itemCtx = { ...recordCtx, ...safeReminderLog(newItem) };

          // IMPORTANT: prevents infinite loop when Lambda only updates stepFnExecutionArn
          if (!relevantFieldsChanged(oldItem, newItem)) {
            log('INFO', 'MODIFY ignored: only non-relevant fields changed (likely stepFnExecutionArn)', {
              ...itemCtx,
              oldHasArn: !!oldItem?.stepFnExecutionArn,
              newHasArn: !!newItem?.stepFnExecutionArn,
            });
            return;
          }

          // Fetch previous execution arn (as you requested)
          let prevArn = await getExecutionArnFromTable(newItem.id, itemCtx);
          if (!prevArn && oldItem?.stepFnExecutionArn) prevArn = oldItem.stepFnExecutionArn;

          log('DEBUG', 'Resolved previous executionArn', {
            ...itemCtx,
            hasPrevArn: !!prevArn,
          });

          await stopExecutionIfRunning(prevArn, itemCtx);

          const newArn = await startExecution(newItem, itemCtx);
          await persistExecutionArn(newItem.id, newArn, false, itemCtx);

          return;
        }

        if (eventName === 'REMOVE') {
          const oldItem = record.dynamodb.OldImage ? unmarshall(record.dynamodb.OldImage) : null;
          const keys = record.dynamodb.Keys ? unmarshall(record.dynamodb.Keys) : null;

          const reminderId = oldItem?.id || keys?.id;
          if (!reminderId) {
            log('WARN', 'REMOVE record missing reminderId; skipping', recordCtx);
            return;
          }

          const itemCtx = {
            ...recordCtx,
            reminderId,
            reminderIdShort: shortId(reminderId),
            userIdShort: shortId(oldItem?.userId),
          };

          // Prefer OldImage (because item is deleted), fallback to table read if needed
          let prevArn = oldItem?.stepFnExecutionArn || null;
          if (!prevArn) {
            prevArn = await getExecutionArnFromTable(reminderId, itemCtx).catch((e) => {
              log('WARN', 'GetItem failed during REMOVE (likely already deleted/replicated); continue', {
                ...itemCtx,
                errName: e?.name,
                errMsg: e?.message,
              });
              return null;
            });
          }

          log('DEBUG', 'Resolved previous executionArn for REMOVE', {
            ...itemCtx,
            hasPrevArn: !!prevArn,
          });

          await stopExecutionIfRunning(prevArn, itemCtx);
          return;
        }

        log('DEBUG', 'Ignoring unsupported eventName', recordCtx);
      } catch (err) {
        log('ERROR', 'Record processing failed', {
          ...recordCtx,
          errName: err?.name,
          errMsg: err?.message,
          stack: err?.stack,
        });

        failures.push({ itemIdentifier: record.eventID });
      }
    })
  );

  log('INFO', 'Lambda completed', {
    requestId: context?.awsRequestId,
    durationMs: Date.now() - start,
    failedRecordCount: failures.length,
  });

  return { batchItemFailures: failures };
};
