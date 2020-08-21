/// <reference types="socket.io" />
import { ServerModule } from "./core";
import { Application } from "express";
export declare class RestService extends ServerModule {
    constructor();
    registerRoutes(app: Application): void;
    init(): void;
    joined(socket: SocketIO.Socket): void;
    left(socket: SocketIO.Socket): void;
}
