import { IsEmail, IsNotEmpty } from 'class-validator';
export class Check {
   @IsNotEmpty({ message: 'Email should not be empty.' })
   @IsEmail()
   email: string;
}

export class UserId {
   @IsNotEmpty({ message: 'User id should not be empty.' })
   userId: string;
}

export class User extends Check {
   @IsNotEmpty({ message: 'Name should not be empty.' })
   name: string;
   @IsNotEmpty({ message: 'Image should not be empty.' })
   profileImage: string;
   @IsNotEmpty({ message: 'About should not be empty.' })
   about: string;
}
