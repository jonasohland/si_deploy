import SocketIO from 'socket.io';
import { Node, Server, ServerModule } from './core';
interface WEBIFEventHandler {
    thisarg: any;
    handler: (...args: any[]) => void;
    event: string;
}
export default class WebInterface extends ServerModule {
    private _http;
    private _expressapp;
    private _webif_root;
    private _server;
    private _clients;
    private _web_interface_advertiser;
    private _rest;
    joined(socket: SocketIO.Socket): void;
    left(socket: SocketIO.Socket): void;
    init(): void;
    constructor(options: any);
    checkServerHasSubscribers(module: string, topic: string): boolean;
    checkNodeHasSubscribers(nodeid: string, module: string, topic: string): boolean;
    doPublishNode(nodeid: string, module: string, topic: string, event: string, ...data: any[]): void;
    doPublishServer(module: string, topic: string, event: string, ...data: any[]): void;
    attachServer(server: Server): void;
    reportDispatchError(error_string: string, command: string): void;
    error(err: any): void;
    attachHandler(thisarg: any, module: string, event: string, handler: any): void;
    broadcastNotification(title: string, message: string): void;
    broadcastNodeNotification(node: Node, message: string): void;
    broadcastWarning(title: string, message: string): void;
    broadcastError(title: string, err: any): void;
    broadcastEvent(title: string, ...data: any[]): void;
    _handlers: WEBIFEventHandler[];
    io: SocketIO.Server;
}
export {};
