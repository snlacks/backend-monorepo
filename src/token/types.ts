import { CookieOptions, Response } from 'express';

export interface CookieSetter {
  (name: string, val: string, options: CookieOptions): Response<any, Cookies>;
}

export type Cookies = Record<string, any>;
