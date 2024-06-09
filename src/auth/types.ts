export interface SmsResponse {
  body: string;
  errorMessage: string | null;
  oneTimePassword: string;
}
