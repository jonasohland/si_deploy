/// <reference types="socket.io" />
import winston from 'winston';
import Transport from 'winston-transport';
declare class RemoteConsoleTransport extends Transport {
    server: SocketIO.Server;
    constructor();
    attach(s: SocketIO.Server): void;
    log(info: any, callback: any): void;
}
export declare const rct: RemoteConsoleTransport;
export declare function get(module_name: string): winston.Logger;
export {};
