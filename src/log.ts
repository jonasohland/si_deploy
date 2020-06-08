import chalk from 'chalk'
import io from 'socket.io';
import {inherits} from 'util';
import winston, {level, Logger} from 'winston'
import Transport from 'winston-transport'

import * as files from './files';

const cformat
    = winston.format.printf(({ level, message, label, timestamp }) => {
          let c;

          switch (level) {
              case 'error': c = chalk.red; break;
              case 'warn': c = chalk.yellow; break;
              case 'info': c = chalk.cyan; break;
              default: c = (str: string) => str; break;
          }

          return `[${c(label)}] ${new Date(timestamp).toLocaleTimeString()}: ${
              message}`;
      });

class RemoteConsoleTransport extends Transport {

    server: SocketIO.Server;

    constructor()
    {
        super();
        this.setMaxListeners(20);
    }

    attach(s: SocketIO.Server)
    {
        this.server = s;

        this.server.on('connection', socket => {
            socket.on('log.request',
                      () => {

                      });
        });

        this.server.sockets.emit('log.attached');
    }

    log(info: any, callback: any)
    {
        if (this.server)
            this.server.sockets.emit('global_log', {
                message: info[Symbol.for('message')],
                    level: info[Symbol.for('level')]
            });

        callback();
    }
}

const log_lvl = {
    v : process.env.SI_LOG_LVL || 'info'
};
const transports: Transport[] = [];
let log: { l?: Logger }       = {};

const logfilename = files.showfileDir('logs/')
                    + new Date(Date.now()).toISOString().replace(/[.,:]/g, '_')
                    + '.log';

function _init()
{
    log.l = get('LOGGER', true);
    log.l.info('Writing logs to ' + logfilename);
}

export function setLogLVL(lvl: number)
{
    const lvls = [ 'crit', 'error', 'warning', 'notice', 'info', 'debug' ];

    if (lvl >= lvls.length || lvl < 0) {
        console.error(`Log level out of range [${0},${lvls.length - 1}]`);
        process.exit(5);
    }

    console.log('Starting logging service with log levl: ' + lvls[lvl]);

    log_lvl.v = lvls[lvl];

    transports.forEach(t => t.level = lvls[lvl]);
}

export function get(module_name: string, init?: boolean): winston.Logger
{
    if (!init && log.l == undefined)
        _init();

    if (!init)
        log.l.debug('Initializing logger for ' + module_name);

    let cslt = new winston.transports.Console({
        level : log_lvl.v,
        format : winston.format.combine(
            winston.format.label({ label : module_name }),
            winston.format.timestamp(),
            cformat),
    });

    let filet = new winston.transports.File({
        filename : logfilename,
        level : 'debug',
        format : winston.format.json()
    });

    transports.push(cslt);

    return winston.createLogger({ transports : [ cslt, filet ] });
}