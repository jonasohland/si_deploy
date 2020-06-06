/// <reference types="node" />
import EventEmitter from 'events';
import io from 'socket.io';
import * as IPC from './ipc';
import { SocketAndInstance } from './server';
export interface Channel {
    i: number;
    name: string;
}
export interface ChannelList {
    inputs: Channel[];
    outputs: Channel[];
}
export interface NodeAndChannels {
    id: string;
    name: string;
    channels: ChannelList;
}
export interface Status {
    open: boolean;
    enabled: boolean;
}
export declare class AudioDeviceConfiguration {
    samplerate: number;
    buffersize: number;
    input_device: string;
    output_device: string;
    in: number;
    out: number;
}
export interface WEBIFAudioDeviceStatus {
    nodename: string;
    id: string;
    options: {
        audioIns: string[];
        audioOuts: string[];
        samplerates: number[];
        buffersizes: number[];
    };
    dspUse: number;
    latency: number;
    audioOutputDevice: string;
    audioInputDevice: string;
    samplerate: number;
    buffersize: number;
    dsp_on: boolean;
    device_open: boolean;
}
export declare class Manager {
    remote: IPC.Requester;
    dsp: IPC.Requester;
    input_devices: any[];
    output_devices: any[];
    ich_names: string[];
    och_names: string[];
    config: AudioDeviceConfiguration;
    status: WEBIFAudioDeviceStatus;
    channel_list_cache: ChannelList;
    channel_list_fresh: boolean;
    constructor(con: IPC.Connection);
    refresh(): Promise<void>;
    refreshDSPLoad(): Promise<void>;
    setConfig(): Promise<void>;
    setInputDevice(dev: string): Promise<IPC.Message>;
    setOutputDevice(dev: string): Promise<IPC.Message>;
    setSamplerate(rate: number): Promise<IPC.Message>;
    setBuffersize(size: number): Promise<IPC.Message>;
    open(): Promise<IPC.Message>;
    close(): Promise<IPC.Message>;
    isOpen(): Promise<boolean>;
    enable(): Promise<IPC.Message>;
    disable(): Promise<IPC.Message>;
    isEnabled(): Promise<IPC.Message>;
    getChannelList(): Promise<ChannelList>;
}
export declare class AudioDeviceManager extends EventEmitter {
    server: io.Server;
    instances: SocketAndInstance[];
    constructor(server: io.Server, instances: SocketAndInstance[]);
    handleUpdateRequest(socket: io.Socket): void;
    refreshAllDevices(): Promise<WEBIFAudioDeviceStatus[]>;
    getAllChannelLists(): Promise<NodeAndChannels[]>;
}
