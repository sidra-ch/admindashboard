import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/tracking',
})
export class TrackingGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('subscribe:tenant')
  handleSubscribeTenant(
    @MessageBody() data: { tenantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`tenant:${data.tenantId}`);
    return { success: true };
  }

  @SubscribeMessage('unsubscribe:tenant')
  handleUnsubscribeTenant(
    @MessageBody() data: { tenantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`tenant:${data.tenantId}`);
    return { success: true };
  }

  emitLocationUpdate(tenantId: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit('car.location.updated', data);
  }
}
