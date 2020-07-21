"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
function basicSpatializedInput(inputid, userid) {
    return {
        inputid, userid,
        id: uuid_1.v4(),
        room: null,
        azm: 0,
        elv: 0
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