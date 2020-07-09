/// <reference types="socket.io" />
/// <reference types="node" />
import EventEmitter from 'events';
import * as Audio from './audio_devices';
import { BasicUserModule, SpatializationModule } from './dsp_modules';
import * as Inputs from './inputs';
import * as Instance from './instance';
import { Headtracking } from './headtracking';
import WebInterface from './web_interface';
export interface OwnedInput {
    id: number;
    input: Inputs.Input;
    format: string;
    azm: number;
    elv: number;
    stwidth: number;
    mute: boolean;
    dspModule?: SpatializationModule;
}
interface WEBIFNewUserData {
    username: string;
    nodeid: string;
    channels: Audio.Channel[];
}
export interface NodeAndUsers {
    si: Instance.SIDSPNode;
    users: User[];
}
export declare class User {
    id: number;
    name: string;
    advanced: boolean;
    htrk: number;
    inputs: OwnedInput[];
    outputChannels: Audio.Channel[];
    roomsize: number;
    reflections: number;
    room_character: number;
    dspModule?: BasicUserModule;
    constructor(instance: Instance.SIDSPNode, name: string);
    setInputMuted(iid: number, muted: boolean): void;
    setInputAzm(iid: number, val: number): void;
    setInputElv(iid: number, val: number): void;
    setInputStWidth(iid: number, val: number): void;
    findInput(iid: number): OwnedInput;
}
export declare class UsersManager extends EventEmitter {
    users: NodeAndUsers[];
    webif: WebInterface;
    inputs: Inputs.InputManager;
    htrks: Headtracking;
    max_id: number;
    constructor(webif: WebInterface, inputs: Inputs.InputManager, htrks: Headtracking);
    addUser(userdata: WEBIFNewUserData): void;
    updateInterface(socket: SocketIO.Server | SocketIO.Socket): Promise<void>;
    userInputsChanged(data: {
        id: number;
        nid: string;
        inputs: OwnedInput[];
    }): void;
    switchSpatializationMode(usr_id: number, nid: string): void;
    setInputMuted(usr_id: number, nid: string, iid: number, mute: boolean): void;
    setInputAzm(usr_id: number, nid: string, iid: number, azm: number): void;
    setInputElv(usr_id: number, nid: string, iid: number, elv: number): void;
    setInputStWidth(usr_id: number, nid: string, iid: number, width: number): void;
    findUser(nid: string, userId: number): User;
    assignHeadtracker(userId: number, nid: string, htrkId: number): void;
    setReflections(usr_id: number, nid: string, value: number): void;
    setRoomCharacter(usr_id: number, nid: string, value: number): void;
}
export {};
