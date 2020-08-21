"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function xpEqual(lhs, rhs) {
    return lhs.Source.Port == lhs.Destination.Port
        && lhs.Source.Node == lhs.Destination.Node
        && lhs.Source.IsInput == lhs.Destination.IsInput;
}
exports.xpEqual = xpEqual;
function xpVtEqual(lhs, rhs) {
    return xpEqual(lhs.xp, rhs.xp) && lhs.single === rhs.single
        && lhs.conf === rhs.conf;
}
exports.xpVtEqual = xpVtEqual;
function __xpid(xp) {
    return `${xp.Source.Node}-${xp.Source.Port}-${xp.Source.IsInput ? 'i' : 'o'}|${xp.Destination.Node}-${xp.Destination.Port}-${xp.Destination.IsInput ? 'i' : 'o'}`;
}
exports.__xpid = __xpid;
function xpvtid(xp_vt) {
    return __xpid(xp_vt.xp) + (xp_vt.conf ? '-conf' : '-single');
}
exports.xpvtid = xpvtid;
//# sourceMappingURL=rrcs_defs.js.map