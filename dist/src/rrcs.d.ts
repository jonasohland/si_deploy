/// <reference types="node" />
/// <reference types="socket.io" />
import { RRCSServerType } from 'riedel_rrcs';
import { ServerModule } from './core';
import { Socket } from 'dgram';
export declare class RRCSModule extends ServerModule {
    rrcssrv: RRCSServerType;
    local_sock: Socket;
    config: any;
    init(): void;
    joined(socket: SocketIO.Socket): void;
    left(socket: SocketIO.Socket): void;
    constructor(config: any);
    reconnectRRCS(): void;
    startRRCS(): void;
    processOSCCommand(cmd: string[]): void;
    processStringCommand(str: string): void;
    processHeadtrackerCommand(cmd: string[]): void;
    processHeadtrackerOffCommand(cmd: string[]): void;
    processStringOffCommand(str: string): void;
    /**
     * RRCS handlers
     */
    initial(msg: any, error: any): void;
    log(msg: any): void;
    error(err: any): void;
    getAlive(msg: any): boolean;
    crosspointChange(params: any): void;
    sendString(params: any): void;
    sendStringOff(params: any): void;
    gpInputChange(params: any): void;
    logicSourceChange(params: any): void;
    configurationChange(params: any): void;
    upstreamFailed(params: any): void;
    upstreamFaieldCleared(params: any): void;
    downstreamFailed(params: any): void;
    downstreamFailedCleared(params: any): void;
    nodeControllerFailed(params: any): void;
    nodeControllerReboot(params: any): void;
    clientFailed(params: any): void;
    clientFailedCleared(params: any): void;
    portInactive(params: any): void;
    portActive(params: any): void;
    connectArtistRestored(params: any): void;
    connectArtistFailed(params: any): void;
    gatewayShutdown(params: any): void;
    notFound(params: any): void;
}
