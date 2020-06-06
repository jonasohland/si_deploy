/// <reference types="node" />
import * as os from 'os';
export declare function applyMixins(derivedCtor: any, baseCtors: any[]): void;
export declare function openForUser(thing: string): void;
export declare function bitValue(bit: number): number;
export declare function arrayDiff<T>(base: Array<T>, excl: Array<T>): Array<T>;
export declare function localNetinfo(): Promise<{
    if: string;
    mask: number;
}[]>;
export declare const LocalInterfaces: os.NetworkInterfaceInfo[];
