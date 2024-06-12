import { Logger, UnauthorizedException } from '@nestjs/common';

export function UnauthorizedHandler(): MethodDecorator {
  return function (_, name: string, descriptor: PropertyDescriptor) {
    const logger = new Logger(`${_.constructor.name}.${name}`, {});
    const method = descriptor.value;

    descriptor.value = async function (...args) {
      try {
        return await method.apply(this, args);
      } catch (e) {
        logger.error(e);
        throw new UnauthorizedException();
      }
    };
    return descriptor;
  };
}
