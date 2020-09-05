"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
function basicNodeAudioInputDescription(name, channel, type) {
    return {
        name,
        channel,
        type,
        id: uuid_1.v4(),
        default_roomencode: false,
        default_encodingorder: 3,
        default_gain: 1.
    };
}
exports.basicNodeAudioInputDescription = basicNodeAudioInputDescription;
//# sourceMappingURL=inputs_defs.js.map