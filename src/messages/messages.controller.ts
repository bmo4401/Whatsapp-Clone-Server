import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AddMessages, QueryMessages, Url, UserId } from './dto/message.dto';
import { MessagesService } from './messages.service';

@Controller('message')
export class MessagesController {
   constructor(private readonly messagesService: MessagesService) {}

   @Post('/add-message')
   addMessages(@Body() data: AddMessages) {
      return this.messagesService.addMessages(data);
   }

   @Get('/get-message/:from/:to')
   getMessages(@Param() params: QueryMessages) {
      return this.messagesService.getMessages(params);
   }

   @Post('/add-image-message')
   addImageMessage(@Query() query: QueryMessages, @Body() file: any) {
      return this.messagesService.addImageMessage(query, file);
   }
   @Post('/add-audio-message')
   addAudioMessage(@Query() query: QueryMessages, @Body() file: any) {
      return this.messagesService.addAudioMessage(query, file);
   }
   @Get('/get-initial-contacts/:userId')
   getInitialContactsWithMessages(@Param() params: UserId) {
      return this.messagesService.getInitialContactsWithMessages(params);
   }
}
