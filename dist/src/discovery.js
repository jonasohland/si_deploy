"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerBrowser = exports.getServerAdvertiser = exports.getWebinterfaceAdvertiser = void 0;
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