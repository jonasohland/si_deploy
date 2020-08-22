/// <reference types="node" />
import dgram, { RemoteInfo } from 'dgram';
import mdns from 'mdns';
import { EventEmitter } from 'events';
import express from 'express';
import { AddressInfo } from 'net';
import SerialPort from 'serialport';
import { HeadtrackerConfigPacket } from './headtracker';
export declare class HeadtrackerBridgeDevice extends EventEmitter {
    private lhtrk;
    private output;
    path: string;
    _adv: mdns.Advertisement;
    _sock: dgram.Socket;
    conf: HeadtrackerConfigPacket;
    remote: AddressInfo;
    constructor(port: SerialPort);
    onPortBound(): void;
    registerService(): void;
    onMessage(msg: Buffer, addrinfo: AddressInfo): void;
    dumpData(): void;
    saveConfiguration(): void;
    applyDiffConfig(conf: HeadtrackerConfigPacket): Promise<void>;
    reconnect(port: SerialPort): Promise<void>;
    destroy(): void;
}
export declare class HeadtrackerBridge {
    _devs: HeadtrackerBridgeDevice[];
    _remote: RemoteInfo;
    _app: express.Application;
    constructor();
    findDeviceForPath(p: string): HeadtrackerBridgeDevice;
    addDevice(p: string): import("winston").Logger;
    removeDevice(p: string): void;
}
