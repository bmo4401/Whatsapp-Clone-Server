import { Cookie, ResponseMessage } from '@/src/decorators/customize';
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { Check, User, UserId } from './dto/user.dto';
import { ACCESS_TOKEN_KEY, UsersService } from './users.service';
@Controller('auth')
export class UsersController {
   constructor(private readonly usersService: UsersService) {}

   @Post('/check')
   @ResponseMessage('Check if the user exists or not.')
   checkOne(
      @Body() data: Check,
      @Res({ passthrough: true }) response: Response,
   ) {
      return this.usersService.checkOne(data, response);
   }

   @Get('/refresh')
   @ResponseMessage('Refresh Page')
   refresh(
      @Cookie(ACCESS_TOKEN_KEY) cookie: string,
      @Res({ passthrough: true }) response: Response,
   ) {
      return this.usersService.refresh(cookie, response);
   }

   @Post('/register')
   @ResponseMessage('Register new user.')
   registerOne(
      @Body() data: User,
      @Res({ passthrough: true }) response: Response,
   ) {
      return this.usersService.registerOne(data, response);
   }

   @Get('/get-contacts')
   @ResponseMessage('Get all current contact users.')
   findAll() {
      return this.usersService.findAll();
   }

   @Get('/generate-token/:userId')
   @ResponseMessage('Generate ZegoCloud token')
   generateToken(@Param() params: UserId) {
      return this.usersService.generateToken(params);
   }
}
