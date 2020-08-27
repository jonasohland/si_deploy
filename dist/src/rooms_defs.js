"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRoom = void 0;
function defaultRoom(letter) {
    return {
        letter: letter,
        enabled: false,
        reflections: 0.,
        room: {
            size: 10,
            depth: 0.5,
            height: 0.5,
            width: 0.5,
        },
        attn: {
            front: 0.,
            back: 0.,
            left: 0.,
            right: 0.,
            ceiling: 0.,
            floor: 0.
        },
        eq: {
            high: {
                freq: 8000.,
                gain: 0.,
            },
            low: {
                freq: 100,
                gain: 0.,
            }
        }
    };
}
exports.defaultRoom = defaultRoom;
//# sourceMappingURL=rooms_defs.js.map