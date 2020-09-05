"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = __importStar(require("child_process"));
const events_1 = require("events");
const os = __importStar(require("os"));
const readline = __importStar(require("readline"));
const Logger = __importStar(require("./log"));
const log = Logger.get('TIMECD');
function devices() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((res, rej) => {
            let proc = cp.spawn('ffmpeg', ['-f', 'avfoundation', '-list_devices', 'true', '-i', '']);
            const rl = readline.createInterface({ input: proc.stderr });
            const total_devices = [];
            const vdev = [];
            const adev = [];
            rl.on('line', (line) => {
                let match = line.match(/(\[[0-9]\] [^\n]*)/g);
                if (match)
                    total_devices.push(match[0]);
            });
            proc.on('close', (code) => {
                let parse_adev = 0;
                total_devices.forEach((dev => {
                    let numc = dev.match(/\[([0-9])\]/g);
                    if (numc) {
                        let num = numc[0].match(/[0-9]/g);
                        if (num) {
                            let idx = Number.parseInt(num[0]);
                            let devarr = dev.split(']');
                            let devstr = devarr[devarr.length - 1].trim();
                            if (idx === 0)
                                ++parse_adev;
                            if (parse_adev < 2)
                                vdev.push(devstr);
                            else
                                adev.push(devstr);
                        }
                    }
                }));
                if (adev.length === 0)
                    adev.push(...vdev);
                if (adev.length)
                    res(adev);
                else
                    rej();
            });
        });
    });
}
exports.devices = devices;
function _ff_dev_format_args() {
    if (os.type() == 'Darwin')
        return ['-f', 'avfoundation'];
}
class TimecodeReader extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this._cidx = 0;
        this._frate = 30;
        this._srate = 48000;
        this._running = false;
    }
    setDevice(idx) {
        log.debug("Timecode input device index set: " + idx);
        this._didx = idx;
    }
    setChannel(ch) {
        log.debug("Timcode input channel set: " + ch);
        this._cidx = ch;
    }
    setOptions(frate, srate) {
        log.debug("Timecode samplerate set: " + srate);
        log.debug("Timecode framerate set: " + frate);
        this._srate = srate;
        this._frate = frate;
    }
    start() {
        this._launch_ltcstreamer();
        this._launch_ffmpeg();
        this._ffmpeg.stdout.pipe(this._ltcstreamer.stdin);
        this._ltcreader
            = readline.createInterface({ input: this._ltcstreamer.stdout });
        this._ltcreader.on('line', this._on_ltc_line.bind(this));
        this._running_tm = setTimeout(this._on_ltc_timeout.bind(this), 2000);
        log.info("Started listening for timecode");
    }
    stop() {
        if (this._ffmpeg)
            this._ffmpeg.kill("SIGKILL");
        if (this._ltcstreamer)
            this._ltcstreamer.kill("SIGKILL");
        clearTimeout(this._running_tm);
        if (this._running)
            this.emit("stop");
        log.info("Stopped reading timecode" + (this._currenttc.length ? " at " + this._currenttc : ""));
    }
    _on_ltc_line(line) {
        this._currenttc = line;
    }
    _on_ltc_timeout() {
        if (this._currenttc == this._lasttc) {
            if (this._running) {
                this.emit("stop", this._currenttc);
                log.warn('Stopped receiving timecode at ' + this._currenttc);
                this._running = false;
            }
        }
        else {
            this._lasttc = this._currenttc;
            if (!this._running) {
                this._running = true;
                this.emit("start", this._currenttc);
                log.info("Started receiving timecode at " + this._currenttc);
            }
        }
        this._running_tm
            = setTimeout(this._on_ltc_timeout.bind(this), 2000);
    }
    _ff_device_arg() {
        return ['-i', `:${this._didx}`];
    }
    _ff_pan_option() {
        return ['-af', `pan=mono|c0=c${this._cidx}`];
    }
    _launch_ffmpeg() {
        this._ffmpeg = cp.spawn('ffmpeg', [
            '-loglevel',
            'warning',
            ..._ff_dev_format_args(),
            ...this._ff_device_arg(),
            ...this._ff_pan_option(),
            '-r:a',
            this._srate.toFixed(0),
            '-f',
            'u8',
            '-'
        ]);
        log.info('ffmpeg running');
        this._ffmpeg.stderr.on("data", data => {
            log.warn(data);
        });
        this._ffmpeg.on('close', (code) => {
            log.warn('ffmpeg exited with code ' + code);
        });
    }
    _launch_ltcstreamer() {
        this._ltcstreamer
            = cp.spawn('ltcstreamer', [this._frate.toFixed(0), this._srate.toFixed(0), '1']);
        log.info('ltcstreamer running');
        this._ltcstreamer.on('close', (code) => {
            log.warn('ltcstreamer exited with code ' + code);
        });
    }
}
exports.TimecodeReader = TimecodeReader;
class TimecodeNode {
    constructor(connection) {
        this._ready = false;
        this._rtp_available = false;
        this._remote = connection.getRequester("tc");
        this._remote.connection.on("connection", () => __awaiter(this, void 0, void 0, function* () {
            let is_available = (yield this._remote.request("rtp-available")).data;
            if (typeof is_available == "boolean")
                this._rtp_available = is_available;
            else
                log.warn("Unexpected response type for rtp-available");
            this.start({
                sdp: `v=0
                o=- 50125618808 50125618808 IN IP4 192.168.0.103
                s=SSL-NetIO-MADI-MM-414 : 32
                i=1 channels: 01
                c=IN IP4 239.10.148.244/32
                t=0 0
                a=keywds:Dante
                m=audio 5004 RTP/AVP 96
                c=IN IP4 239.10.148.244/32
                a=recvonly
                a=rtpmap:96 L24/48000/1
                a=ptime:1
                a=ts-refclk:ptp=IEEE1588-2008:00-1D-C1-FF-FE-12-2D-4C:0
                a=mediaclk:direct=641649978
                `,
                channel: 0,
                samplerate: 48000,
                framerate: 25
            }).then(() => {
                setInterval(() => {
                    this.time().then((t) => {
                        console.log(t);
                    }).catch(err => {
                        log.error(err);
                    });
                }, 200);
            }).catch(err => {
                log.error(err);
            });
            this._ready = true;
        }));
    }
    time(tmt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (tmt)
                    return this._remote.requestTypedWithTimeout("time", tmt).str();
                else
                    return this._remote.requestTyped("time").str();
            }
            catch (err) {
                log.error("Error getting time from node: " + err);
                return "XX:XX:XX:XX";
            }
        });
    }
    start(transport) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._remote.requestTyped("start-sdp", transport).str();
        });
    }
}
exports.TimecodeNode = TimecodeNode;
;
class Timecode {
    constructor(nodes) {
        this._nodes = nodes;
    }
}
exports.Timecode = Timecode;
//# sourceMappingURL=timecode.js.map