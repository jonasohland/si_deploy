/// <reference types="node" />
import * as os from 'os';
import { EventEmitter } from 'serialport';
export declare function applyMixins(derivedCtor: any, baseCtors: any[]): void;
export declare function openForUser(thing: string): void;
export declare function bitValue(bit: number): number;
export declare function arrayDiff<T>(base: Array<T>, excl: Array<T>): Array<T>;
export declare function localNetinfo(): Promise<{
    if: string;
    mask: number;
}[]>;
export declare function defaultIF(name?: string): string;
export declare const LocalInterfaces: os.NetworkInterfaceInfo[];
export declare function getMatchingLocalInterface(addr: string[]): os.NetworkInterfaceInfo[];
export declare function ignore(...any: any): void;
export declare function promisifyEventWithTimeout<EventReturnValueType>(eventemitter: EventEmitter, event: string, timeout?: number): Promise<EventReturnValueType>;
