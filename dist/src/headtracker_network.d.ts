/// <reference types="node" />
import { Socket } from 'dgram';
import { Headtracker, HeadtrackerInvertation, HeadtrackerNetworkSettings, HeadtrackerConfigPacket } from './headtracker';
import WebInterface from './web_interface';
declare enum HTRKDevState {
    INITIALIZING = 0,
    CONNECTED = 1,
    CONNECTING = 2,
    BUSY = 3,
    TIMEOUT = 4,
    ID_CONFLICT = 5,
    DISCONNECTED = 6
}
declare enum HTRKMsgState {
    WAITING = 0,
    SAVING = 1,
    READY = 2
}
export declare class NetworkHeadtracker extends Headtracker {
    msg_state: HTRKMsgState;
    update_required: boolean;
    dumping: boolean;
    resetting_orientation: boolean;
    remote: {
        conf?: HeadtrackerConfigPacket;
        state?: HTRKDevState;
        id?: number;
        addr?: string;
        port?: number;
    };
    local: {
        conf?: HeadtrackerConfigPacket;
        port?: number;
        netif?: string;
    };
    response_timeout: NodeJS.Timeout;
    check_alive_timeout: NodeJS.Timeout;
    socket: Socket;
    webif: WebInterface;
    constructor(server: WebInterface, id: number, addr: string, port: number, netif?: string);
    _onClose(): void;
    _onError(e: Error): void;
    _onListening(): void;
    _onMessage(m: Buffer): void;
    _onResponseTimeout(): void;
    _connect(): void;
    _disconnect(): void;
    _handleStateUpdate(m: HeadtrackerConfigPacket, is_req: boolean): void;
    _askStillAlive(): void;
    _askAliveLater(): void;
    _updateDevice(): boolean;
    _updateDeviceNow(): void;
    _sendConfig(m: HeadtrackerConfigPacket): void;
    _sendDataDumpRequest(): void;
    _send(p: HeadtrackerConfigPacket): void;
    _state(s?: HTRKDevState): HTRKDevState | boolean;
    _setState(s: HTRKDevState): void;
    _updateRemote(): void;
    setID(id: number): void;
    setSamplerate(rate: number): void;
    setStreamDest(ip: string, port: number): void;
    setInvertation(invertation: HeadtrackerInvertation): void;
    resetOrientation(): void;
    calibrate(): Promise<void>;
    beginInit(): Promise<void>;
    finishInit(): Promise<void>;
    applyNetworkSettings(settings: HeadtrackerNetworkSettings): void;
    save(): void;
    reboot(): void;
    enableTx(): void;
    disableTx(): void;
    destroy(): void;
    isOnline(): boolean;
    start(): void;
}
export {};
