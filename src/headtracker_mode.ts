import chalk from 'chalk';
import * as dgram from 'dgram';
import * as osc from 'osc-min';
import SerialPort from 'serialport';
import {terminal} from 'terminal-kit';
import WebInterface from './web_interface';
import * as config from './server_config';

import {
    IEMOutputAdapter,
    LocalHeadtracker,
    OSCOutputAdapter,
    OutputAdapter,
    QuaternionContainer,
    SerialHeadtracker
} from './headtracker_serial';
import {Headtracking} from './headtracking'
import * as Logger from './log';

const { cyan } = chalk;
const log      = Logger.get('HEADTR');
import {AddressInfo} from 'net';
import {HeadtrackerInvertation} from './headtracker';
import { RestService } from './rest';
import { Server, Node } from './core';
import { NodeIdentification, SIServerWSServer } from './communication';

class OSCController {

    sock: dgram.Socket
    ht: Headtracking
    port: number;

    constructor(ht: Headtracking, options: any)
    {
        this.port = Number.parseInt(options.ctrlPort);

        this.ht = ht;

        this.sock = dgram.createSocket('udp4');
        this.sock.bind(this.port, this.onBound.bind(this));
        this.sock.on('message', this.onMessage.bind(this));
    }

    onBound()
    {
        log.info('Listening for control messages on port ' + this.port)
    }

    onMessage(buf: Buffer, addrinf: AddressInfo)
    {
        let packet = osc.fromBuffer(buf);

        if (packet.oscType == 'message') {
            if (packet.address == '/calibrate') {

                let loops = 32;
                let a     = <osc.OSCMessageArg>packet.args[0];

                if (a && a.type == 'integer')
                    loops = a.value;

                log.info('Received \'/calibrate\' message');

                let pg = terminal.progressBar(
                    { title : 'Calibrating Gyro', percent : true });

                this.ht.trackers.forEach(
                    t => t.calibrate(loops, (prog, step) => {
                              pg.update(prog);
                              if (prog == 1) {
                                  pg = terminal.progressBar({
                                      title : 'Calibrating Acc',
                                      percent : true
                                  });
                              }
                    }).then(() => {
                        pg.update(1);
                        setTimeout(() => {
                            pg.stop();
                            console.log();
                            log.info('Calibration done!');
                        }, 500);
                    }));
            }
            else if (packet.address == '/reset-orientation') {
                log.info('Received \'/reset-orientation\' message');
                this.ht.trackers.forEach(t => t.resetOrientation());
            }
            else if (packet.address == '/start') {
                this.ht.trackers.forEach(t => t.enableTx());
            }
            else if (packet.address == '/stop') {
                this.ht.trackers.forEach(t => t.disableTx());
            }
            else if (packet.address == '/srate') {
                if (packet.args.length == 1) {
                    let sratep = <osc.OSCMessageArg>packet.args[0];
                    if (!(sratep.type === 'integer'))
                        return log.error('Fick dich Till');
                    this.ht.trackers.forEach(
                        t => t.setSamplerate(<number>sratep.value));
                }
            }
            else if (packet.address == '/invert') {

                if (packet.args.length == 1) {

                    let argp = <osc.OSCMessageArg>packet.args[0];

                    if (argp.type == 'string') {

                        let str = <string>argp.value;
                        let axs = str.split('');

                        let inv: HeadtrackerInvertation = {
                            x : axs.indexOf('x') != -1,
                            y : axs.indexOf('y') != -1,
                            z : axs.indexOf('z') != -1
                        };

                        this.ht.trackers.forEach(t => t.setInvertation(inv));
                    }
                }
            }
            else if (packet.address == '/begin_init') {
                this.ht.trackers.forEach(t => {
                    log.info('Beginning initialization');
                    t.beginInit().then(() => {
                        log.info('OK. Nod down and proceed to next step');
                    });
                });
            }
            else if (packet.address == '/end_init') {
                this.ht.trackers.forEach(t => {
                    log.info('Finish initialization');
                    t.finishInit().then(() => {
                        log.info('Initialization done');
                    });
                });
            }
        }
    }
}

class DummyOutputAdapter extends OutputAdapter {
    process(q: QuaternionContainer): void
    {
        console.log(q);
    }
}

async function findPort(index: number)
{
    return SerialPort.list().then(ports => {
        if (ports.length < index || index < 1) {
            log.error('No port found for index ' + index);
            exit(1);
        }
        else
            return ports[index - 1].path;
    })
}

async function exit(code?: any)
{
    if (!(typeof code == 'number'))
        code = 0;

    terminal.processExit(code);
}

terminal.on('key', (name: string) => {
    if (name === 'CTRL_C')
        exit(0);
});

async function listPorts(): Promise<any>
{
    return SerialPort.list().then(ports => {
        console.log(
            'The following serial ports are available on your device [index] - [port]:');
        console.log();

        ports.forEach((p, i) => {
            console.log(`${cyan('' + (i + 1))} - ${p.path}`);
        });
    });
}

async function selectPort():
    Promise<string>{ return SerialPort.list().then(ports => {
        return terminal.singleColumnMenu(ports.map(p => p.path))
            .promise.then(res => {
                console.log();
                return res.selectedText;
            });
    }) }

function runFlashMode(p: SerialPort, options: any) {
    let htrk = new LocalHeadtracker(p, new DummyOutputAdapter());

    htrk.on('ready', () => {
        htrk.flashNewestFirmware(options.bootloader)
            .then(() => {
                exit(0);
            })
            .catch(err => {
                exit(1);
            });
    });
}

function runLatencyTest(p: SerialPort, options: any) {
    let htrk = new LocalHeadtracker(p, new DummyOutputAdapter())

    htrk.on('ready', () => {
        htrk.checkLatency().then(() => {
            exit();
        });
    });
}

class DummyServer extends Server {
    createNode(id: NodeIdentification): Node {
        return null;
    }
    destroyNode(node: Node): void {
    }
}

function runNormalMode(p: SerialPort, options: any) {

    options.webserver_port = options.webserver_port || 80;
    options.server_port = options.server_port || 43265;

    let io = new SIServerWSServer(options);
    let webif = new WebInterface(options);
    let dummy = new DummyServer(io, webif);
    let headtracking = new Headtracking(webif);
    webif.attachServer(dummy);
    dummy.add(webif);
    dummy.add(headtracking);

    if (options.oscControl)
        new OSCController(headtracking, options);

    let adapter: OSCOutputAdapter;

    if (options.preset) {
        if (options.preset == 'IEM') {
            adapter = new IEMOutputAdapter();
        }
        else {
            log.error('Preset ' + options.preset + ' not found');
            exit(1);
        }
    }
    else
        adapter = new OSCOutputAdapter();

    if (options.format == 'euler') {
        adapter.setOutputQuaternions(false);
        adapter.setOutputEuler(true);
    }
    else {
        adapter.setOutputQuaternions(true);
        adapter.setOutputEuler(false);
    }

    adapter.setRemote(options.host, options.port);

    if (!(options.preset)) {
        if (options.quaternionAddr) {
            let addrs = (<string>options.quaternionAddr).split(',');
            adapter.setQuatAddresses(<[ string, string, string, string ]>addrs);
        }

        if (options.eulerAddr) {
            let addrs = (<string>options.eulerAddr).split(',');
            adapter.setEulerAddresses(<[ string, string, string ]>addrs);
        }
    }

    let ht = new LocalHeadtracker(p, adapter);

    ht.on('close', () => {
        exit();
    })

    headtracking.addHeadtracker(ht, 99, 'local');
}

function setIdMode(port: SerialPort, id: number) {
    let dev = new LocalHeadtracker(port, new DummyOutputAdapter());

    dev.on('ready', async () => {
        if (dev.shtrk._id == id) {
            log.info('New id is old id. Nothing to do here.');
            exit(0);
            return;
        }

        log.info('Setting new ID: ' + id);

        await dev.setID(id);
        log.info('Done. Checking...');

        let newid = await dev.getID();
        log.info('Headtracker returned: ' + newid);

        if (newid == id) {
            log.info('Looks good!');
            exit(0);
        }
        else {
            log.error('Fail');
            exit(1);
        }
    })
}

function start(path: string, options: any) {
    log.info('Opening port ' + path);
    let p = new SerialPort(path, { autoOpen : false, baudRate : 115200 });

    p.on('open', err => {
        log.info('Port is now open');

        if (err) {
            log.error(`Could not open port ${path}, error: ${err.message}`);
            exit(1);
        }

        if (options.flashFirmware)
            return runFlashMode(p, options);

        if (options.testLatency)
            return runLatencyTest(p, options);

        if (options.setId || options.setId != null)
            return setIdMode(p, options.setId);

        runNormalMode(p, options);
    });

    p.open();
}


export default async function(port: string, options: any) {

    options.webserver_port = options.webserver_port || 80;

    if (options.listPorts)
        return listPorts().then(exit);

    if (!port) {

        if (options.auto) {
            return;
        }
        else {
            console.log('Please select a serial port (↑↓, Enter to confirm): ')
            return selectPort()
                .then(port => start(port, options))
                .catch(err => {
                    log.error('Could not select serial port ' + err);
                    exit(1);
                });
        }
    }

    let p_i = Number.parseInt(port);

    if (!isNaN(p_i))
        port = await findPort(p_i);

    start(port, options);
}
