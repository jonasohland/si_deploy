"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Logger = __importStar(require("./log"));
const rrcs_defs_1 = require("./rrcs_defs");
const log = Logger.get('RRCSLX');
function parsePorts(ports) {
    let masters = [];
    let exprs = [];
    ports.forEach(port => {
        if (port.Subtitle)
            parseRRCSExpressions(exprs, RRCSExpressionSource.SUBTITLE, port.Subtitle, port);
        if (port.Name)
            parseRRCSExpressions(exprs, RRCSExpressionSource.NAME, port.Name, port);
        if (port.Label)
            parseRRCSExpressions(exprs, RRCSExpressionSource.LABEL, port.Label, port);
        if (port.Alias)
            parseRRCSExpressions(exprs, RRCSExpressionSource.ALIAS, port.Alias, port);
    });
    let ids = exprs.filter(ex => ex.type === RRCSExpressions.PORT_ID);
    let vts = exprs.filter(ex => ex.type === RRCSExpressions.SYNC_VOLUME_TARGET);
    for (let tgt of vts) {
        let srcid = findPortForID(ids, tgt.volsrc_src, true);
        let destid = findPortForID(ids, tgt.volsrc_dest, false);
        if (srcid == null || destid == null) {
            log.error(`Failed to build VolumeTarget (${tgt.volsrc_src}/${tgt.volsrc_dest})`);
            continue;
        }
        let masterxp = {
            Source: {
                Node: srcid.port.Node,
                Port: srcid.port.Port,
                IsInput: true
            },
            Destination: {
                Node: destid.port.Node,
                Port: destid.port.Port,
                IsInput: false
            }
        };
        let slavesrc = findPortForID(ids, tgt.fromxp_src, true);
        if (slavesrc == null) {
            log.error(`Could not find source port for volume target XP`);
            return;
        }
        let slavexp = {
            Source: {
                Node: slavesrc.port.Node,
                Port: slavesrc.port.Port,
                IsInput: true
            },
            Destination: { Node: tgt.port.Node, Port: tgt.port.Port, IsInput: false }
        };
        let confmaster = rrcs_defs_1.makeXPSync(rrcs_defs_1.makeXPVolumeSource(masterxp, true));
        let singlemaster = rrcs_defs_1.makeXPSync(rrcs_defs_1.makeXPVolumeSource(masterxp, false));
        if (tgt.use_conf && tgt.use_single) {
            if (tgt.single && tgt.conf) {
                confmaster.slaves.push(rrcs_defs_1.makeConferenceVolumeTarget(slavexp));
                singlemaster.slaves.push(rrcs_defs_1.makeSingleVolumeTarget(slavexp));
            }
            else {
                if (tgt.single) {
                    confmaster.slaves.push(rrcs_defs_1.makeSingleVolumeTarget(slavexp));
                    singlemaster.slaves.push(rrcs_defs_1.makeSingleVolumeTarget(slavexp));
                }
                else if (tgt.conf) {
                    confmaster.slaves.push(rrcs_defs_1.makeConferenceVolumeTarget(slavexp));
                    singlemaster.slaves.push(rrcs_defs_1.makeConferenceVolumeTarget(slavexp));
                }
            }
            masters.push(confmaster, singlemaster);
        }
        else if (tgt.use_conf) {
            if (tgt.single && tgt.conf) {
                confmaster.slaves.push(rrcs_defs_1.makeConferenceVolumeTarget(slavexp));
                confmaster.slaves.push(rrcs_defs_1.makeSingleVolumeTarget(slavexp));
            }
            else {
                if (tgt.single)
                    confmaster.slaves.push(rrcs_defs_1.makeSingleVolumeTarget(slavexp));
                else if (tgt.conf)
                    confmaster.slaves.push(rrcs_defs_1.makeConferenceVolumeTarget(slavexp));
            }
            masters.push(confmaster);
        }
        else if (tgt.use_single) {
            if (tgt.single && tgt.conf) {
                singlemaster.slaves.push(rrcs_defs_1.makeConferenceVolumeTarget(slavexp));
                singlemaster.slaves.push(rrcs_defs_1.makeSingleVolumeTarget(slavexp));
            }
            else {
                if (tgt.single)
                    singlemaster.slaves.push(rrcs_defs_1.makeSingleVolumeTarget(slavexp));
                else if (tgt.conf)
                    singlemaster.slaves.push(rrcs_defs_1.makeConferenceVolumeTarget(slavexp));
            }
            masters.push(singlemaster);
        }
    }
    return masters;
}
exports.parsePorts = parsePorts;
function mergeslaves(xps, slvs) {
}
function findPortForID(ids, id, input) {
    return ids.find(i => i.id === id
        && ((i.port.Input === input) || (i.port.Output !== input)));
}
var RRCSExpressionSource;
(function (RRCSExpressionSource) {
    RRCSExpressionSource[RRCSExpressionSource["NAME"] = 0] = "NAME";
    RRCSExpressionSource[RRCSExpressionSource["LABEL"] = 1] = "LABEL";
    RRCSExpressionSource[RRCSExpressionSource["ALIAS"] = 2] = "ALIAS";
    RRCSExpressionSource[RRCSExpressionSource["SUBTITLE"] = 3] = "SUBTITLE";
})(RRCSExpressionSource || (RRCSExpressionSource = {}));
var RRCSExpressions;
(function (RRCSExpressions) {
    RRCSExpressions[RRCSExpressions["ANY"] = 0] = "ANY";
    RRCSExpressions[RRCSExpressions["PORT_ID"] = 1] = "PORT_ID";
    RRCSExpressions[RRCSExpressions["SYNC_VOLUME_TARGET"] = 2] = "SYNC_VOLUME_TARGET";
    RRCSExpressions[RRCSExpressions["SYNC_XP_TARGET"] = 3] = "SYNC_XP_TARGET";
})(RRCSExpressions || (RRCSExpressions = {}));
function _exprs_add_setxp(exprs, origin, expr) {
    let exprobj = origin;
    exprs.push(exprobj);
}
function _exprs_add_voltgt(exprs, origin, char, expr) {
    let exprobj = origin;
    let fromxp_tgt = expr.split('/');
    let fromxp = fromxp_tgt[0];
    let vsource;
    exprobj.use_conf = char === '&' || char === '~';
    exprobj.use_single = char === '+' || char === '~';
    if (fromxp == null) {
        log.error(`Error lexing rrcs expressions in config: Could not extract XPVolume target XP source port from string '${expr}'`);
        return;
    }
    if (fromxp_tgt[1]) {
        if (fromxp_tgt[1].indexOf('+') != -1) {
            vsource = fromxp_tgt[1].split('+');
            exprobj.single = true;
            exprobj.conf = false;
        }
        else if (fromxp_tgt[1].indexOf('&') != -1) {
            vsource = fromxp_tgt[1].split('&');
            exprobj.conf = true;
            exprobj.single = false;
        }
        else if (fromxp_tgt[1].indexOf('~') != -1) {
            vsource = fromxp_tgt[1].split('~');
            exprobj.single = true;
            exprobj.conf = true;
        }
    }
    if (vsource == null || vsource.length < 1) {
        log.error(`Error lexing rrcs expressions in config: Could not extract XPVolume source from string ${expr}`);
        return;
    }
    exprobj.fromxp_src = fromxp;
    if (vsource[0] == '') {
        exprobj.volsrc_src = fromxp;
        exprobj.volsrc_dest = vsource[1];
    }
    else if (vsource[0].length > 0) {
        exprobj.volsrc_src = vsource[0];
        exprobj.volsrc_dest = vsource[1];
    }
    else {
        log.error(`Could not extract volume sync target from string ${expr}`);
        return;
    }
    exprobj.type = RRCSExpressions.SYNC_VOLUME_TARGET;
    log.debug(`Found [${RRCSExpressions[RRCSExpressions.SYNC_VOLUME_TARGET]}] expression in [${RRCSExpressionSource[origin.source]}] of port [${exprobj.port.Name}]. Target XP src: '${exprobj.fromxp_src}' Source XP: (${exprobj.volsrc_src}/${exprobj.volsrc_dest})`);
    exprs.push(exprobj);
}
function _exprs_add_id(exprs, origin, expr, sec_ch) {
    let exprobj = origin;
    exprobj.id = expr;
    exprobj.type = RRCSExpressions.PORT_ID;
    if (exprobj.port.HasSecondChannel && sec_ch)
        exprobj.port.Port++;
    log.debug(`Found [${RRCSExpressions[RRCSExpressions.PORT_ID]}]            expression in [${RRCSExpressionSource[origin.source]}] of port [${origin.port.Name}]: ${exprobj.id} ${(sec_ch && exprobj.port.HasSecondChannel) ? '(applies to 2nd channel)'
        : ''}`);
    exprs.push(exprobj);
}
function parseRRCSExpressions(exprlist, source, str, port) {
    let exprs = str.split(' ');
    exprs.forEach(ex => {
        let origin = { port, str, source, type: RRCSExpressions.ANY };
        switch (ex.charAt(0)) {
            case '!':
                _exprs_add_setxp(exprlist, origin, ex.substr(1));
                break;
            case '+':
                _exprs_add_voltgt(exprlist, origin, '+', ex.substr(1));
                break;
            case '&':
                _exprs_add_voltgt(exprlist, origin, '&', ex.substr(1));
                break;
            case '~':
                _exprs_add_voltgt(exprlist, origin, '~', ex.substr(1));
                break;
            case '$':
                _exprs_add_id(exprlist, origin, ex.substr(1), false);
                break;
            case '%':
                _exprs_add_id(exprlist, origin, ex.substr(1), true);
                break;
        }
    });
}
//# sourceMappingURL=rrcs_lex.js.map