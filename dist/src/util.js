"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = __importStar(require("child_process"));
const os = __importStar(require("os"));
function applyMixins(derivedCtor, baseCtors) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
        });
    });
}
exports.applyMixins = applyMixins;
function openForUser(thing) {
    if (os.type() == 'Windows_NT')
        cp.spawn('start');
    else if (os.type() == 'Darwin')
        cp.spawn('open', [thing]);
}
exports.openForUser = openForUser;
function bitValue(bit) {
    return (1 << (bit));
}
exports.bitValue = bitValue;
function arrayDiff(base, excl) {
    let cpy = Array.from(base);
    let ecpy = Array.from(excl);
    cpy.forEach(e => {
        let idx = ecpy.findIndex(k => k === e);
        if (idx != -1)
            ecpy.splice(idx, 1);
    });
    return ecpy;
}
exports.arrayDiff = arrayDiff;
function localNetinfo() {
    return new Promise((res, rej) => {
        if (os.type() == "Darwin") {
        }
    });
}
exports.localNetinfo = localNetinfo;
const interfaces = os.networkInterfaces();
const local_interfaces = [];
Object.keys(interfaces).forEach(function (ifname) {
    var alias = 0;
    interfaces[ifname].forEach(function (iface) {
        if ('IPv4' != iface.family || iface.internal)
            return;
        local_interfaces.push(iface);
        ++alias;
    });
});
exports.LocalInterfaces = local_interfaces;
//# sourceMappingURL=util.js.map