"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PortTypes;
(function (PortTypes) {
    PortTypes[PortTypes["Any"] = 0] = "Any";
    PortTypes[PortTypes["Mono"] = 1] = "Mono";
    PortTypes[PortTypes["Stereo"] = 2] = "Stereo";
    PortTypes[PortTypes["Quad"] = 3] = "Quad";
    PortTypes[PortTypes["Surround_5_1"] = 4] = "Surround_5_1";
    PortTypes[PortTypes["Surround_7_1"] = 5] = "Surround_7_1";
    PortTypes[PortTypes["Surround_10_2"] = 6] = "Surround_10_2";
    PortTypes[PortTypes["Surround_11_1"] = 7] = "Surround_11_1";
    PortTypes[PortTypes["Surround_22_2"] = 8] = "Surround_22_2";
    PortTypes[PortTypes["x3D_5_4_1"] = 9] = "x3D_5_4_1";
    PortTypes[PortTypes["x3D_7_4_1"] = 10] = "x3D_7_4_1";
    PortTypes[PortTypes["x3D_4_0_4"] = 11] = "x3D_4_0_4";
    PortTypes[PortTypes["Ambi_O0"] = 12] = "Ambi_O0";
    PortTypes[PortTypes["Ambi_O1"] = 13] = "Ambi_O1";
    PortTypes[PortTypes["Ambi_O2"] = 14] = "Ambi_O2";
    PortTypes[PortTypes["Ambi_O3"] = 15] = "Ambi_O3";
    PortTypes[PortTypes["Ambi_O4"] = 16] = "Ambi_O4";
    PortTypes[PortTypes["Ambi_O5"] = 17] = "Ambi_O5";
    PortTypes[PortTypes["Ambi_O6"] = 18] = "Ambi_O6";
    PortTypes[PortTypes["Ambi_O7"] = 19] = "Ambi_O7";
    PortTypes[PortTypes["Ambi_O8"] = 20] = "Ambi_O8";
    PortTypes[PortTypes["Ambi_O9"] = 21] = "Ambi_O9";
    PortTypes[PortTypes["Ambi_O10"] = 22] = "Ambi_O10";
    PortTypes[PortTypes["Ambi_O11"] = 23] = "Ambi_O11";
})(PortTypes = exports.PortTypes || (exports.PortTypes = {}));
function stringToPortType(str) {
    switch (str.toLocaleLowerCase()) {
        case 'mono': return PortTypes.Mono;
        case 'st': return PortTypes.Stereo;
        case 'stereo': return PortTypes.Stereo;
        case 'surround': return PortTypes.Surround_5_1;
        case '5.1': return PortTypes.Surround_5_1;
        case '5_1': return PortTypes.Surround_5_1;
        default: return PortTypes.Any;
    }
}
exports.stringToPortType = stringToPortType;
exports.PortTypeChannelCount = [
    1,
    1,
    2,
    4,
    6,
    8,
    12,
    12,
    24,
    10,
    12,
    8,
    1,
    4,
    9,
    16,
    25,
    36,
    49,
    64,
    81,
    100,
    121,
    144 // Ambi O11
];
//# sourceMappingURL=dsp_defs.js.map