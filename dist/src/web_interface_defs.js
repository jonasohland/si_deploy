"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function webifResponseEvent(nodeid, modulename, event) {
    return `${nodeid}.${modulename}.${event}`;
}
exports.webifResponseEvent = webifResponseEvent;
function clientNodeRoomName(nodeid, module, topic) {
    return `${nodeid}-${module}-${topic}`;
}
exports.clientNodeRoomName = clientNodeRoomName;
function clientServerRoomName(module, topic) {
    return `${module}-${topic}`;
}
exports.clientServerRoomName = clientServerRoomName;
//# sourceMappingURL=web_interface_defs.js.map