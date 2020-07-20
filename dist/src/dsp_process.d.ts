/// <reference types="socket.io" />
import { NodeMessageInterceptor, Message, Requester, Connection } from './communication';
import { IPCServer } from './ipc';
import { NodeModule } from './core';
import { Graph } from './dsp';
import { VSTScanner } from './vst';
export declare class LocalNodeController extends NodeMessageInterceptor {
    private _autorestart;
    private _exec_known;
    private _exec_location;
    private _stdout_rl;
    private _stderr_rl;
    private _cp;
    private _ipc;
    constructor(options: any, ipc: IPCServer);
    target(): string;
    handleMessage(msg: Message, from_ipc: boolean): Promise<unknown>;
    getDSPExecutablePath(): string;
    getDSPProcessCommmand(): string;
    _await_start(timeout?: number): Promise<unknown>;
    _restart(): Promise<void>;
    kill(): Promise<void>;
    start(): Promise<void>;
}
export declare class DSPController extends NodeModule {
    destroy(): void;
    init(): void;
    start(remote: Connection): void;
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    _remote: Requester;
    _remote_graph: Requester;
    _running: boolean;
    _closed: boolean;
    _graph: Graph;
    _vst: VSTScanner;
    _connection: Connection;
    constructor(vst: VSTScanner);
    syncGraph(): Promise<void>;
    _try_dsp_start(): Promise<void>;
    waitStart(): Promise<void>;
}
