import { RRCS_Server, RRCS_Client } from 'riedel_rrcs';
import * as Logger from './log';

const log = Logger.get('RRCSSV');

export function startRRCS() {
    let srrcs = new RRCS_Server({ ip: "0.0.0.0", port: 6870 }, { ip: "192.168.178.98", port: 8193 }, {
        initial: (msg, error) => {
            console.log(msg);
            console.log(error);
        },
        log: msg => {
            log.info(msg)
        },
        error: err => {
            log.error(err)
        },
    });
}