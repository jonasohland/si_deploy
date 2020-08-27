"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverRoomName = exports.nodeRoomName = exports.webifResponseEvent = void 0;
function webifResponseEvent(nodeid, modulename, event) {
    return `${nodeid}.${modulename}.${event}`;
}
exports.webifResponseEvent = webifResponseEvent;
function nodeRoomName(nodeid, module, topic) {
    return `${nodeid}-${module}-${topic}`;
}
exports.nodeRoomName = nodeRoomName;
function serverRoomName(module, topic) {
    return `${module}-${topic}`;
}
exports.serverRoomName = serverRoomName;
//# sourceMappingURL=web_interface_defs.js.map