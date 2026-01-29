/* Amplify Params - DO NOT EDIT
	API_AMPLIFYREMINDERAPP_GRAPHQLAPIIDOUTPUT
	API_AMPLIFYREMINDERAPP_REMINDERTABLE_ARN
	API_AMPLIFYREMINDERAPP_REMINDERTABLE_NAME
	ENV
	REGION
Amplify Params - DO NOT EDIT */

'use strict';

const {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  ListUsersCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

const REGION = process.env.REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || process.env.AUTH_AMPLIFYREMINDERAPP_USERPOOLID;
const FROM_EMAIL = process.env.SES_FROM_EMAIL;
const TIMEZONE = process.env.TIMEZONE;

const missingEnv = [];
if (!REGION) missingEnv.push('REGION/AWS_REGION');
if (!USER_POOL_ID) missingEnv.push('COGNITO_USER_POOL_ID/AUTH_AMPLIFYREMINDERAPP_USERPOOLID');
if (!FROM_EMAIL) missingEnv.push('SES_FROM_EMAIL');
if (!TIMEZONE) missingEnv.push('TIMEZONE');
if (missingEnv.length) {
  throw new Error(`Missing env vars: ${missingEnv.join(', ')}`);
}

// Optional: set LOG_LEVEL=DEBUG to include debug logs
const LOG_LEVEL = (process.env.LOG_LEVEL || 'INFO').toUpperCase();

const cognito = new CognitoIdentityProviderClient({ region: REGION });
const ses = new SESv2Client({ region: REGION });

/** ---------- Logging helpers ---------- */

const LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
const currentLevel = LEVELS[LOG_LEVEL] ?? LEVELS.INFO;

function nowMs() {
  return Date.now();
}

function makeRequestId(event, context) {
  return (
    context?.awsRequestId ||
    event?.requestContext?.requestId ||
    event?.requestId ||
    `req-${Math.random().toString(16).slice(2)}`
  );
}

function maskEmail(email) {
  if (!email || typeof email !== 'string') return email;
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  const u = user.length <= 2 ? `${user[0] || '*'}*` : `${user.slice(0, 2)}***`;
  return `${u}@${domain}`;
}

function safeError(err) {
  return {
    name: err?.name,
    message: err?.message,
    code: err?.code,
    statusCode: err?.$metadata?.httpStatusCode,
    requestId: err?.$metadata?.requestId,
    // Keep stack only in DEBUG to avoid noisy logs
    stack: currentLevel >= LEVELS.DEBUG ? err?.stack : undefined,
  };
}

function log(level, msg, fields = {}) {
  if ((LEVELS[level] ?? 999) > currentLevel) return;
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...fields,
  };
  // CloudWatch likes one-line JSON
  console.log(JSON.stringify(entry));
}

/** ---------- Existing helpers ---------- */

function mustString(v, name) {
  if (typeof v !== 'string' || v.trim() === '') throw new Error(`Missing/invalid ${name}`);
  return v.trim();
}

function attrMap(attributes = []) {
  const m = {};
  for (const a of attributes) {
    if (a?.Name) m[a.Name] = a.Value;
  }
  return m;
}

/**
 * userId might be:
 * - Cognito Username (often the same as email/phone/custom username)
 * - OR Cognito "sub" (UUID)
 *
 * Strategy:
 * 1) Try AdminGetUser with Username=userId
 * 2) If not found, try ListUsers filter by sub
 */
async function getEmailFromCognito(userId, reqId) {
  if (!USER_POOL_ID) {
    throw new Error('COGNITO_USER_POOL_ID or AUTH_AMPLIFYREMINDERAPP_USERPOOLID env var is required');
  }

  // 1) Try as Username
  log('DEBUG', 'Cognito AdminGetUser start', { reqId, userPoolId: USER_POOL_ID, userId });

  const t0 = nowMs();
  try {
    const r = await cognito.send(new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
    }));
    log('INFO', 'Cognito AdminGetUser success', {
      reqId,
      userPoolId: USER_POOL_ID,
      userId,
      tookMs: nowMs() - t0,
    });

    const attrs = attrMap(r.UserAttributes);
    if (attrs.email) return attrs.email;

    throw new Error(`Cognito user found (Username=${userId}) but email attribute is missing`);
  } catch (e) {
    const name = e?.name || e?.Code;
    if (name !== 'UserNotFoundException') {
      log('ERROR', 'Cognito AdminGetUser failed', {
        reqId,
        userPoolId: USER_POOL_ID,
        userId,
        tookMs: nowMs() - t0,
        error: safeError(e),
      });
      throw e;
    }
    log('WARN', 'Cognito user not found by Username; will try sub via ListUsers', {
      reqId,
      userPoolId: USER_POOL_ID,
      userId,
      tookMs: nowMs() - t0,
    });
  }

  // 2) Try as sub
  const t1 = nowMs();
  log('DEBUG', 'Cognito ListUsers by sub start', {
    reqId,
    userPoolId: USER_POOL_ID,
    userId,
    filter: 'sub = "***"', // avoid logging the exact filter string
  });

  const list = await cognito.send(new ListUsersCommand({
    UserPoolId: USER_POOL_ID,
    Filter: `sub = "${userId}"`,
    Limit: 1,
  }));

  log('INFO', 'Cognito ListUsers by sub completed', {
    reqId,
    userPoolId: USER_POOL_ID,
    userId,
    returnedUsers: list.Users?.length ?? 0,
    tookMs: nowMs() - t1,
  });

  const user = list.Users?.[0];
  if (!user) throw new Error(`No Cognito user found for userId=${userId} (as Username or sub)`);

  const attrs = attrMap(user.Attributes);
  if (!attrs.email) throw new Error(`Cognito user found (sub=${userId}) but email attribute is missing`);

  return attrs.email;
}

function formatReminderTime(reminderAtIso) {
  const d = new Date(reminderAtIso);
  if (Number.isNaN(d.getTime())) return { utc: reminderAtIso, local: reminderAtIso };
  return {
    utc: d.toISOString(),
    local: d.toLocaleString('en-IN', { timeZone: TIMEZONE }),
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

exports.handler = async (event, context) => {
  const reqId = makeRequestId(event, context);
  const start = nowMs();

  // Basic invocation log (don't print full event; can contain PII)
  log('INFO', 'Lambda invoked', {
    reqId,
    region: REGION,
    userPoolId: USER_POOL_ID,
    fromEmail: maskEmail(FROM_EMAIL),
    timezone: TIMEZONE,
    logLevel: LOG_LEVEL,
  });

  try {
    const reminderId = mustString(event?.reminderId, 'reminderId');
    const userId = mustString(event?.userId, 'userId');
    const title = mustString(event?.title, 'title');
    const description = (typeof event?.description === 'string') ? event.description.trim() : '';
    const reminderAt = mustString(event?.reminderAt, 'reminderAt');

    log('INFO', 'Input validated', {
      reqId,
      reminderId,
      userId,
      titleLen: title.length,
      descriptionLen: description.length,
      reminderAt,
    });

    // Fetch email from Cognito
    const toEmail = await getEmailFromCognito(userId, reqId);

    log('INFO', 'Resolved recipient email from Cognito', {
      reqId,
      userId,
      toEmail: maskEmail(toEmail),
    });

    // Construct message
    const t = formatReminderTime(reminderAt);
    const subject = title;

    log('DEBUG', 'Reminder time formatted', { reqId, utc: t.utc, local: t.local });

    const textBody =
`Hi,

Reminder: ${title}
When (UTC): ${t.utc}
When (${TIMEZONE}): ${t.local}

Description:
${description || '-'}

(reminderId: ${reminderId})
`;

    const htmlBody =
`<p>Hi,</p>
<p><b>Reminder:</b> ${escapeHtml(title)}</p>
<p><b>When (UTC):</b> ${escapeHtml(t.utc)}<br/>
<b>When (${escapeHtml(TIMEZONE)}):</b> ${escapeHtml(t.local)}</p>
<p><b>Description:</b><br/>${escapeHtml(description || '-').replace(/\n/g, '<br/>')}</p>
<p style="color:#666;">(reminderId: ${escapeHtml(reminderId)})</p>`;

    log('INFO', 'Sending email via SES', {
      reqId,
      fromEmail: maskEmail(FROM_EMAIL),
      toEmail: maskEmail(toEmail),
      subjectLen: subject.length,
      hasHtml: true,
      hasText: true,
    });

    // Send via SES
    const tSend = nowMs();
    const resp = await ses.send(new SendEmailCommand({
      FromEmailAddress: FROM_EMAIL,
      Destination: { ToAddresses: [toEmail] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: textBody, Charset: 'UTF-8' },
            Html: { Data: htmlBody, Charset: 'UTF-8' },
          },
        },
      },
    }));

    log('INFO', 'SES SendEmail success', {
      reqId,
      messageId: resp.MessageId,
      toEmail: maskEmail(toEmail),
      tookMs: nowMs() - tSend,
      totalMs: nowMs() - start,
    });

    return {
      ok: true,
      messageId: resp.MessageId,
      toEmail,
      reminderId,
      userId,
      reqId,
      tookMs: nowMs() - start,
    };
  } catch (err) {
    log('ERROR', 'Lambda failed', {
      reqId,
      tookMs: nowMs() - start,
      error: safeError(err),
    });

    // Re-throw so Lambda marks it as a failure (good for DLQ/retries/Step Functions)
    throw err;
  }
};
