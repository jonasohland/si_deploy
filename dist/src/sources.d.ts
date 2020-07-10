import { PortTypes } from './dsp_defs';
export interface Source {
    a: number;
    e: number;
}
export declare class SourceSet {
    lows?: {
        front?: Source[];
        back?: Source[];
    };
    heights?: {
        front?: Source[];
        back?: Source[];
    };
    default?: Source[];
    aux?: Source[];
}
export declare class SourceParameterSet {
    height?: number;
    lowFrontWidth?: number;
    lowBackWidth?: number;
    highFrontWidth?: number;
    highBackWidth?: number;
    a: number;
    e: number;
}
export declare class SoundSource {
    name: string;
    short: string;
    a: number;
    e: number;
    sources: Source[];
    constructor(name: string, short?: string, azm?: number, elv?: number);
    static fromObj(obj: any): SoundSource;
}
export declare class MultichannelSoundSource extends SoundSource {
    ptype: PortTypes;
    constructor(source: SoundSource, type?: PortTypes);
}
export declare class SurroundSoundSource extends MultichannelSoundSource {
    spread_front: number;
    spread_back: number;
    constructor(base: SoundSource, type: PortTypes);
}
export declare class SpatialSoundSource extends SurroundSoundSource {
    height: number;
    constructor(base: SoundSource, type: PortTypes);
}
