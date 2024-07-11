import { Inject, Logger, UnauthorizedException } from '@nestjs/common';

const approvedMessages = ['Too many attempts, try again in 15 minutes.'];

export function UnauthorizedHandler(): MethodDecorator {
  const logger = new Logger()

  return function (_, name: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args) {
      try {
        return await method.apply(this, args);
      } catch (e) {
        logger.error(e.message, _.constructor.name)


        throw new UnauthorizedException(
          approvedMessages.some((el) => el === e.message)
            ? e.message
            : undefined,
        );
      }
    };
    return descriptor;
  };
}
