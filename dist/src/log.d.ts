import winston from 'winston';
import { TimecodeReader } from './timecode';
export declare function setLogDevice(tcr: TimecodeReader): void;
export declare function setLogLVL(lvl: number): void;
export declare function get(module_name: string, init?: boolean): winston.Logger;
