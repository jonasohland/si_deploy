export declare enum PortTypes {
    Any = 0,
    Mono = 1,
    Stereo = 2,
    Quad = 3,
    Surround_5_1 = 4,
    Surround_7_1 = 5,
    x3D_5_4_1 = 6,
    x3D_4_0_4 = 7,
    Ambi_O0 = 8,
    Ambi_O1 = 9,
    Ambi_O2 = 10,
    Ambi_O3 = 11,
    Ambi_O4 = 12,
    Ambi_O5 = 13,
    Ambi_O6 = 14,
    Ambi_O7 = 15,
    Ambi_O8 = 16,
    Ambi_O9 = 17,
    Ambi_O10 = 18,
    Ambi_O11 = 19
}
export declare function isAmbi(ty: PortTypes): boolean;
export declare function stringToPortType(str: string): PortTypes.Any | PortTypes.Mono | PortTypes.Stereo | PortTypes.Surround_5_1;
export interface Source {
    a: number;
    e: number;
}
export interface SourceParameterSet {
    a: number;
    e: number;
    height?: number;
    width?: number;
}
export declare type PanFunction = (params: SourceParameterSet) => Source[];
export declare type SourceParameterSetDefaultsGenerator = () => SourceParameterSet;
declare function _panfunction_any(params: SourceParameterSet): Source[];
export declare const SourcePanFunctions: (typeof _panfunction_any)[];
export declare const SourceParameterSetDefaults: SourceParameterSetDefaultsGenerator[];
export interface SourceUtil {
    pan: PanFunction;
    channels: number;
    defaults: SourceParameterSetDefaultsGenerator;
}
export declare const SourceUtils: Record<PortTypes, SourceUtil>;
export {};
