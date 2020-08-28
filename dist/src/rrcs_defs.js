"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDestinationAsDestinationWildcard = exports.withDestinationeAsSourceWildcard = exports.withSourceAsDestinationWildcard = exports.withSourceAsSourceWildcard = exports.sourcePortIsWildcard = exports.destinationPortIsWildcard = exports.isWildcardXP = exports.isWildcardPort = exports.makeWildcardPort = exports.xpvtid = exports.__xpid = exports.xpVtEqual = exports.xpEqual = exports.portEqual = exports.getLoopbackXPForWildcard = exports.isLoopbackXP = exports.CrosspointSyncType = void 0;
const lodash_1 = __importDefault(require("lodash"));
var CrosspointSyncType;
(function (CrosspointSyncType) {
    CrosspointSyncType[CrosspointSyncType["SINGLE"] = 0] = "SINGLE";
    CrosspointSyncType[CrosspointSyncType["WILDCARD_SRC"] = 1] = "WILDCARD_SRC";
    CrosspointSyncType[CrosspointSyncType["WILDCARD_DST"] = 2] = "WILDCARD_DST";
})(CrosspointSyncType = exports.CrosspointSyncType || (exports.CrosspointSyncType = {}));
function isLoopbackXP(xp) {
    return xp.Source.Port === xp.Destination.Port
        && xp.Source.Node === xp.Destination.Node
        && xp.Source.IsInput != xp.Destination.IsInput;
}
exports.isLoopbackXP = isLoopbackXP;
function getLoopbackXPForWildcard(xp) {
    if (isWildcardPort(xp.Source))
        return {
            Source: lodash_1.default.cloneDeep(xp.Destination),
            Destination: lodash_1.default.cloneDeep(xp.Destination)
        };
    else
        return {
            Source: lodash_1.default.cloneDeep(xp.Source),
            Destination: lodash_1.default.cloneDeep(xp.Source)
        };
}
exports.getLoopbackXPForWildcard = getLoopbackXPForWildcard;
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
function withSourceAsSourceWildcard(xp) {
    return {
        Source: makeWildcardPort(),
        Destination: lodash_1.default.cloneDeep(xp.Source)
    };
}
exports.withSourceAsSourceWildcard = withSourceAsSourceWildcard;
function withSourceAsDestinationWildcard(xp) {
    return {
        Source: lodash_1.default.cloneDeep(xp.Source),
        Destination: makeWildcardPort()
    };
}
exports.withSourceAsDestinationWildcard = withSourceAsDestinationWildcard;
function withDestinationeAsSourceWildcard(xp) {
    return {
        Source: makeWildcardPort(),
        Destination: lodash_1.default.cloneDeep(xp.Destination)
    };
}
exports.withDestinationeAsSourceWildcard = withDestinationeAsSourceWildcard;
function withDestinationAsDestinationWildcard(xp) {
    return {
        Source: lodash_1.default.cloneDeep(xp.Destination),
        Destination: makeWildcardPort()
    };
}
exports.withDestinationAsDestinationWildcard = withDestinationAsDestinationWildcard;
//# sourceMappingURL=rrcs_defs.js.map