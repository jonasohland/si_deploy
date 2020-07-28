"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const riedel_rrcs_1 = require("riedel_rrcs");
const core_1 = require("./core");
const Logger = __importStar(require("./log"));
const headtracking_1 = require("./headtracking");
const log = Logger.get('RRCSSV');
class RRCSModule extends core_1.ServerModule {
    constructor(config) {
        super('rrcs');
        console.log(config);
        if (config.rrcs) {
            this.rrcssrv
                = new riedel_rrcs_1.RRCS_Server({ ip: '0.0.0.0', port: 6870 }, { ip: config.rrcs, port: 8193 }, this);
        }
    }
    init() {
    }
    joined(socket) {
    }
    left(socket) {
    }
    processStringCommand(str) {
        let cmd = str.split('-');
        switch (cmd.shift()) {
            case 'headtracker':
                this.processHeadtrackerCommand(cmd);
                break;
        }
    }
    processHeadtrackerCommand(cmd) {
        let id = Number.parseInt(cmd[1]);
        switch (cmd.shift()) {
            case 'reset':
                this.events.emit(headtracking_1.HeadtrackerInputEvents.RESET_HEADTRACKER, id);
                break;
            case 'init':
                this.events.emit(headtracking_1.HeadtrackerInputEvents.CALIBRATE_STEP1, id);
                break;
            case 'on':
                this.events.emit(headtracking_1.HeadtrackerInputEvents.HEADTRACKER_ON, id);
                break;
            case 'off':
                this.events.emit(headtracking_1.HeadtrackerInputEvents.HEADTRACKER_OFF, id);
        }
    }
    processHeadtrackerOffCommand(cmd) {
        let id = Number.parseInt(cmd[1]);
        switch (cmd.shift()) {
            case 'init':
                this.events.emit(headtracking_1.HeadtrackerInputEvents.CALIBRATE_STEP2, id);
                break;
        }
    }
    processStringOffCommand(str) {
        let cmd = str.split('-');
        switch (cmd.shift()) {
            case 'headtracker':
                this.processHeadtrackerOffCommand(cmd);
                break;
        }
    }
    /**
     * RRCS handlers
     */
    initial(msg, error) {
        console.log(msg);
        console.log(error);
    }
    log(msg) {
        log.info(msg);
    }
    error(err) {
        log.error(err);
    }
    getAlive(msg) {
        return true;
    }
    crosspointChange(params) {
    }
    sendString(params) {
        try {
            this.processStringCommand(params[1]);
        }
        catch (err) {
            log.error(`Could not process string command from artist: ` + err);
        }
    }
    sendStringOff(params) {
        try {
            this.processStringOffCommand(params[1]);
        }
        catch (err) {
            log.error(`Could not process string-off command from artist: ` + err);
        }
    }
    gpInputChange(params) {
    }
    logicSourceChange(params) {
    }
    configurationChange(params) {
    }
    upstreamFailed(params) {
    }
    upstreamFaieldCleared(params) {
    }
    downstreamFailed(params) {
    }
    downstreamFailedCleared(params) {
    }
    nodeControllerFailed(params) {
    }
    nodeControllerReboot(params) {
    }
    clientFailed(params) {
    }
    clientFailedCleared(params) {
    }
    portInactive(params) {
    }
    portActive(params) {
    }
    connectArtistRestored(params) {
    }
    connectArtistFailed(params) {
    }
    gatewayShutdown(params) {
    }
    notFound(params) {
    }
}
exports.RRCSModule = RRCSModule;
//# sourceMappingURL=rrcs.js.map