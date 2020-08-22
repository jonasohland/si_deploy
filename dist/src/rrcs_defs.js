"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
function portEqual(lhs, rhs) {
    return lhs.Node === rhs.Node && lhs.Port === rhs.Port
        && lhs.IsInput === rhs.IsInput;
}
exports.portEqual = portEqual;
function xpEqual(lhs, rhs) {
    return portEqual(lhs.Source, rhs.Source)
        && portEqual(lhs.Destination, rhs.Destination);
}
exports.xpEqual = xpEqual;
function xpVtEqual(lhs, rhs) {
    return xpEqual(lhs.xp, rhs.xp) && lhs.single === rhs.single
        && lhs.conf === rhs.conf;
}
exports.xpVtEqual = xpVtEqual;
function __xpid(xp) {
    return `${xp.Source.Node}-${xp.Source.Port}-|${xp.Destination.Node}-${xp.Destination.Port}`;
}
exports.__xpid = __xpid;
function xpvtid(xp_vt) {
    if (isWildcardXP(xp_vt.xp))
        return `${__xpid(xp_vt.xp)}|*`;
    return `${__xpid(xp_vt.xp)}${xp_vt.conf ? '|c' : '|s'}`;
}
exports.xpvtid = xpvtid;
function makeWildcardPort() {
    return { Node: -1, Port: -1, IsInput: null };
}
exports.makeWildcardPort = makeWildcardPort;
function isWildcardPort(port) {
    return port.Node == -1 || port.Port == -1;
}
exports.isWildcardPort = isWildcardPort;
function isWildcardXP(xp) {
    return isWildcardPort(xp.Source) || isWildcardPort(xp.Destination);
}
exports.isWildcardXP = isWildcardXP;
function destinationPortIsWildcard(xp) {
    return isWildcardPort(xp.Destination);
}
exports.destinationPortIsWildcard = destinationPortIsWildcard;
function sourcePortIsWildcard(xp) {
    return isWildcardPort(xp.Source);
}
exports.sourcePortIsWildcard = sourcePortIsWildcard;
function asSourceWildcard(xp) {
    return {
        Source: makeWildcardPort(),
        Destination: lodash_1.default.cloneDeep(xp.Destination)
    };
}
exports.asSourceWildcard = asSourceWildcard;
function asDestinationWildcard(xp) {
    return {
        Source: lodash_1.default.cloneDeep(xp.Source),
        Destination: makeWildcardPort()
    };
}
exports.asDestinationWildcard = asDestinationWildcard;
//# sourceMappingURL=rrcs_defs.js.map