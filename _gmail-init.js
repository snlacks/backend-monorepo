// Not part of app, run this locally to get tokens.

import fs from 'fs/promises';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';

import path from 'path';

export const TOKEN_PATH = path.join(process.cwd(), '_gmail_token.json');
export const CREDENTIALS_PATH = path.join(
  process.cwd(),
  '_gmail_credentials.json',
);

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await (await fs.readFile(TOKEN_PATH)).toString();
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
export async function authorizeGmail() {
  const client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  } else {
    const newClient = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (newClient.credentials) {
      await saveCredentials(newClient);
    }
    return newClient;
  }
}

authorize().catch(console.error);
