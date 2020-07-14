/// <reference types="socket.io" />
import { Connection, Requester } from './communication';
import { ManagedNodeStateMapRegister, ManagedNodeStateObject, NodeModule, ServerModule } from './data';
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
export declare class NodeSelectedAudioDeviceSettings extends ManagedNodeStateObject<[string, string]> {
    input: string;
    output: string;
    controller: NodeAudioDevices;
    constructor(ctrl: NodeAudioDevices, input: string, output: string);
    set(val: any): Promise<void>;
    get(): [string, string];
    apply(): Promise<void>;
}
export declare class NodePlaybackSettings extends ManagedNodeStateObject<[number, number]> {
    srate: number;
    buffersize: number;
    controller: NodeAudioDevices;
    constructor(controller: NodeAudioDevices, srate: number, bufsize: number);
    set(val: [number, number]): Promise<void>;
    get(): [number, number];
    apply(): Promise<void>;
}
export declare class NodeAudioDeviceSettings extends ManagedNodeStateMapRegister {
    controller: NodeAudioDevices;
    constructor(ctrl: NodeAudioDevices);
    hasSettings(): boolean;
    default(): void;
    setIODevices(input: string, output: string): void;
    setPlaypackSettings(srate: number, bufsize: number): void;
    getIODevices(): Promise<[string, string]>;
    getPlaybackSettings(): Promise<[number, number]>;
    remove(name: string, obj: ManagedNodeStateObject<any>): Promise<void>;
    insert(name: string, obj: any): Promise<NodeSelectedAudioDeviceSettings | NodePlaybackSettings>;
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
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    refresh(): Promise<void>;
    getNodeDevicesInformation(): Promise<NodeAudioDevicesInformation>;
    getChannelList(): Promise<ChannelList>;
    open(): Promise<void>;
    close(): Promise<void>;
    isOpen(): Promise<boolean>;
    enable(): Promise<void>;
    disable(): Promise<void>;
    isEnabled(): Promise<boolean>;
    setInputDevice(dev: string): Promise<void>;
    setOutputDevice(dev: string): Promise<void>;
    setSamplerate(rate: number): Promise<import("./communication").Message>;
    setBuffersize(size: number): Promise<import("./communication").Message>;
    reloadSettingsFromDB(): Promise<void>;
    writeSettingsToDB(): void;
    destroy(): void;
    init(): void;
    start(remote: Connection): void;
    constructor();
}
export declare class AudioDevices extends ServerModule {
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    init(): void;
    endTransaction(socket: SocketIO.Socket): void;
    endTransactionWithError(socket: SocketIO.Socket, error: any): void;
    constructor();
}
