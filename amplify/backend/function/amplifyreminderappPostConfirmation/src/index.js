'use strict';

/**
 * CloudFormation Trigger wrapper (Amplify-style)
 * Loads handlers listed in MODULES env var (comma-separated).
 */
const moduleNames = (process.env.MODULES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const modules = moduleNames.map((name) => require(`./${name}`));

const {
  SESv2Client,
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
} = require('@aws-sdk/client-sesv2');

const ses = new SESv2Client({
  region: process.env.SES_REGION || process.env.REGION || process.env.AWS_REGION,
});

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Extract email from Cognito trigger OR API Gateway style payloads.
 */
function extractEmail(event) {
  // Cognito trigger
  const cognitoEmail = event?.request?.userAttributes?.email;
  if (cognitoEmail) return cognitoEmail;

  // API Gateway / generic JSON
  let body = event?.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  return body?.email || event?.email || null;
}

function extractAction(event, isCognitoTrigger) {
  // For Cognito trigger, default to startVerification
  if (isCognitoTrigger) return 'startVerification';

  let body = event?.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  return (body?.action || 'startVerification').trim();
}

exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event));

  const isCognitoTrigger = !!event?.triggerSource;

  const rawEmail = extractEmail(event);
  const email = (rawEmail || '').trim().toLowerCase();
  const action = extractAction(event, isCognitoTrigger);

  if (!isValidEmail(email)) {
    console.warn('Invalid or missing email. Extracted:', rawEmail);

    // Cognito triggers must return the event object shape
    if (isCognitoTrigger) return event;

    // API Gateway style response (optional)
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid or missing email' }) };
  }

  if (action === 'startVerification') {
    await ses.send(new CreateEmailIdentityCommand({ EmailIdentity: email }));
    console.log('Started SES verification for:', email);
  } else if (action === 'getStatus') {
    const resp = await ses.send(new GetEmailIdentityCommand({ EmailIdentity: email }));
    console.log('SES verification status:', { email, status: resp?.VerificationStatus });
  } else {
    console.warn('Unknown action:', action);
  }

  // Run any additional Amplify modules
  await Promise.all(modules.map((m) => m.handler(event, context)));

  // For Cognito triggers, return the event
  return event;
};
