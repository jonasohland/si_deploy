import * as mdns from 'dnssd';
import io from 'socket.io';
import * as AudioDevices from './audio_devices';
import * as DSP from './dsp';
import * as VST from './vst';
import { Connection } from './communication';
import { TimecodeNode } from './timecode';
export declare class InstanceID {
    hash: number;
    txt: string;
}
export interface InstanceStatusInformation {
    audiostatus: AudioDevices.Status;
}
export interface InstanceNetworkInformations {
    v4_addr: string;
    ws_port: string;
    htrk_port: string;
}
export declare class SIDSPNode {
    name: string;
    id: string;
    io: io.Socket;
    graph: DSP.Graph;
    connection: Connection;
    vst: VST.VSTScanner;
    devices: AudioDevices.Manager;
    service_browser: mdns.Browser;
    addresses: string[];
    tc: TimecodeNode;
    constructor(nodename: string, nid: string, local: boolean, addrs: string[], dsp?: io.Socket);
}
