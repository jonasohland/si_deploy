"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const dsp_defs_1 = require("./dsp_defs");
function basicSpatializedInput(inputid, userid, type) {
    let defaultSource = dsp_defs_1.SourceUtils[type].defaults();
    return {
        inputid, userid,
        id: uuid_1.v4(),
        gain: 0,
        room: null,
        azm: defaultSource.a,
        elv: defaultSource.e,
        width: defaultSource.width,
        height: defaultSource.height
    };
}
exports.basicSpatializedInput = basicSpatializedInput;
function basicXTCData() {
    return {
        enabled: false,
        accuracy: 1000,
        dist_spk: 42,
        dist_ears: 21.5,
        dist_listener: 60
    };
}
exports.basicXTCData = basicXTCData;
function basicUserData(name, channel) {
    return {
        name,
        channel,
        id: uuid_1.v4(),
        headtracker: -1,
        inputs: [],
        room: null,
        xtc: basicXTCData()
    };
}
exports.basicUserData = basicUserData;
//# sourceMappingURL=users_defs.js.map