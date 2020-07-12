import SocketIO from 'socket.io';
import { ServerModule, Node, Server } from './data';
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
    init(): void;
    constructor(options: any);
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
