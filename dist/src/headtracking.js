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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Headtracking = exports.HeadtrackerInputEvents = void 0;
const mdns_1 = __importDefault(require("mdns"));
const Logger = __importStar(require("./log"));
const headtracker_network_1 = require("./headtracker_network");
const headtracker_1 = require("./headtracker");
const core_1 = require("./core");
// import mkbonjour, { Bonjour, Browser } from 'bonjour-hap';
let comCheckInterval = 10000;
const log = Logger.get('HTKHST');
exports.HeadtrackerInputEvents = {
    RESET_HEADTRACKER: 'headtracker-reset',
    CALIBRATE_STEP1: 'calibrate-one',
    CALIBRATE_STEP2: 'calibrate-two',
    HEADTRACKER_ON: 'headtracker-on',
    HEADTRACKER_OFF: 'headtracker-off'
};
class Headtracking extends core_1.ServerModule {
    constructor(interf, netif) {
        super('headtracking');
        this.trackers = [];
        this.local_interface = netif;
        this.webif = interf;
        this.browser = new mdns_1.default.Browser(mdns_1.default.udp('_htrk'), {
            networkInterface: netif,
        });
        this.browser.on('serviceUp', this.serviceFound.bind(this));
        this.browser.on('serviceDown', this.serviceRemoved.bind(this));
        this.browser.on('error', (err) => log.error(`MDNS-SD brower [Headtracking] error ${err}`));
        this.browser.start();
        let self = this;
        this.webif.io.on('connection', socket => {
            socket.on('htrk.update.req', () => {
                self.updateRemote(socket);
            });
            socket.on('htrk.sr.changed', (id, sr) => {
                self.getHeadtracker(id).setSamplerate(sr);
            });
            socket.on('htrk.stream.changed', (id, on) => {
                if (on)
                    self.getHeadtracker(id).enableTx();
                else
                    self.getHeadtracker(id).disableTx();
            });
            socket.on('htrk.reboot', (id) => {
                self.getHeadtracker(id).reboot();
            });
            socket.on('htrk.save', (id) => {
                self.getHeadtracker(id).save();
            });
            socket.on('htrk.invert.changed', (id, inv) => {
                log.info('Invertation changed on headtracker ' + id);
                self.getHeadtracker(id).setInvertation(inv);
            });
            socket.on('htrk.save.settings', (settings) => {
                self.getHeadtracker(settings.id)
                    .applyNetworkSettings(settings);
            });
            socket.on('htrk.reset.orientation', (id) => self.getHeadtracker(id)
                .resetOrientation());
            socket.on('htrk.init.1', (id) => self.getHeadtracker(id).beginInit());
            socket.on('htrk.init.2', (id) => self.getHeadtracker(id).finishInit());
        });
    }
    init() {
        this.events.on(exports.HeadtrackerInputEvents.RESET_HEADTRACKER, (id) => {
            let htrk = this.getHeadtracker(id);
            if (htrk)
                htrk.resetOrientation();
            else
                log.error(`Could not reset headtracker ${id}, headtracker not found`);
        });
        this.events.on(exports.HeadtrackerInputEvents.CALIBRATE_STEP1, (id) => {
            let htrk = this.getHeadtracker(id);
            if (htrk) {
                htrk.beginInit().catch(err => {
                    log.error("Could initialize headtracker vectors: ", err);
                });
            }
            else
                log.error(`Could initialize headtracker vectors: Headtracker ${id} not found`);
        });
        this.events.on(exports.HeadtrackerInputEvents.CALIBRATE_STEP2, (id) => {
            let htrk = this.getHeadtracker(id);
            if (htrk) {
                htrk.finishInit().catch(err => {
                    log.error("Could not finish headtracker initialization: " + err);
                });
            }
            else
                log.error(`Could not finish headtracker initialization: Headtracker ${id} not found`);
        });
        this.events.on(exports.HeadtrackerInputEvents.HEADTRACKER_ON, (id) => {
            let htrk = this.getHeadtracker(id);
            if (htrk) {
                htrk.enableTx();
            }
        });
        this.events.on(exports.HeadtrackerInputEvents.HEADTRACKER_OFF, (id) => {
            let htrk = this.getHeadtracker(id);
            if (htrk) {
                htrk.disableTx();
            }
        });
    }
    joined(sock, topic) {
    }
    left() {
    }
    serviceFound(service) {
        log.info('Found new headtracking service on ' + service.addresses[0]);
        let id = Number.parseInt(service.host.substr(8, 2));
        let htrk = new headtracker_network_1.NetworkHeadtracker(this.webif, id, service.addresses[0], service.port, this.local_interface);
        htrk.start();
        this.addHeadtracker(htrk, id, service.addresses[0]);
    }
    addHeadtracker(trk, id, address) {
        trk.on('update', this.updateRemote.bind(this));
        trk.on('connected', () => {
            this.events.emit('headtracker-connected', id);
        });
        let dup = this.trackers.find(trk => trk.remote.id == id);
        if (dup) {
            dup.destroy();
            this.trackers.splice(this.trackers.indexOf(dup), 1);
        }
        this.trackers.push(trk);
        log.info("Add Headtracker at " + address);
        this.webif.io.emit('htrk.connected', id, address);
    }
    serviceRemoved(service) { }
    getHeadtracker(id) {
        return this.trackers.filter(tr => tr.remote.conf.deviceID() == id)[0];
    }
    updateRemote(socket) {
        // clang-format off
        let tracker_update = this.trackers
            .map((tracker) => {
            if (tracker.remote.conf)
                return {
                    data: {
                        address: tracker.remote.addr,
                        gyro_online: tracker.remote.conf.isStateFlagSet(headtracker_1.HeadtrackerStateFlags.GY_PRESENT),
                        gyro_ready: tracker.remote.conf.isStateFlagSet(headtracker_1.HeadtrackerStateFlags.GY_RDY),
                        online: tracker.isOnline(),
                        samplerate: tracker.remote.conf.sample_rate,
                        stream_on: tracker.remote.conf.isDeviceFlagSet(headtracker_1.HeadtrackerConfigFlags.STREAM_ENABLED),
                        id: tracker.remote.conf.deviceID(),
                        settings: {
                            id: tracker.remote.conf.deviceID(),
                            addr: tracker.remote.conf.device_static_ip,
                            subnet: tracker.remote.conf.device_static_subnet,
                            dhcp: tracker.remote.conf.isNetworkFlagSet(headtracker_1.HeadtrackerNetworkFlags.DHCP)
                        },
                        invert: {
                            x: tracker.remote.conf.isStateFlagSet(headtracker_1.HeadtrackerStateFlags.INVERT_X),
                            y: tracker.remote.conf.isStateFlagSet(headtracker_1.HeadtrackerStateFlags.INVERT_Y),
                            z: tracker.remote.conf.isStateFlagSet(headtracker_1.HeadtrackerStateFlags.INVERT_Z)
                        }
                    }
                };
            else
                return null;
        })
            .filter(v => v != null);
        // clang-format on
        // log.info("Update webinterface")
        if (socket)
            socket.emit('htrk.update', tracker_update);
        else
            this.webif.io.emit('htrk.update', tracker_update);
    }
}
exports.Headtracking = Headtracking;
//# sourceMappingURL=headtracking.js.map