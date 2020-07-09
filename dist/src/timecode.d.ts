/// <reference types="node" />
import * as cp from 'child_process';
import { EventEmitter } from 'events';
import * as readline from 'readline';
import { SIDSPNode } from './instance';
import { Requester, Connection } from './communication';
export interface AES67TimecodeTransport {
    samplerate: number;
    channel: number;
    framerate: number;
    sdp: string;
}
export declare function devices(): Promise<string[]>;
export declare class TimecodeReader extends EventEmitter {
    _didx: number;
    _cidx: number;
    _frate: number;
    _srate: number;
    _ltcstreamer: cp.ChildProcess;
    _ffmpeg: cp.ChildProcess;
    _ltcreader: readline.Interface;
    _running: boolean;
    _running_tm: NodeJS.Timeout;
    _lasttc: string;
    _currenttc: string;
    setDevice(idx: number): void;
    setChannel(ch: number): void;
    setOptions(frate: number, srate: number): void;
    start(): void;
    stop(): void;
    _on_ltc_line(line: string): void;
    _on_ltc_timeout(): void;
    _ff_device_arg(): string[];
    _ff_pan_option(): string[];
    _launch_ffmpeg(): void;
    _launch_ltcstreamer(): void;
}
export declare class TimecodeNode {
    _remote: Requester;
    _ready: boolean;
    _rtp_available: boolean;
    constructor(connection: Connection);
    time(tmt?: number): Promise<string>;
    start(transport: AES67TimecodeTransport): Promise<string>;
}
export declare class Timecode {
    _nodes: SIDSPNode[];
    constructor(nodes: SIDSPNode[]);
}
