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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
// i will have to write this myself
const event_to_promise_1 = __importDefault(require("event-to-promise"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const readline_1 = require("readline");
const communication_1 = require("./communication");
const core_1 = require("./core");
const dsp_graph_1 = require("./dsp_graph");
const dsp_node_1 = require("./dsp_node");
const Logger = __importStar(require("./log"));
const util_1 = require("./util");
const log = Logger.get('DSPROC');
class LocalNodeController extends communication_1.NodeMessageInterceptor {
    constructor(options, ipc) {
        super();
        this._failsense = { input: 0, output: 0 };
        this._exec_location = options.dspExecutable;
        this._ipc = ipc;
        this._autorestart = true;
        this._ipc.on('open', () => {
            this.event('dsp-started');
        });
        this._ipc.on('closed', () => {
            this.event('dsp-died');
        });
        try {
            if (fs.existsSync(this.getDSPProcessCommmand()))
                this._exec_known = true;
            else
                this._exec_known = false;
        }
        catch (err) {
            log.warn('Could not find executable: ' + err);
            this._exec_known = false;
        }
        if (options.failsense_input) {
            log.info('Fail sense channel enabled');
            log.info(`Fail sense channels: ${options.failsense_input} -> ${options.failsense_output}`);
            this._failsense.input = options.failsense_input;
            this._failsense.output = options.failsense_output;
        }
    }
    target() {
        return 'dsp-controller';
    }
    handleMessage(msg, from_ipc) {
        return __awaiter(this, void 0, void 0, function* () {
            if (from_ipc) {
                util_1.ignore(log.error('Received a message from IPC. Thats not what we signed up for.'));
                throw 'Unexpected message';
            }
            switch (msg.field) {
                case 'is-started': return this._ipc._pipe != null;
                case 'restart': return this._restart();
                case 'await-start': return this._await_start(msg.data);
                case 'external': return this._exec_known == false;
                case 'fail-sense': return this._failsense;
                default: throw 'Unknown message';
            }
        });
    }
    getDSPExecutablePath() {
        let basepath = this._exec_location || process.env.SI_DSP_EXEC_LOCATION;
        if (!basepath) {
            if (os.type() == 'Darwin')
                basepath = process.cwd() + '/sidsp.app';
            else if (os.type() == 'Windows_NT')
                basepath = process.cwd() + '/sidsp.exe';
            else
                basepath = process.cwd() + '/sidsp';
        }
        return fs.realpathSync(basepath);
    }
    getDSPProcessCommmand() {
        let base = this.getDSPExecutablePath() + '';
        log.info('Looking for executable in ' + base);
        if (os.type() == 'Darwin')
            base += '/Contents/MacOS/sidsp';
        return base;
    }
    _await_start(timeout = 10000) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._ipc.connected())
                return true;
            if (this._exec_known) {
                log.info('Starting dsp process');
                this.start();
            }
            else
                log.warn('Could not find DSP executable. Waiting for external start');
            return util_1.promisifyEventWithTimeout(this._ipc, 'open', timeout);
        });
    }
    _restart() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._exec_known)
                throw 'DSP Process is running externally';
            if (this._cp) {
                this._autorestart = true;
                yield this.kill();
                yield event_to_promise_1.default(this._ipc, 'open');
                return util_1.ignore(log.info('DSP process started'));
            }
            else
                throw 'Not running';
        });
    }
    kill() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._exec_known)
                throw 'DSP Process is running externally';
            log.info('Killing DSP process');
            this._cp.kill();
            yield util_1.promisifyEventWithTimeout(this._cp, 'close', 1000);
            log.info('DSP process killed.');
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._exec_known)
                throw 'Executable location unknown. DSP process must be started externally';
            this._cp = child_process_1.spawn(this.getDSPProcessCommmand());
            this._stdout_rl
                = readline_1.createInterface({ input: this._cp.stdout });
            this._stderr_rl = readline_1.createInterface({ input: this._cp.stderr });
            this._stdout_rl.on('line', line => {
                log.info(line);
            });
            this._stderr_rl.on('line', line => {
                log.warn(line);
            });
            this._cp.on('close', errc => {
                log.error(`DSP process died. Return code: ${errc}  --- Restaring`);
                if (this._autorestart) {
                    this.start().catch(err => {
                        log.info('Could not restart DSP process: ' + err);
                    });
                }
            });
            this._cp.on('error', code => {
                log.error('DSP process error: ' + code);
            });
            this._cp.on('disconnect', () => { log.error('DSP process disconnect: '); });
        });
    }
}
exports.LocalNodeController = LocalNodeController;
class DSPController extends core_1.NodeModule {
    constructor(vst, webif) {
        super(dsp_node_1.DSPModuleNames.DSP_PROCESS);
        this._closed = false;
        this._vst = vst;
        this._graph = new dsp_graph_1.Graph(vst, webif);
        this._graph.setInputNode(128);
        this._graph.setOutputNode(128);
    }
    destroy() {
        this._closed = true;
    }
    init() {
    }
    start(remote) {
        this._remote = remote.getRequester('dsp-controller');
        this._remote_graph = remote.getRequester('graph');
        this._try_dsp_start().catch((err) => {
            log.error('DSP startup failed');
        });
        this._remote.on('dsp-started', () => {
            log.verbose('DSP startup event');
            this.events.emit('dsp-started');
            this._running = false;
        });
        this._remote.on('dsp-died', () => {
            log.verbose('DSP died event');
            this.events.emit('dsp-died');
            this._running = true;
        });
        this._remote_graph.on('connect-failed', () => {
            this._server._webif.broadcastWarning(this.myNode().name(), 'Not all DSP objects could be connected correctly');
        });
        this._connection = remote;
        this._graph.attachConnection(remote);
        this._remote.request('fail-sense')
            .then(msg => {
            this._fail_sense = msg.data;
        })
            .catch(err => {
            log.error('Could not retreive fail sense settings from node '
                + err);
        });
        log.info('Graph service running');
    }
    joined(socket, topic) {
        if (topic === 'dspstats')
            socket.emit(`${this.myNodeId()}.dspstats`, this._dspstats);
    }
    left(socket, topic) {
    }
    _publish_dspstats() {
        this.publish('dspstats', `${this.myNodeId()}.dspstats`, this._dspstats);
    }
    syncGraph() {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            return new Promise((resolve, reject) => {
                log.info('Syncing graph with DSP process');
                if (this._fail_sense) {
                    if (this._fail_sense.input > 0 && this._fail_sense.output > 0) {
                        let failsense_connection = this._graph.graphRootBus().connectIdxNIdx(this._graph.graphExitBus(), this._fail_sense.input - 1, 1, this._fail_sense.output - 1);
                        if (failsense_connection)
                            this._graph.addConnection(failsense_connection);
                    }
                }
                let graph = this._graph._export_graph();
                this._dspstats = {
                    num_dspobjects: graph.nodes.length,
                    num_connections: graph.connections.map(con => con.channelCount())
                        .reduce((prev, current) => prev + current, 0),
                    num_ports: graph.connections.length,
                    num_renderops: graph.nodes.length * 2 - 1,
                    fail_sense: this._fail_sense
                };
                this._publish_dspstats();
                self._remote_graph.request('set', graph)
                    .then(() => {
                    log.info('Done Syncing');
                    resolve();
                })
                    .catch(err => {
                    log.error('Could not sync graph: ' + err.message);
                    reject();
                });
            });
        });
    }
    // this is still not optimal
    // TODO: find a way to reject all returned promises
    // when the module is destroyed (connection is closed)
    _try_dsp_start() {
        return __awaiter(this, void 0, void 0, function* () {
            let is_started = false;
            while (!is_started && !this._closed) {
                try {
                    yield this._remote.requestTmt('await-start', 10000, 3000);
                    is_started = true;
                }
                catch (err) {
                    log.error('Still waiting for dsp start. Error: ' + err);
                }
            }
            if (!this._closed)
                this._running = true;
        });
    }
    waitStart() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._running)
                return this._try_dsp_start();
        });
    }
    graph() {
        return this._graph;
    }
    resetGraph() {
        return __awaiter(this, void 0, void 0, function* () {
            // await this._remote_graph.request('reset')
            this._graph.clear();
            this._graph.setInputNode(224);
            this._graph.setOutputNode(224);
        });
    }
}
exports.DSPController = DSPController;
//# sourceMappingURL=dsp_process.js.map