import { generateToken04 } from '@/libs/token-generator';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Check, User, UserId } from './dto/user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { Response } from 'express';
const JWT_ACCESS_TOKEN_SECRET = 'JWT_ACCESS_TOKEN_SECRET';
const JWT_ACCESS_TOKEN_EXPIRES = 'JWT_ACCESS_TOKEN_EXPIRES';
export const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN_KEY';

@Injectable()
export class UsersService {
   constructor(
      private configService: ConfigService,
      private prisma: PrismaService,
      private jwtService: JwtService,
   ) {}

   checkOne = async (data: Check, response: Response) => {
      try {
         const { email } = data;
         const user = await this.prisma.user.findUnique({
            where: { email },
         });
         if (!user) return { message: 'User not found', status: false };

         const info = { sub: 'token login', iss: 'from server' };

         const payload = { ...info, email };
         const access_token = this.createAccessToken(payload);
         /*   const refresh_token = this.createRefreshToken(payload); */
         await this.updateAccessToken(access_token, user.id);
         /* set cookies */
         response.clearCookie(ACCESS_TOKEN_KEY);
         response.cookie(ACCESS_TOKEN_KEY, access_token, {
            httpOnly: true,
            maxAge: this.getExpirationTimeAccessToken(),
         });
         return {
            message: 'User found',
            status: true,
            data: {
               user: { ...user, refresh_token: undefined },
               accessToken: access_token,
            },
         };
      } catch (error) {
         console.log('❄️ ~ file: users.service.ts:39 ~ error:', error);
         throw new HttpException(
            { message: 'Something went wrong', status: false },
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   };
   registerOne = async (data: User, response: Response) => {
      try {
         const { email, name, profileImage, about } = data;
         const check = await this.prisma.user.findFirst({
            where: { email },
         });
         if (check)
            throw new HttpException(
               { message: 'Email existing', status: false },
               HttpStatus.CONFLICT,
            );
         const res = await this.prisma.user.create({
            data: { email, name, profileImage, about },
         });
         const info = { sub: 'token login', iss: 'from server' };
         const payload = { ...info, email };
         const access_token = this.createAccessToken(payload);
         await this.updateAccessToken(access_token, res.id);
         response.clearCookie(ACCESS_TOKEN_KEY);
         response.cookie(ACCESS_TOKEN_KEY, access_token, {
            httpOnly: true,
            maxAge: this.getExpirationTimeAccessToken(),
         });
         return { message: 'Success', status: true, data: res };
      } catch (error) {
         console.log('❄️ ~ file: users.service.ts:67 ~ error:', error);
         throw new HttpException(
            {
               message: error?.response?.message || 'Something went wrong',
               status: false,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   };
   findAll = async () => {
      try {
         const users = await this.prisma.user.findMany({
            orderBy: { name: 'asc' },
         });
         const usersGroupByInitialLetter: { [initialLetter: string]: User[] } =
            {};
         users.forEach((user) => {
            const initialLetter = user.name.charAt(0).toUpperCase();
            if (!usersGroupByInitialLetter[initialLetter]) {
               usersGroupByInitialLetter[initialLetter] = [];
            }
            usersGroupByInitialLetter[initialLetter].push(user);
         });
         return {
            data: usersGroupByInitialLetter,
            status: true,
            message: 'Success',
         };
      } catch (error) {
         return new HttpException(
            { message: 'Something went wrong', status: false },
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   };

   async refresh(cookie: string, response: Response) {
      try {
         await this.jwtService.verifyAsync(cookie, {
            secret: this.configService.get<string>(JWT_ACCESS_TOKEN_SECRET),
         });

         const user = await this.prisma.user.findFirst({
            where: { accessToken: cookie },
         });

         if (!user)
            throw new HttpException(
               { message: 'Invalid user', status: false },
               HttpStatus.BAD_REQUEST,
            );
         /*   const result = await this.checkOne({ email: user.email }, response); */
         return {
            /*             data: result, */
            status: true,
            message: 'Success',
         };
      } catch (err) {
         throw new HttpException(
            {
               message:
                  err?.response?.message ||
                  'Token expired or invalid, please login!',
               status: false,
            },
            HttpStatus.UNAUTHORIZED,
         );
      }
   }

   generateToken = (data: UserId) => {
      try {
         const { userId } = data;
         const appId = parseInt(
            this.configService.get<string>('ZEGO_APPID') as string,
         );
         const secret = this.configService.get<string>('ZEGO_SECRET') as string;
         const effectiveTime = 3600;
         const payload = '';

         if (!appId && !secret) {
            return { message: 'AppId, secret are required', status: false };
         }
         const token = generateToken04(
            appId,
            effectiveTime,
            userId,
            secret,
            payload,
         );
         return { message: 'Success', status: true, data: token };
      } catch (error) {
         console.log('❄️ ~ file: users.service.ts:93 ~ error:', error);
         throw new HttpException(
            { message: 'Something went wrong', status: false },
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   };

   updateAccessToken = async (accessToken: string, id: number) => {
      const res = await this.prisma.user.updateMany({
         where: { id },
         data: {
            accessToken,
         },
      });
      return res;
   };

   /*    createRefreshToken = (payload: any) => {
      return this.jwtService.sign(payload, {
         secret: this.configService.get<string>(JWT_ACCESS_TOKEN_SECRET),
         expiresIn:
            ms(
               this.configService.get<string>(
                  JWT_ACCESS_TOKEN_EXPIRES,
               ) as string,
            ) / 1000,
      });
   }; */

   createAccessToken = (payload: any) => {
      return this.jwtService.sign(payload, {
         secret: this.configService.get<string>(JWT_ACCESS_TOKEN_SECRET),
         expiresIn:
            ms(
               this.configService.get<string>(
                  JWT_ACCESS_TOKEN_EXPIRES,
               ) as string,
            ) / 1000,
      });
   };
   getExpirationTimeAccessToken = () => {
      return (
         ms(
            this.configService.get<string>(JWT_ACCESS_TOKEN_EXPIRES) as string,
         ) * 1000
      );
   };
}
