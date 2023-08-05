import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GlobalService } from '../global.service';
import { AddMessages, QueryMessages, Url, UserId } from './dto/message.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
   constructor(private prisma: PrismaService) {}
   addMessages = async (data: AddMessages) => {
      try {
         const { message, from, to } = data;
         const getUser = GlobalService.onlineUsers.get(to);
         if (message && from && to) {
            const newMessage = await this.prisma.messages.create({
               data: {
                  message: message,
                  sender: {
                     connect: {
                        id: parseInt(from),
                     },
                  },
                  receiver: {
                     connect: {
                        id: parseInt(to),
                     },
                  },
                  messageStatus: getUser ? 'delivered' : 'sent',
               },
               include: {
                  sender: true,
                  receiver: true,
               },
            });
            return { message: 'Success', status: true, data: newMessage };
         }
         throw new HttpException(
            { message: 'Missing parameters.', status: false },
            HttpStatus.BAD_REQUEST,
         );
      } catch (error) {
         throw new HttpException(
            { message: 'Something went wrong', status: false },
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   };

   getMessages = async (data: QueryMessages) => {
      try {
         const { from, to } = data;
         if (from && to) {
            const messages = await this.prisma.messages.findMany({
               where: {
                  OR: [
                     {
                        senderId: parseInt(from),
                        receiverId: parseInt(to),
                     },
                     {
                        senderId: parseInt(to),
                        receiverId: parseInt(from),
                     },
                  ],
               },

               orderBy: {
                  id: 'asc',
               },
            });
            const unreadMessages: any = [];
            messages.forEach((message, idx) => {
               if (
                  message.messageStatus !== 'read' &&
                  message.senderId === parseInt(to)
               ) {
                  messages[idx].messageStatus = 'read';
                  unreadMessages.push(message.id);
               }
            });

            await this.prisma.messages.updateMany({
               where: { id: { in: unreadMessages } },
               data: {
                  messageStatus: 'read',
               },
            });
            return { message: 'Success', status: true, data: messages };
         }
         throw new HttpException(
            { message: 'Missing parameters.', status: false },
            HttpStatus.BAD_REQUEST,
         );
      } catch (error) {
         throw new HttpException(
            { message: 'Something went wrong', status: false },
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   };

   addImageMessage = async (query: QueryMessages, file: Url) => {
      try {
         const { from, to } = query;
         const { url } = file;
         const message = await this.prisma.messages.create({
            data: {
               message: url,
               sender: {
                  connect: {
                     id: parseInt(from),
                  },
               },
               receiver: {
                  connect: {
                     id: parseInt(to),
                  },
               },
               type: 'image',
            },
         });
         return { message: 'Success', status: true, data: message };
      } catch (error) {
         throw new HttpException(
            { message: 'Something went wrong', status: false },
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   };

   addAudioMessage = async (query: QueryMessages, file: Url) => {
      try {
         const { from, to } = query;
         const { url } = file;
         console.log('❄️ ~ file: messages.service.ts:134 ~ url:', url);
         const message = await this.prisma.messages.create({
            data: {
               message: url,
               sender: {
                  connect: {
                     id: parseInt(from),
                  },
               },
               receiver: {
                  connect: {
                     id: parseInt(to),
                  },
               },
               type: 'audio',
            },
         });
         return { message: 'Success', status: true, data: message };
      } catch (error) {
         console.log('❄️ ~ file: messages.service.ts:152 ~ error:', error);
         throw new HttpException(
            { message: 'Something went wrong', status: false },
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   };
   /* target return contactUsers & onlineUsers */
   getInitialContactsWithMessages = async (params: UserId) => {
      try {
         const { userId } = params;
         const user = await this.prisma.user.findUnique({
            where: {
               id: parseInt(userId),
            },
            include: {
               sentMessages: {
                  include: {
                     receiver: true,
                     sender: true,
                  },
                  orderBy: {
                     createdAt: 'desc',
                  },
               },
               receiverMessages: {
                  include: {
                     receiver: true,
                     sender: true,
                  },
                  orderBy: {
                     createdAt: 'desc',
                  },
               },
            },
         });
         if (!user)
            throw new HttpException(
               { message: 'User not found.', status: false },
               HttpStatus.NOT_FOUND,
            );
         const messages = [...user.sentMessages, ...user.receiverMessages];

         messages.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
         const users = new Map();
         const messageStatusChange: any = [];
         messages.forEach((msg) => {
            const isSender = msg.senderId === parseInt(userId);
            const calculateId = isSender ? msg.receiverId : msg.senderId;
            if (msg.messageStatus === 'sent') {
               messageStatusChange.push(msg.id);
            }
            /* if user don't send message */
            if (!users.get(calculateId)) {
               const {
                  id,
                  senderId,
                  receiverId,
                  message,
                  type,
                  messageStatus,
                  createdAt,
                  receiver,
                  sender,
               } = msg;
               let user = {
                  id,
                  message,
                  messageStatus,
                  receiverId,
                  senderId,
                  receiver,
                  sender,
                  type,
                  createdAt,
                  totalUnreadMessages: 0,
               };
               //if user sent messages
               if (isSender) {
                  user = {
                     ...user,
                     totalUnreadMessages: 0,
                  };
               } else {
                  user = {
                     ...user,
                     totalUnreadMessages: messageStatus !== 'read' ? 1 : 0,
                  };
               }
               users.set(calculateId, { ...user });
            } else if (msg.messageStatus !== 'read' && !isSender) {
               const user = users.get(calculateId);
               users.set(calculateId, {
                  ...user,
                  totalUnreadMessages: user.totalUnreadMessages + 1,
               });
            } else if (msg.messageStatus !== 'read') {
               const user = users.get(calculateId);
               users.set(calculateId, {
                  ...user,
               });
            } else {
               const user = users.get(calculateId);
               users.set(calculateId, {
                  ...user,
                  totalUnreadMessages: user.totalUnreadMessages,
               });
            }
         });
         if (messageStatusChange.length) {
            await this.prisma.messages.updateMany({
               where: {
                  id: { in: messageStatusChange },
               },
               data: {
                  messageStatus: 'delivered',
               },
            });
         }
         return {
            message: 'Success.',
            status: true,
            data: {
               users: Array.from(users.values()).sort(
                  (a, b) => Number(b.createdAt) - Number(a.createdAt),
               ),
               onlineUsers: Array.from(GlobalService.onlineUsers.keys()),
            },
         };
      } catch (error) {
         throw new HttpException(
            { message: 'Something went wrong', status: false },
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   };
}
