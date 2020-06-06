import * as mdns from 'dnssd';
import io from 'socket.io';
import * as AudioDevices from './audio_devices';
import * as DSP from './dsp';
import * as VST from './vst';
import * as IPC from './ipc';
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
export declare class SpatialIntercomInstance {
    name: string;
    id: string;
    io: io.Socket;
    graph: DSP.Graph;
    dsp: IPC.Connection;
    vst: VST.Manager;
    devices: AudioDevices.Manager;
    service_browser: mdns.Browser;
    addresses: string[];
    constructor(nodename: string, nid: string, local: boolean, addrs: string[], dsp?: io.Socket);
}
