"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const ini_1 = __importDefault(require("ini"));
const net = __importStar(require("net"));
const os = __importStar(require("os"));
const Logger = __importStar(require("./log"));
const log = Logger.get('CONFIG');
const _config_path = os.userInfo().homedir + '/.spatial_intercom';
let _config_file = {};
function loadServerConfigFile(config_file) {
    let configfile = config_file || _config_path;
    if (fs.existsSync(configfile)) {
        log.info('Loading configuration file from ' + _config_path);
        _config_file = ini_1.default.parse(fs.readFileSync(_config_path).toString());
    }
    else {
        log.warn("No config file found at " + configfile);
    }
}
exports.loadServerConfigFile = loadServerConfigFile;
function getNodeName(options) {
    let conf_file_name;
    if (_config_file.instance)
        conf_file_name = _config_file.instance.name;
    return options.nodeName || conf_file_name || os.hostname();
}
function getInterface(option, interfaces) {
    if (interfaces[option])
        return interfaces[option]
            .filter((intf) => intf.family == 'IPv4')[0]
            .address;
    else
        log.error('Could not find network interface ' + option);
}
function merge(cmd_opts) {
    let output = {};
    if (!_config_file.network)
        _config_file.network = {};
    if (!_config_file.artist)
        _config_file.artist = {};
    if (!_config_file.dsp)
        _config_file.dsp = {};
    let interface_ = cmd_opts.interface || _config_file.network.interface;
    let webif_opt = cmd_opts.webInterface || _config_file.network.web_interface
        || cmd_opts.interface || _config_file.network.interface;
    output.rrcs = cmd_opts.gateway || _config_file.artist.gateway || '127.0.0.1';
    output.rrcs_port = cmd_opts.gatewayPort || _config_file.artist.port || 8193;
    output.rrcs_server = cmd_opts.serverInterface || _config_file.artist.server || '127.0.0.1';
    output.rrcs_osc_host = cmd_opts.rrcsOscHost || _config_file.artist.rrcs_osc_host || '127.0.0.1';
    output.rrcs_osc_port = cmd_opts.rrcsOscPort || _config_file.artist.rrcs_osc_port || 9955;
    output.rrcs_osc_port = Number.parseInt(output.rrcs_osc_port);
    output.ignore_subtitles = cmd_opts.ignoreSubtitles || false;
    output.failsense_input = Number.parseInt(cmd_opts.failSenseInput || _config_file.dsp.failsense_input || 0);
    output.failsense_output = Number.parseInt(cmd_opts.failSenseOutput || _config_file.dsp.failsense_output || 0);
    if (output.failsense_input && output.failsense_output < 1) {
        log.info(`Using failsave input ${output.failsense_input} as output channel`);
        output.failsense_output = output.failsense_input;
    }
    const netifs = os.networkInterfaces();
    if (interface_)
        output.interface = (net.isIP(interface_))
            ? interface_
            : getInterface(interface_, netifs);
    if (webif_opt)
        output.web_interface = (net.isIP(webif_opt))
            ? webif_opt
            : getInterface(webif_opt, netifs);
    output.node_name = getNodeName(cmd_opts);
    output.webserver = cmd_opts.webserver;
    output.server_port = Number.parseInt(cmd_opts.port) || Number.parseInt(process.env.SI_SERVER_PORT) ||
        Number.parseInt(_config_file.network.port) || 45545;
    output.webserver_port = Number.parseInt(cmd_opts.webserverPort) || Number.parseInt(process.env.SI_WEBSERVER_PORT) ||
        Number.parseInt(_config_file.network.webserver_port) || 8090;
    // console.log(_config_file.network);
    // console.log(output);
    return output;
}
exports.merge = merge;
//# sourceMappingURL=server_config.js.map