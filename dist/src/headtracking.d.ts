/// <reference types="socket.io" />
import dnssd from 'mdns';
import { Headtracker, HeadtrackerConfigPacket } from './headtracker';
import WebInterface from './web_interface';
import { ServerModule } from './core';
export declare const HeadtrackerInputEvents: {
    RESET_HEADTRACKER: string;
    CALIBRATE_STEP1: string;
    CALIBRATE_STEP2: string;
    HEADTRACKER_ON: string;
    HEADTRACKER_OFF: string;
};
export declare class Headtracking extends ServerModule {
    init(): void;
    joined(sock: SocketIO.Socket, topic: string): void;
    left(): void;
    local_interface: string;
    browser: dnssd.Browser;
    trackers: Headtracker[];
    saved_htrk_data: HeadtrackerConfigPacket[];
    webif: WebInterface;
    constructor(interf: WebInterface, netif?: string);
    serviceFound(service: dnssd.Service): void;
    addHeadtracker(trk: Headtracker, id: number, address: string): void;
    serviceRemoved(service: dnssd.Service): void;
    getHeadtracker(id: number): Headtracker;
    updateRemote(socket?: SocketIO.Socket): void;
}
