"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dnssd = __importStar(require("mdns"));
const Logger = __importStar(require("./log"));
const log = Logger.get('DISCVY');
function getWebinterfaceAdvertiser(port, netif) {
    let advertisement = new dnssd.Advertisement(dnssd.tcp('http'), port, { networkInterface: netif, name: "Spatial Intercom Manager", txtRecord: { path: "/admin/settings" } });
    advertisement.on('error', err => log.error(`MDNS-SD [${dnssd.tcp('http').name}] advertisement error ${err}`));
    return advertisement;
}
exports.getWebinterfaceAdvertiser = getWebinterfaceAdvertiser;
function getServerAdvertiser(port, netif) {
    let advertisement = new dnssd.Advertisement(dnssd.tcp('si-server'), port, { networkInterface: netif });
    advertisement.on('error', err => log.error(`MDNS-SD [${dnssd.tcp('si-server').name}] advertisement error ${err}`));
    return advertisement;
}
exports.getServerAdvertiser = getServerAdvertiser;
function getServerBrowser(netif) {
    let browser = new dnssd.Browser(dnssd.tcp('si-server'), { networkInterface: netif });
    browser.on('error', (err) => log.error(`MDNS-SD browser [${dnssd.tcp('si-server').name}] error ` + err));
    return browser;
}
exports.getServerBrowser = getServerBrowser;
//# sourceMappingURL=discovery.js.map