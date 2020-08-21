/// <reference types="node" />
/// <reference types="socket.io-client" />
import * as mdns from 'dnssd';
import { EventEmitter } from 'events';
import SocketIO from 'socket.io';
export declare function _log_msg(msg: Message, input: boolean, forward?: boolean): void;
export declare enum NODE_TYPE {
    DSP_NODE = 0,
    HTRK_BRIDGE_NODE = 1,
    RRCS_NODE = 2
}
export interface NodeIdentification {
    id: string;
    name: string;
    type: NODE_TYPE;
}
export declare enum MessageMode {
    GET = 0,
    SET = 1,
    DEL = 2,
    ALC = 3,
    RSP = 4,
    EVT = 5
}
export declare abstract class NodeMessageInterceptor extends EventEmitter {
    abstract target(): string;
    abstract handleMessage(msg: Message, from_ipc: boolean): Promise<any>;
    event(name: string, payload?: any): void;
}
export declare abstract class NodeMessageHandler extends EventEmitter {
    abstract send(msg: string): boolean;
}
export declare abstract class Connection extends EventEmitter {
    abstract begin(): void;
    abstract send(msg: Message): void;
    abstract isLocal(): boolean;
    _rejectors: ((reason?: any) => void)[];
    _do_request(req: boolean, tg: string, fld: string, timeout?: number, data?: any): Promise<Message>;
    request(tg: string, fld: string, timeout?: number, data?: any): Promise<Message>;
    set(tg: string, fld: string, timeout?: number, data?: any): Promise<Message>;
    getRequester(target: string): Requester;
    decodeMessage(str: string): void;
    connectionFound(): void;
    destroy(): void;
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
    static Event(tg: string, fld: string): Message;
    static parse(data: string): Message;
    setInt(i: number): this;
    setFloat(f: number): this;
    setString(s: string): this;
    setArray(arr: any[]): this;
}
export declare class TypedMessagePromise {
    private _p;
    constructor(p: Promise<Message>);
    private _check_or_throw;
    str(): Promise<string>;
    bool(): Promise<boolean>;
    obj(): Promise<object>;
    number(): Promise<number>;
    float(): Promise<number>;
    int(): Promise<number>;
}
export declare class Requester extends EventEmitter {
    request_target: string;
    connection: Connection;
    constructor(connection: Connection, target: string);
    request(value: string, data?: any): Promise<Message>;
    requestTyped(value: string, data?: any): TypedMessagePromise;
    requestTmt(value: string, timeout: number, data?: any): Promise<Message>;
    requestTypedWithTimeout(value: string, timeout: number, data?: any): TypedMessagePromise;
    set(value: string, data?: any): Promise<Message>;
    setTyped(value: string, data?: any): TypedMessagePromise;
    setTmt(value: string, timeout: number, data?: any): Promise<Message>;
    setTypedWithTimeout(value: string, timeout: number, data?: any): TypedMessagePromise;
    destroy(): void;
}
/**
 * Represents a connection to a server in the Node
 */
export declare class SINodeWSClient {
    private _state;
    private _browser;
    private _sock;
    private _new_socks;
    private _id;
    private _ws_interceptors;
    private _msg_interceptors;
    private _handler;
    constructor(config: any, handler: NodeMessageHandler, type: NODE_TYPE);
    _on_service_discovered(service: mdns.Service): void;
    _service_connect(service: mdns.Service): void;
    _service_reconnect(service: mdns.Service): void;
    _on_socket_connect(socket: SocketIOClient.Socket): void;
    _on_ack(): void;
    _on_socket_close(reason: string): void;
    _on_temp_socket_close(socket: SocketIOClient.Socket, reason: string): void;
    _on_msg(msg: string): void;
    _on_ipc_msg(msg: string): void;
    _ws_return_error(original_message: Message, err: string): void;
    _on_msg_impl(msg: string, to_ipc: boolean): void;
    _intc_handle_return(msg: Message, to_ipc: boolean, data: any): void;
    _intc_handle_return_error(msg: Message, to_ipc: boolean, data: any): void;
    _intc_emit_event(intc: NodeMessageInterceptor, name: string, payload: any): void;
    addIPCInterceptor(intc: NodeMessageInterceptor): void;
    addWSInterceptor(intc: NodeMessageInterceptor): void;
}
/**
 * Represents the connection to a node in the SI server
 */
export declare class SIServerWSSession extends Connection {
    remoteInfo(): string;
    begin(): void;
    send(msg: Message): void;
    isLocal(): boolean;
    private _state;
    private _sock;
    private _id;
    private _server;
    constructor(socket: SocketIO.Socket, server: SIServerWSServer);
    _on_exchange_ids(id: NodeIdentification): void;
    _on_disconnect(): void;
    _on_msg(msg: string): void;
    id(): NodeIdentification;
    close(): void;
}
/**
 * Communications server class
 */
export declare class SIServerWSServer extends EventEmitter {
    private _io;
    private _http;
    private _mdns_advertiser;
    private _new_sessions;
    private _sessions;
    /**
     * construct a new WebSocket server to communicate with SI DSP Nodes
     * @param options options, merged from config file and command line options
     */
    constructor(config: any);
    private _on_connection;
    _on_disconnect(session: SIServerWSSession): void;
    _on_session_online(session: SIServerWSSession): void;
    addFromNewSessions(session: SIServerWSSession): void;
    destruct(): void;
}
