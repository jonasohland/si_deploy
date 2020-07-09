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
const ip_1 = require("ip");
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
        if (os.type() == 'Darwin') {
        }
    });
}
exports.localNetinfo = localNetinfo;
function defaultIF(name) {
    return (name ? name : '0.0.0.0');
}
exports.defaultIF = defaultIF;
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
function getMatchingLocalInterface(addr) {
    return exports.LocalInterfaces.filter(ifs => {
        addr.forEach(a => {
            if (ip_1.subnet(a, ifs.netmask) == ip_1.subnet(ifs.address, ifs.netmask))
                return true;
        });
        return false;
    });
}
exports.getMatchingLocalInterface = getMatchingLocalInterface;
function ignore(...any) {
    // do nothing (magical.....)
}
exports.ignore = ignore;
function promisifyEventWithTimeout(eventemitter, event, timeout = 10000) {
    return new Promise((res, rej) => {
        const handler = (val) => {
            clearTimeout(tmt);
            eventemitter.removeListener(event, handler);
            res(val);
        };
        const tmt = setTimeout(() => {
            rej('Timeout');
            eventemitter.removeListener(event, handler);
        }, timeout);
        eventemitter.on(event, handler);
    });
}
exports.promisifyEventWithTimeout = promisifyEventWithTimeout;
//# sourceMappingURL=util.js.map