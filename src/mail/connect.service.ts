import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as MailComposer from 'nodemailer/lib/mail-composer';
import * as credentials from '../../_gmail_credentials.json';
import * as tokens from '../../_gmail_token.json';

@Injectable()
export default class ConnectService {
  getGmailService = async () => {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0],
    );
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
