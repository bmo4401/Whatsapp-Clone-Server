import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesModule } from './messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';
import { SocketModule } from './socket/socket.module';
import { UsersModule } from './users/users.module';

@Module({
   imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      UsersModule,
      MessagesModule,
      PrismaModule,
      SocketModule,
   ],
   controllers: [AppController],
   providers: [AppService],
})
export class AppModule {}
