export declare enum PortTypes {
    Any = 0,
    Mono = 1,
    Stereo = 2,
    Quad = 3,
    Surround_5_1 = 4,
    Surround_7_1 = 5,
    Surround_10_2 = 6,
    Surround_11_1 = 7,
    Surround_22_2 = 8,
    x3D_5_4_1 = 9,
    x3D_7_4_1 = 10,
    x3D_4_0_4 = 11,
    Ambi_O0 = 12,
    Ambi_O1 = 13,
    Ambi_O2 = 14,
    Ambi_O3 = 15,
    Ambi_O4 = 16,
    Ambi_O5 = 17,
    Ambi_O6 = 18,
    Ambi_O7 = 19,
    Ambi_O8 = 20,
    Ambi_O9 = 21,
    Ambi_O10 = 22,
    Ambi_O11 = 23
}
export declare function stringToPortType(str: string): PortTypes.Any | PortTypes.Mono | PortTypes.Stereo | PortTypes.Surround_5_1;
export declare const PortTypeChannelCount: number[];
