import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as MailComposer from 'nodemailer/lib/mail-composer';
import * as path from 'path';
import * as fs from 'fs/promises';

export const TOKEN_PATH = path.join(process.cwd(), '_gmail_token.json');
export const CREDENTIALS_PATH = path.join(
  process.cwd(),
  '_gmail_credentials.json',
);

@Injectable()
export default class ConnectService {
  getGmailService = async () => {
    const content = await fs.readFile(CREDENTIALS_PATH);
    // @ts-ignore
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials?.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0],
    );

    const tokenContent = await fs.readFile(TOKEN_PATH);
    // @ts-ignore
    const tokens = JSON.parse(tokenContent);
    oAuth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    return gmail;
  };
  encodeMessage = (message) => {
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  createMail = async (options) => {
    const mailComposer = new MailComposer(options);
    const message = await mailComposer.compile().build();
    return this.encodeMessage(message);
  };

  sendMail = async (options) => {
    const gmail = await this.getGmailService();
    const rawMessage = await this.createMail(options);
    return gmail.users.messages.send({
      userId: 'me',
      resource: {
        raw: rawMessage,
      },
    } as any);
  };
}
