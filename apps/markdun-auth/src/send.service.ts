import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as path from 'path';

export const MARKDUN_TRASNPORTER_KEY = 'MARKDUN_TRASNPORTER_KEY';

export interface INodemailerTransporter {
  sendMail: (options: { to; body; text }) => any;
}

const setTransporter = async () => {
  const dkimPrivateKey = await fs.readFile(
    path.join(process.cwd(), process.env.MARKDUN_EMAIL_DKIM_PRIVATE_KEY_PATH),
  );
  return nodemailer.createTransport({
    host: process.env.MARKDUN_EMAIL_HOST,
    port: process.env.MARKDUN_EMAIL_PORT,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.MARKDUN_EMAIL_USERNAME,
      pass: process.env.MARKDUN_EMAIL_PASSWORD,
    },
    dkim: {
      domainName: 'markdun.com',
      keySelector: 'default',
      privateKey: dkimPrivateKey.toString,
    },
  });
};

@Injectable()
export class SendService {
  constructor() {}
  transporter: INodemailerTransporter;
  async send(options) {
    const sendEmail = async () => {
      if (!this.transporter || !this.transporter.sendMail) {
        this.transporter = await setTransporter();
      }
      this.transporter.sendMail({
        ...options,
        from: 'Info <info@markdun.com>',
      });
    };
    sendEmail();
    return;
  }
}
