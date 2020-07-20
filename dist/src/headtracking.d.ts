/// <reference types="socket.io" />
import dnssd from 'dnssd';
import { Headtracker, HeadtrackerConfigPacket } from './headtracker';
import { Showfile } from './showfiles';
import WebInterface from './web_interface';
import { ServerModule } from './core';
export declare class Headtracking extends ServerModule {
    init(): void;
    joined(sock: SocketIO.Socket, topic: string): void;
    left(): void;
    onShowfileLoad(s: Showfile): void;
    onEmptyShowfileCreate(s: Showfile): void;
    targetName(): string;
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
