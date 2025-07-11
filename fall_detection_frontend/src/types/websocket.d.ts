declare module 'sockjs-client' {
  import { WebSocket } from 'ws';
  export = WebSocket;
}

declare module '@stomp/stompjs' {
  export interface Client {
    webSocketFactory?: () => WebSocket;
    reconnectDelay?: number;
    onConnect?: () => void;
    onDisconnect?: () => void;
    activate(): void;
    deactivate(): void;
    publish(options: { destination: string; body: string }): void;
    subscribe(destination: string, callback: (message: any) => void): void;
  }

  export class Client {
    constructor(options?: any);
  }
} 