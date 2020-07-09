/// <reference types="node" />
import EventEmitter from 'events';
import io from 'socket.io';
import { SIDSPNode } from './instance';
import WebInterface from './web_interface';
import { Requester, Connection, Message } from './communication';
import { NodeModule, ManagedNodeStateMapRegister, ManagedNodeStateObject, ManagedNodeStateObjectData, ServerModule } from './data';
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
export interface NodeAudioDevicesInformation {
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
    remote: Requester;
    dsp: Requester;
    input_devices: any[];
    output_devices: any[];
    ich_names: string[];
    och_names: string[];
    config: AudioDeviceConfiguration;
    status: NodeAudioDevicesInformation;
    channel_list_cache: ChannelList;
    channel_list_fresh: boolean;
    constructor(con: Connection);
    refresh(): Promise<void>;
    refreshDSPLoad(): Promise<void>;
    setConfig(): Promise<void>;
    setInputDevice(dev: string): Promise<Message>;
    setOutputDevice(dev: string): Promise<Message>;
    setSamplerate(rate: number): Promise<Message>;
    setBuffersize(size: number): Promise<Message>;
    open(): Promise<Message>;
    close(): Promise<Message>;
    isOpen(): Promise<boolean>;
    enable(): Promise<Message>;
    disable(): Promise<Message>;
    isEnabled(): Promise<Message>;
    getChannelList(): Promise<ChannelList>;
}
export declare class AudioDeviceManager extends EventEmitter {
    webif: io.Server;
    instances: SIDSPNode[];
    constructor(server: WebInterface, instances: SIDSPNode[]);
    handleUpdateRequest(socket: io.Socket): void;
    refreshAllDevices(): Promise<NodeAudioDevicesInformation[]>;
    getAllChannelLists(): Promise<NodeAndChannels[]>;
}
export declare class NodeSelectedAudioDeviceSettings extends ManagedNodeStateObject<[string, string]> {
    input: string;
    output: string;
    controller: NodeAudioDevices;
    constructor(ctrl: NodeAudioDevices, input: string, output: string);
    set(val: any): Promise<void>;
    get(): Promise<[string, string]>;
    apply(): Promise<void>;
}
export declare class NodePlaybackSettings extends ManagedNodeStateObject<[number, number]> {
    srate: number;
    buffersize: number;
    controller: NodeAudioDevices;
    constructor(controller: NodeAudioDevices, srate: number, bufsize: number);
    set(val: [number, number]): Promise<void>;
    get(): Promise<[number, number]>;
    apply(): Promise<void>;
}
export declare class NodeAudioDeviceSettings extends ManagedNodeStateMapRegister {
    controller: NodeAudioDevices;
    constructor(ctrl: NodeAudioDevices);
    hasSettings(): boolean;
    default(): void;
    remove(name: string, obj: ManagedNodeStateObject<any>): Promise<void>;
    insert(name: string, obj: ManagedNodeStateObjectData): Promise<NodeSelectedAudioDeviceSettings | NodePlaybackSettings>;
}
export declare class NodeAudioDevices extends NodeModule {
    _devmgmt: Requester;
    _dsp: Requester;
    _settings: NodeAudioDeviceSettings;
    _chlis_valid: boolean;
    _chlist_cached: ChannelList;
    _idev_list: any[];
    _odev_list: any[];
    _is_open: boolean;
    _is_enabled: boolean;
    _config: AudioDeviceConfiguration;
    refresh(): Promise<void>;
    getNodeDevicesInformation(): Promise<NodeAudioDevicesInformation>;
    getChannelList(): Promise<ChannelList>;
    open(): Promise<Message>;
    close(): Promise<Message>;
    isOpen(): Promise<boolean>;
    enable(): Promise<Message>;
    disable(): Promise<Message>;
    isEnabled(): Promise<Message>;
    setInputDevice(dev: string): Promise<Message>;
    setOutputDevice(dev: string): Promise<Message>;
    setSamplerate(rate: number): Promise<Message>;
    setBuffersize(size: number): Promise<Message>;
    reloadSettingsFromDB(): Promise<void>;
    writeSettingsToDB(): void;
    destroy(): void;
    init(): void;
    start(remote: Connection): void;
    constructor();
}
export declare class AudioDevices extends ServerModule {
    init(): void;
    constructor();
}
