import { SetMetadata } from '@nestjs/common';

export const FOR_DEV_ONLY = 'FOR_DEV_ONLY';
export const ForDevOnly = () => SetMetadata(FOR_DEV_ONLY, true);
