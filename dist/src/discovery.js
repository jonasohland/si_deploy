"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dnssd = __importStar(require("dnssd"));
function getWebinterfaceAdvertiser(port, netif) {
    return new dnssd.Advertisement(dnssd.tcp('http'), port, { interface: netif, name: "Spatial Intercom Manager", txt: { path: "/admin/settings" } });
}
exports.getWebinterfaceAdvertiser = getWebinterfaceAdvertiser;
function getServerAdvertiser(port, netif) {
    return new dnssd.Advertisement(dnssd.tcp('si-server'), port, { interface: netif });
}
exports.getServerAdvertiser = getServerAdvertiser;
function getServerBrowser(netif) {
    return new dnssd.Browser(dnssd.tcp('si-server'), { interface: netif });
}
exports.getServerBrowser = getServerBrowser;
//# sourceMappingURL=discovery.js.map