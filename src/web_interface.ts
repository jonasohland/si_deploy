import history from 'connect-history-api-fallback';
import express from 'express';
import * as http from 'http';
import SocketIO from 'socket.io';

import * as Logger from './log';
import {defaultIF} from './util';
import { ServerModule } from './data';

const log = Logger.get('WEBINT');

function logany(...things: any)
{
    log.debug([...things ].join(' '));
}

interface WEBIFEventHandler {
    thisarg: any, handler: (...args: any[]) => void, event: string
}

export default class WebInterface extends ServerModule {
    
    init() {
        this.events.on('webif-node-notify', (nodeid: string, msg: string) => {
            let node = this.getNode(nodeid);
            if(node) {
                this.broadcastNotification(`NODE ${node.name()}`, msg);
                log.info(`NODE ${node.name()}: ${msg}`);
            } else 
                log.error(`Could not deliver notification from node ${nodeid}: Node not found. MSG: ${msg}`);
        });

        this.events.on('webif-node-warning', (nodeid: string, msg: string) => {
            let node = this.getNode(nodeid);
            if(node) {
                this.broadcastWarning(`NODE ${node.name()}`, msg);
                log.warn(`NODE ${node.name()}: ${msg}`);
            } else 
                log.error(`Could not deliver notification from node ${nodeid}: Node not found. MSG: ${msg}`);
        });

        this.events.on('webif-node-error', (nodeid: string, msg: string) => {
            let node = this.getNode(nodeid);
            if(node) {
                this.broadcastError(`NODE ${node.name()}`, msg);
                log.error(`NODE ${node.name()}: ${msg}`);
            } else 
                log.error(`Could not deliver notification from node ${nodeid}: Node not found. MSG: ${msg}`);
        });
    }

    private _http: http.Server;
    private _expressapp: express.Application;
    private _webif_root: string = __dirname + '/../../../interface/dist';

    constructor(options: any)
    {
        super('webinterface');
        this._expressapp = express();
        this._http       = http.createServer(this._expressapp);

        let static_middleware = express.static(this._webif_root);

        this._expressapp
            .use((req, res, next) => {
                log.debug(`Request: ` + req.path);
                next();
            })

                this._expressapp.use(static_middleware);
        this._expressapp.use(history(
            { disableDotRule : true, verbose : true, logger : logany }));
        this._expressapp.use(static_middleware);

        if (options.webserver !== false) {
            this._http.listen(options.webserver_port, options.web_interface);
            log.info(`Serving webinterface on ${
                defaultIF(options.web_interface)}:${options.webserver_port}`);
        }

        this.io = SocketIO.listen(45040);

        this.io.on('connect', socket => {
            this._handlers.forEach(
                handler => socket.on(
                    handler.event,
                    handler.handler.bind(handler.thisarg, socket)));
        });
    }

    reportDispatchError(error_string: string, command: string)
    {
    }

    error(err: any)
    {
        this.broadcastError("Server Error", err);
    }

    attachHandler(thisarg: any, module: string, event: string, handler: any)
    {
        log.debug(`Attach handler -${module}.${event}`);
        this._handlers.push(
            { thisarg, handler, event : `-${module}.${event}` });
    }

    broadcastNotification(title: string, message: string)
    {
        this.io.emit('notification', title, message);
    }  

    broadcastWarning(title: string, message: string)
    {
        this.io.emit('warning', title, message);
    } 

    broadcastError(title: string, err: any)
    {
        if(err instanceof Error) {
            this.io.emit('error', title, err.message);
        } 
        else if(typeof err == 'string') {
            this.io.emit('error', title, err);
        } else {
            log.error("Unrecognized error type: Error: " + err);
        }
    }  

    _handlers: WEBIFEventHandler[] = [];
    io: SocketIO.Server;
}