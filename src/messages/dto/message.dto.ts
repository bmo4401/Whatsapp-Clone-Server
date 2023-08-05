import { OmitType } from '@nestjs/mapped-types';
import { Messages } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';

export class AddMessages {
   @IsNotEmpty({ message: 'Message should not be empty.' })
   message: string;
   @IsNotEmpty({ message: 'From id should not be empty.' })
   from: string;
   @IsNotEmpty({ message: 'To id should not be empty.' })
   to: string;
}

export class UserId {
   @IsNotEmpty({ message: 'User id should not be empty.' })
   userId: string;
}
export class Url {
   @IsNotEmpty({ message: 'Url should not be empty.' })
   url: string;
}

export class QueryMessages extends OmitType(AddMessages, [
   'message',
] as const) {}
export class MessageDto {
   messages: Messages;
}
