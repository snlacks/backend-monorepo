import { ROLE } from "./src/roles/roles";

export interface SmsResponse extends HasOneTimePassword {
  body: string;
}

export interface HasOneTimePassword {
  credentials: { oneTimePassword: string } & HasHashSalt;
}

export interface HasHashSalt {
  hash: string;
  salt: string;
}

export type EmailSendProps = {
  text: string;
  subject: string;
  html: string;
  to: string;
  from?: string;
};
export type EmailSender<T = any> = (props: EmailSendProps) => Promise<T>;

export type SmsSendProps = {
  body: string;
  to: string;
  from?: string;
};
export type SmsSender<T = any> = (props: SmsSendProps) => Promise<T>;

export class ISendService {
  constructor() {}
  send: EmailSender;
}

export class ISmsService {
  constructor() {}
  send: SmsSender;
}
export class IRole {
  role_id: ROLE;
  role_name: string;
}

export type IUser = {
  user_id: string;
  username: string;
  phone_number: string;
  roles: IRole[];
};
