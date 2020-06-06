/// <reference types="node" />
/// <reference types="socket.io-client" />
import EventEmitter from 'events';
import Net from 'net';
import * as IOServer from 'socket.io';
export declare enum MessageMode {
    GET = 0,
    SET = 1,
    DEL = 2,
    ALC = 3,
    RSP = 4,
    EVT = 5
}
export declare class Message {
    target: string;
    field: string;
    err?: string;
    mode: MessageMode;
    data: number | string | object;
    constructor(tg: string, fld: string, md: MessageMode);
    copy(): Message;
    toString(): string;
    isError(): boolean;
    static Set(tg: string, fld: string): Message;
    static Get(tg: string, fld: string): Message;
    static Del(tg: string, fld: string): Message;
    static Alc(tg: string, fld: string): Message;
    static Rsp(tg: string, fld: string): Message;
    static parse(data: string): Message;
    setInt(i: number): this;
    setFloat(f: number): this;
    setString(s: string): this;
    setArray(arr: any[]): this;
}
export declare class Requester extends EventEmitter {
    request_target: string;
    connection: Connection;
    constructor(connection: Connection, target: string);
    request(value: string, data?: any): Promise<Message>;
    requestTmt(value: string, timeout: number, data?: any): Promise<Message>;
    set(value: string, data?: any): Promise<Message>;
    setTmt(value: string, timeout: number, data?: any): Promise<Message>;
}
export declare abstract class Connection extends EventEmitter {
    abstract begin(): void;
    abstract send(msg: Message): void;
    abstract isLocal(): boolean;
    _do_request(req: boolean, tg: string, fld: string, timeout?: number, data?: any): Promise<Message>;
    request(tg: string, fld: string, timeout?: number, data?: any): Promise<Message>;
    set(tg: string, fld: string, timeout?: number, data?: any): Promise<Message>;
    getRequester(target: string): Requester;
    decodeMessage(str: string): void;
    connectionFound(): void;
}
export declare class LocalConnection extends Connection {
    socket: Net.Socket;
    name: string;
    old_data: Buffer;
    constructor(name: string);
    isLocal(): boolean;
    begin(): void;
    send(msg: Message): void;
}
export declare class RemoteConnection extends Connection {
    socket: IOServer.Socket;
    constructor(socket: IOServer.Socket);
    begin(): void;
    send(msg: Message): void;
    isLocal(): boolean;
}
export declare class IPCBridge extends EventEmitter {
    ipc_socket: Net.Socket;
    ipc_server: Net.Server;
    socket: SocketIOClient.Socket;
    name: string;
    connected: boolean;
    last_server_addr: string;
    constructor(socket: SocketIOClient.Socket, addr: string, name: string);
    begin(): void;
    reset(): void;
}
