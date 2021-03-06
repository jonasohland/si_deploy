import * as mdns from 'dnssd';
import io from 'socket.io';
import * as DSP from './dsp_graph';
import * as VST from './vst';
import { Connection } from './communication';
import { TimecodeNode } from './timecode';
export declare class InstanceID {
    hash: number;
    txt: string;
}
export interface InstanceStatusInformation {
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
    service_browser: mdns.Browser;
    addresses: string[];
    tc: TimecodeNode;
    constructor(nodename: string, nid: string, local: boolean, addrs: string[], dsp?: io.Socket);
}
