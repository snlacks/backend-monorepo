export interface SmsResponse extends HasOneTimePassword {
  body: string;
}

export interface HasOneTimePassword {
  oneTimePassword: { oneTimePassword: string } & HasHashSalt;
}

export interface HasHashSalt {
  hash: string;
  salt: string;
}
