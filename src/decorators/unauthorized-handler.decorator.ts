import { UnauthorizedException } from '@nestjs/common';

export function UnauthorizedHandler(): MethodDecorator {
  return function (_, name: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args) {
      try {
        return await method.apply(this, args);
      } catch {
        throw new UnauthorizedException();
      }
    };
    return descriptor;
  };
}
