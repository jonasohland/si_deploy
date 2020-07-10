import { PortTypes } from './dsp_defs';
import { SourceParameterSet, SourceSet } from './sources';
export declare abstract class SourceBehaviour {
    abstract buildSourceSet(params: SourceParameterSet): SourceSet;
}
export declare class MonoSourceBehaviour extends SourceBehaviour {
    constructor();
    buildSourceSet(params: SourceParameterSet): SourceSet;
}
export declare class StereoSourceBehaviour extends SourceBehaviour {
    constructor(ty: PortTypes);
    buildSourceSet(params: SourceParameterSet): SourceSet;
}
export declare class SurroundSourceBehaviour extends SourceBehaviour {
    constructor(ty: PortTypes);
    buildSourceSet(params: SourceParameterSet): SourceSet;
}
export declare class X3DSourceBehaviour extends SourceBehaviour {
    constructor(ty: PortTypes);
    buildSourceSet(params: SourceParameterSet): SourceSet;
}
export declare type SourceSetsType = {
    [key in PortTypes]?: SourceBehaviour;
};
export declare const SourceSets: SourceSetsType;
