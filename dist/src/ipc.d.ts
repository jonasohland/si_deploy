/// <reference types="node" />
import Net from 'net';
import { NodeMessageHandler } from './communication';
export declare class IPCServer extends NodeMessageHandler {
    _name: string;
    _server: Net.Server;
    _pipe: Net.Socket;
    constructor(name?: string);
    _create_server(name: string): void;
    _on_msg(msg: string): void;
    send(msg: string): boolean;
    connected(): boolean;
}
