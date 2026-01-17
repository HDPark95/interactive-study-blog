declare module 'sockjs-client' {
  export default class SockJS {
    constructor(url: string, _reserved?: any, options?: {
      server?: string;
      transports?: string | string[];
      sessionId?: number | (() => string);
      timeout?: number;
    });

    close(code?: number, reason?: string): void;
    send(data: string): void;

    onopen: ((e: Event) => void) | null;
    onmessage: ((e: MessageEvent) => void) | null;
    onclose: ((e: CloseEvent) => void) | null;
    onerror: ((e: Event) => void) | null;

    readyState: number;
    protocol: string;
    url: string;

    static CONNECTING: number;
    static OPEN: number;
    static CLOSING: number;
    static CLOSED: number;
  }
}
