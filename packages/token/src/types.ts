export type Cookies = Record<string, any>;

export interface HasOneTimePassword {
  oneTimePassword: { oneTimePassword: string } & HasHashSalt;
}

export interface HasHashSalt {
  hash: string;
  salt: string;
}
