import SocketIO from 'socket.io';
interface WEBIFEventHandler {
    thisarg: any;
    handler: (...args: any[]) => void;
    event: string;
}
export default class WebInterface {
    private _http;
    private _expressapp;
    private _webif_root;
    constructor(options: any);
    reportDispatchError(error_string: string, command: string): void;
    attachHandler(thisarg: any, module: string, event: string, handler: any): void;
    _handlers: WEBIFEventHandler[];
    io: SocketIO.Server;
}
export {};
