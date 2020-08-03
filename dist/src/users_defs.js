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
function basicUserData(name, channel) {
    return {
        name,
        channel,
        id: uuid_1.v4(),
        headtracker: -1,
        inputs: [],
        room: null,
    };
}
exports.basicUserData = basicUserData;
//# sourceMappingURL=users_defs.js.map