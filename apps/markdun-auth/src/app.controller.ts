import { Controller, Get } from '@nestjs/common';
import { Public } from '@snlacks/core/auth';

@Controller({})
export class AppController {
  @Get('/')
  @Public()
  hello() {
    return 'Hello world!';
  }
}
