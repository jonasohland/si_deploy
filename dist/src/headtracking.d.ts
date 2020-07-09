/// <reference types="socket.io" />
import dnssd from 'dnssd';
import { Headtracker, HeadtrackerConfigPacket } from './headtracker';
import { ShowfileTarget, Showfile, ShowfileManager } from './showfiles';
import WebInterface from './web_interface';
export declare class Headtracking extends ShowfileTarget {
    onShowfileLoad(s: Showfile): void;
    onEmptyShowfileCreate(s: Showfile): void;
    targetName(): string;
    local_interface: string;
    browser: dnssd.Browser;
    trackers: Headtracker[];
    saved_htrk_data: HeadtrackerConfigPacket[];
    webif: WebInterface;
    constructor(interf: WebInterface, man: ShowfileManager, netif?: string);
    serviceFound(service: dnssd.Service): void;
    addHeadtracker(trk: Headtracker, id: number, address: string): void;
    serviceRemoved(service: dnssd.Service): void;
    getHeadtracker(id: number): Headtracker;
    updateRemote(socket?: SocketIO.Socket): void;
}
