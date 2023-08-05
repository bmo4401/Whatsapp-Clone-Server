import { Injectable } from '@nestjs/common';

@Injectable()
export class GlobalService {
   static onlineUsers = new Map();
}
