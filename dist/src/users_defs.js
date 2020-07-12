"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
class UserData {
}
exports.UserData = UserData;
function basicUserData(name, channel) {
    return {
        name,
        channel,
        id: uuid_1.v4(),
        headtracker: -1,
        source_ids: []
    };
}
exports.basicUserData = basicUserData;
//# sourceMappingURL=users_defs.js.map