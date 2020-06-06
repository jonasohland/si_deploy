/// <reference types="node" />
import * as dgram from 'dgram';
import { EventEmitter } from 'events';
import SerialPort from 'serialport';
import { Terminal } from 'terminal-kit';
import { Headtracker, HeadtrackerInvertation, HeadtrackerNetworkSettings, Quaternion } from './headtracker';
export declare class QuaternionContainer {
    _is_float: Boolean;
    _offset: number;
    _buf: Buffer;
    constructor(buf: Buffer, isFloat: boolean, offset: number);
    get(): Quaternion;
    float(): Boolean;
    data(): {
        buffer: Buffer;
        offset: number;
    };
}
export declare abstract class OutputAdapter extends EventEmitter {
    abstract process(q: QuaternionContainer): void;
}
export declare abstract class UDPOutputAdapter extends OutputAdapter {
    addr: string;
    port: number;
    socket: dgram.Socket;
    _cts: boolean;
    _bytes_to_send: number;
    _slow: boolean;
    constructor();
    setRemote(addr: string, port: number): void;
    sendData(data: Buffer): void;
    fullspeed(): void;
    slow(): void;
}
export declare class OSCOutputAdapter extends UDPOutputAdapter {
    output_q: boolean;
    output_e: boolean;
    q_addr: [string, string, string, string];
    e_addr: [string, string, string];
    setOutputEuler(do_output: boolean): void;
    setOutputQuaternions(do_output: boolean): void;
    setQuatAddresses(addrs: [string, string, string, string]): void;
    setEulerAddresses(addrs: [string, string, string]): void;
    process(qc: QuaternionContainer): void;
}
export declare class IEMOutputAdapter extends OSCOutputAdapter {
    constructor();
}
export interface HeadtrackerFirmware {
    base_path: string;
    checksum?: string;
    version: string;
}
export declare class FirmwareManager {
    firmwares: HeadtrackerFirmware[];
    validateFirmware(fw: HeadtrackerFirmware): Promise<void>;
    initialize(): Promise<unknown>;
    getLatest(): HeadtrackerFirmware;
}
declare enum si_gy_values {
    SI_GY_VALUES_MIN = 0,
    SI_GY_ID = 1,
    SI_GY_QUATERNION_FLOAT = 2,
    SI_GY_QUATERNION_INT16 = 3,
    SI_GY_SRATE = 4,
    SI_GY_ALIVE = 5,
    SI_GY_ENABLE = 6,
    SI_GY_CONNECTED = 7,
    SI_GY_FOUND = 8,
    SI_GY_VERSION = 9,
    SI_GY_HELLO = 10,
    SI_GY_RESET = 11,
    SI_GY_INV = 12,
    SI_GY_RESET_ORIENTATION = 13,
    SI_GY_INT_COUNT = 14,
    SI_GY_CALIBRATE = 15,
    SI_GY_INIT_BEGIN = 16,
    SI_GY_INIT_FINISH = 17,
    SI_GY_VALUES_MAX = 18
}
declare enum si_gy_message_types {
    SI_GY_MSG_TY_MIN = 10,
    SI_GY_GET = 11,
    SI_GY_SET = 12,
    SI_GY_NOTIFY = 13,
    SI_GY_RESP = 14,
    SI_GY_ACK = 15,
    SI_GY_MSG_TY_MAX = 16
}
declare abstract class SerialConnection extends EventEmitter {
    private _serial_state;
    private _serial_sync_count;
    private _serial_current_value_type;
    private _serial_current_msg_type;
    private _serial_buffer;
    serial_port: SerialPort;
    serial_init(port: SerialPort): void;
    abstract onValueRequest(ty: si_gy_values): Buffer;
    abstract onValueSet(ty: si_gy_values, data: Buffer): void;
    abstract onNotify(ty: si_gy_values, data: Buffer): void;
    abstract onACK(ty: si_gy_values): void;
    abstract onResponse(ty: si_gy_values, data: Buffer): void;
    protected closeSerialPort(): Promise<unknown>;
    protected openSerialPort(): void;
    serialNotify(val: si_gy_values): void;
    serialSet(val: si_gy_values, data: Buffer): void;
    serialReq(val: si_gy_values, data?: Buffer): void;
    readByte(next_byte: number): void;
    private _serial_write_message;
    private _serial_on_get_msg;
    private _serial_reset;
    private _serial_find_sync;
    private _serial_sync;
    private _serial_read_valtype;
    private _serial_read_msg_type;
    private _serial_read_value;
}
declare class HeadtrackerSerialReq {
    resolve?: (ret: Buffer) => void;
    nresolve?: () => void;
    reject: (reason: string) => void;
    buf?: Buffer;
    tm?: NodeJS.Timeout;
    vty: si_gy_values;
    mty: si_gy_message_types;
    tcnt: number;
    static newNotify(res: () => void, rej: () => void, val_ty: si_gy_values): HeadtrackerSerialReq;
    static newSet(res: () => void, rej: () => void, val_ty: si_gy_values, data: Buffer): HeadtrackerSerialReq;
    static newReq(res: (ret: Buffer) => void, rej: () => void, val_ty: si_gy_values, args: Buffer): HeadtrackerSerialReq;
}
export declare class SerialHeadtracker extends SerialConnection {
    _rqueue: HeadtrackerSerialReq[];
    _req_current: HeadtrackerSerialReq;
    _req_free: boolean;
    _watchdog: NodeJS.Timeout;
    _is_ok: boolean;
    _id: number;
    software_version: string;
    constructor(serial: SerialPort);
    last_int: number;
    last_read_cnt: number;
    init(): Promise<void>;
    destroy(): Promise<unknown>;
    isOnline(): boolean;
    setValue(ty: si_gy_values, data: Buffer): Promise<void>;
    getValue(ty: si_gy_values, data?: Buffer): Promise<Buffer>;
    notify(ty: si_gy_values): Promise<void>;
    _start_request(req: HeadtrackerSerialReq): void;
    _new_request(req: HeadtrackerSerialReq): void;
    _end_request(data?: Buffer): void;
    onValueRequest(ty: si_gy_values): Buffer;
    onValueSet(ty: si_gy_values, data: Buffer): void;
    onNotify(ty: si_gy_values, data: Buffer): void;
    onACK(ty: si_gy_values): void;
    onResponse(ty: si_gy_values, data: Buffer): void;
}
export declare class LocalHeadtracker extends Headtracker {
    shtrk: SerialHeadtracker;
    output: OutputAdapter;
    progb: Terminal.ProgressBarController;
    _calib_res: () => void;
    _calib_rej: () => void;
    _calib_loops: number;
    _calib_target: number;
    _calib_step: number;
    _calib_prog_cb: (prog: number, step: number) => void;
    _req_speed: number;
    _act_speed: number;
    _ltc: {
        results: number[];
        cnt?: number;
        done?: () => void;
        err?: () => void;
    };
    constructor(port: SerialPort, out: OutputAdapter);
    _slowdown(): void;
    _speedup(): Promise<void>;
    flashNewestFirmware(nanobootloader: string): Promise<void>;
    checkLatency(): Promise<unknown>;
    _calibration_cb(prog: number): void;
    private _ltc_run;
    setID(id: number): Promise<void>;
    getID(): Promise<number>;
    setSamplerate(sr: number): Promise<void>;
    _set_sr(sr: number): Promise<void>;
    enableTx(): Promise<void>;
    disableTx(): Promise<void>;
    save(): void;
    reboot(): void;
    setInvertation(inv: HeadtrackerInvertation): void;
    resetOrientation(): void;
    beginInit(): Promise<void>;
    finishInit(): Promise<void>;
    applyNetworkSettings(settings: HeadtrackerNetworkSettings): void;
    destroy(): Promise<unknown>;
    isOnline(): boolean;
    setStreamDest(addr: string, port: number): void;
    calibrate(loops?: number, prog_cb?: (prog: number, steps: number) => void): Promise<void>;
}
export {};
