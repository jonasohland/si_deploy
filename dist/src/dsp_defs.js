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
    PortTypes[PortTypes["x3D_5_4_1"] = 6] = "x3D_5_4_1";
    PortTypes[PortTypes["x3D_4_0_4"] = 7] = "x3D_4_0_4";
    PortTypes[PortTypes["Ambi_O0"] = 8] = "Ambi_O0";
    PortTypes[PortTypes["Ambi_O1"] = 9] = "Ambi_O1";
    PortTypes[PortTypes["Ambi_O2"] = 10] = "Ambi_O2";
    PortTypes[PortTypes["Ambi_O3"] = 11] = "Ambi_O3";
    PortTypes[PortTypes["Ambi_O4"] = 12] = "Ambi_O4";
    PortTypes[PortTypes["Ambi_O5"] = 13] = "Ambi_O5";
    PortTypes[PortTypes["Ambi_O6"] = 14] = "Ambi_O6";
    PortTypes[PortTypes["Ambi_O7"] = 15] = "Ambi_O7";
    PortTypes[PortTypes["Ambi_O8"] = 16] = "Ambi_O8";
    PortTypes[PortTypes["Ambi_O9"] = 17] = "Ambi_O9";
    PortTypes[PortTypes["Ambi_O10"] = 18] = "Ambi_O10";
    PortTypes[PortTypes["Ambi_O11"] = 19] = "Ambi_O11";
})(PortTypes = exports.PortTypes || (exports.PortTypes = {}));
function isAmbi(ty) {
    return ty >= PortTypes.Ambi_O0;
}
exports.isAmbi = isAmbi;
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
;
function _basic_defaults() {
    return { a: 0, e: 0 };
}
function _basic_defaults_generator(width, height) {
    return function () {
        return {
            a: 0,
            e: 0,
            width,
            height
        };
    };
}
function _panfunction_any(params) {
    return [{ a: params.a, e: params.e }];
}
function _panfunction_mono(params) {
    return [{ a: params.a, e: params.e }];
}
function _panfunction_stereo(params) {
    params.width = params.width || 0;
    let aL = params.a - (params.width / 2);
    let aR = params.a + (params.width / 2);
    return [{ a: aL, e: params.e }, { a: aR, e: params.e }];
}
function _panfunction_quad(params) {
    return [
        { a: params.a - 45, e: params.e },
        { a: params.a + 45, e: params.e },
        { a: params.a - 135, e: params.e },
        { a: params.a + 135, e: params.e },
    ];
}
function _panfunction_surround_5_1(params) {
    return [
        { a: params.a - (params.width / 2), e: params.e },
        { a: params.a + (params.width / 2), e: params.e },
        { a: params.a, e: params.e },
        { a: params.a, e: params.e },
        { a: params.a - 110, e: params.e },
        { a: params.a + 110, e: params.e },
    ];
}
exports.SourcePanFunctions = [
    _panfunction_any,
    _panfunction_mono,
    _panfunction_stereo,
    _panfunction_quad,
];
exports.SourceParameterSetDefaults = [
    _basic_defaults,
];
// clang-format off
exports.SourceUtils = {
    [PortTypes.Any]: { channels: 1, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.Mono]: { channels: 1, pan: _panfunction_mono, defaults: _basic_defaults },
    [PortTypes.Stereo]: { channels: 2, pan: _panfunction_stereo, defaults: _basic_defaults_generator(90) },
    [PortTypes.Quad]: { channels: 4, pan: _panfunction_quad, defaults: _basic_defaults },
    [PortTypes.Surround_5_1]: { channels: 6, pan: _panfunction_surround_5_1, defaults: _basic_defaults_generator(60) },
    [PortTypes.Surround_7_1]: { channels: 8, pan: _panfunction_any, defaults: _basic_defaults_generator(30) },
    [PortTypes.x3D_4_0_4]: { channels: 8, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.x3D_5_4_1]: { channels: 10, pan: _panfunction_any, defaults: _basic_defaults_generator(30) },
    [PortTypes.Ambi_O0]: { channels: 1, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.Ambi_O1]: { channels: 4, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.Ambi_O2]: { channels: 9, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.Ambi_O3]: { channels: 16, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.Ambi_O4]: { channels: 25, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.Ambi_O5]: { channels: 36, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.Ambi_O6]: { channels: 49, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.Ambi_O7]: { channels: 64, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.Ambi_O8]: { channels: 81, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.Ambi_O9]: { channels: 100, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.Ambi_O10]: { channels: 121, pan: _panfunction_any, defaults: _basic_defaults },
    [PortTypes.Ambi_O11]: { channels: 144, pan: _panfunction_any, defaults: _basic_defaults },
};
// clang-format on
//# sourceMappingURL=dsp_defs.js.map