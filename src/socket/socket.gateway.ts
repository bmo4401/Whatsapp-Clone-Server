import SOCKET from '@/src/libs/constant';
import { ConfigService } from '@nestjs/config';
import {
   ConnectedSocket,
   MessageBody,
   OnGatewayConnection,
   SubscribeMessage,
   WebSocketGateway,
   WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GlobalService } from '../global.service';
const configService = new ConfigService();
@WebSocketGateway({
   cors: {
      origin: configService.get<string>('FONTEND_URL') as string,
   },
})
export class EventsGateway implements OnGatewayConnection {
   @WebSocketServer() server: Server;

   handleConnection() {
      console.log('connected');
   }

   @SubscribeMessage(SOCKET['ADD-USER'])
   identity(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
      GlobalService.onlineUsers.set(userId, client.id);
      this.server.sockets.emit(SOCKET['ONLINE-USERS'], {
         onlineUsers: Array.from(GlobalService.onlineUsers.keys()),
      });
   }

   @SubscribeMessage(SOCKET['SIGN-OUT'])
   signOut(@MessageBody() userId: string) {
      GlobalService.onlineUsers.delete(userId);
      this.server.sockets.emit(SOCKET['ONLINE-USERS'], {
         onlineUsers: undefined,
      });
   }

   @SubscribeMessage(SOCKET['SEND-MSG'])
   receiveMessage(@MessageBody() data: any) {
      const sendUserSocket = GlobalService.onlineUsers.get(data.to);

      if (sendUserSocket)
         this.server.sockets.to(sendUserSocket).emit(SOCKET['MSG-RECEIVE'], {
            from: data.from,
            message: data.message,
         });
   }

   @SubscribeMessage(SOCKET['OUTGOING-VOICE-CALL'])
   outgoingVoiceCall(@MessageBody() data: any) {
      const sendUserSocket = GlobalService.onlineUsers.get(data.to);
      if (sendUserSocket) {
         this.server.sockets
            .to(sendUserSocket)
            .emit(SOCKET['INCOMING-VOICE-CALL'], {
               from: data.from,
               roomId: data.roomId,
               callType: data.callType,
            });
      }
   }

   @SubscribeMessage(SOCKET['OUTGOING-VIDEO-CALL'])
   outgoingVideoCall(@MessageBody() data: any) {
      const sendUserSocket = GlobalService.onlineUsers.get(data.to);

      if (sendUserSocket) {
         this.server.sockets
            .to(sendUserSocket)
            .emit(SOCKET['INCOMING-VIDEO-CALL'], {
               from: data.from,
               roomId: data.roomId,
               callType: data.callType,
            });
      }
   }

   @SubscribeMessage(SOCKET['REJECT-VOICE-CALL'])
   rejectVoiceCall(@MessageBody() data: any) {
      const sendUserSocket = GlobalService.onlineUsers.get(data.from);
      if (sendUserSocket) {
         this.server.sockets
            .to(sendUserSocket)
            .emit(SOCKET['VOICE-CALL-REJECTED']);
      }
   }

   @SubscribeMessage(SOCKET['REJECT-VIDEO-CALL'])
   rejectVideoCall(@MessageBody() data: any) {
      const sendUserSocket = GlobalService.onlineUsers.get(data.from);
      if (sendUserSocket) {
         this.server.sockets
            .to(sendUserSocket)
            .emit(SOCKET['VIDEO-CALL-REJECTED']);
      }
   }

   @SubscribeMessage(SOCKET['ACCEPT-INCOMING-CALL'])
   acceptIncoming(@MessageBody() data: any) {
      const sendUserSocket = GlobalService.onlineUsers.get(data.id);
      if (sendUserSocket) {
         this.server.sockets
            .to(sendUserSocket)
            .emit(SOCKET['INCOMING-CALL-ACCEPTED']);
      }
   }
}
