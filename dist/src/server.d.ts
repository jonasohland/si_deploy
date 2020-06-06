import { SpatialIntercomInstance } from './instance';
import * as AudioDevices from './audio_devices';
import * as mdns from 'dnssd';
import io from 'socket.io';
import * as Headtracking from './headtracking';
import * as Inputs from './inputs';
import { UsersManager } from './users';
import { ShowfileManager } from './showfiles';
import express from 'express';
export interface SocketAndInstance {
    instance: SpatialIntercomInstance;
    socket?: io.Socket;
    is_remote: boolean;
}
export declare class SpatialIntercomServer {
    instances: SocketAndInstance[];
    advertiser: mdns.Advertisement;
    webinterface_advertiser: mdns.Advertisement;
    server: io.Server;
    webif_server: io.Server;
    headtracking: Headtracking.Headtracking;
    audio_device_manager: AudioDevices.AudioDeviceManager;
    inputs: Inputs.InputManager;
    users: UsersManager;
    showfileman: ShowfileManager;
    app: express.Application;
    constructor(config: any);
    newInstanceFound(socket: io.Socket): void;
    instanceLeft(socket: io.Socket): void;
}
