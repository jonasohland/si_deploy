/// <reference types="node" />
import EventEmitter from 'events';
export declare enum HTRKDevState {
    INITIALIZING = 0,
    CONNECTED = 1,
    CONNECTING = 2,
    BUSY = 3,
    TIMEOUT = 4,
    ID_CONFLICT = 5,
    DISCONNECTED = 6
}
export declare enum HeadtrackerConfigFlags {
    UPDATE = 1,
    REBOOT = 2,
    STREAM_ENABLED = 4,
    CALIBRATE = 8,
    RESET_WORLD = 16,
    NON_REQUEST = 64,
    DUMP_DATA = 128
}
export declare enum HeadtrackerNetworkFlags {
    DHCP = 1
}
export declare enum HeadtrackerStateFlags {
    GY_PRESENT = 1,
    GY_RDY = 2,
    RESET_ORIENTATION = 4,
    INVERT_X = 8,
    INVERT_Y = 16,
    INVERT_Z = 32
}
export interface HeadtrackerNetworkSettings {
    id: number;
    addr: string;
    subnet: string;
    dhcp: boolean;
}
export interface HeadtrackerInvertation {
    x: boolean;
    y: boolean;
    z: boolean;
}
export declare function stringToAddr(addr: string): number;
export declare function addrToString(addr: number): string;
export declare class EulerAngles {
    constructor(y: number, p: number, r: number);
    yaw: number;
    pitch: number;
    roll: number;
    toQuaternion(): Quaternion;
}
export declare class Quaternion {
    w: number;
    x: number;
    y: number;
    z: number;
    constructor(w: number, x: number, y: number, z: number);
    static fromBuffer(buffer: Buffer, offset: number): Quaternion;
    static fromInt16Buffer(buffer: Buffer, offset: number): Quaternion;
    toEuler(): EulerAngles;
}
export declare class HeadtrackerConfigPacket {
    device_config: number;
    network_config: number;
    device_state: number;
    sample_rate: number;
    stream_dest_addr: string;
    stream_dest_port: number;
    sequence_num: number;
    device_static_ip: string;
    device_static_subnet: string;
    constructor();
    setDeviceFlag(flag: HeadtrackerConfigFlags): HeadtrackerConfigPacket;
    clearDeviceFlag(flag: HeadtrackerConfigFlags): HeadtrackerConfigPacket;
    isDeviceFlagSet(flag: HeadtrackerConfigFlags): boolean;
    setNetworkFlag(flag: HeadtrackerNetworkFlags): HeadtrackerConfigPacket;
    clearNetworkFlag(flag: HeadtrackerNetworkFlags): HeadtrackerConfigPacket;
    isNetworkFlagSet(flag: HeadtrackerNetworkFlags): boolean;
    setStateFlag(flag: HeadtrackerStateFlags): HeadtrackerConfigPacket;
    clearStateFlag(flag: HeadtrackerStateFlags): HeadtrackerConfigPacket;
    isStateFlagSet(flag: HeadtrackerStateFlags): boolean;
    deviceID(): number;
    setDeviceID(id: number): void;
    toBuffer(): Buffer;
    static check(buf: Buffer): boolean;
    static fromBuffer(buf: Buffer): HeadtrackerConfigPacket;
}
export declare class HeadtrackerDataPacket {
    device_id: number;
    w: number;
    x: number;
    y: number;
    z: number;
    constructor(id: number, vals: [number, number, number, number]);
    static check(m: Buffer): void;
    static fromBuffer(m: Buffer): void;
    toBuffer(): Buffer;
    static newPacketFromFloatLEData(b: Buffer, dataoffs: number, id: number): Buffer;
    static newPackerFromInt16Data(b: Buffer, dataoffs: number, id: number): Buffer;
    getQuaternion(): Quaternion;
    getEuler(): EulerAngles;
}
export declare abstract class Headtracker extends EventEmitter {
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
    abstract setSamplerate(sr: number): void;
    abstract enableTx(): void;
    abstract disableTx(): void;
    abstract save(): void;
    abstract reboot(): void;
    abstract setInvertation(inv: HeadtrackerInvertation): void;
    abstract resetOrientation(): void;
    abstract calibrate(loops?: number, cb?: (prog: number, step: number) => void): Promise<void>;
    abstract beginInit(): Promise<void>;
    abstract finishInit(): Promise<void>;
    abstract applyNetworkSettings(settings: HeadtrackerNetworkSettings): void;
    abstract destroy(): void;
    abstract isOnline(): boolean;
    abstract setStreamDest(addr: string, port: number): void;
}
