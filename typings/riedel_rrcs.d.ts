declare module 'riedel_rrcs' {
    namespace riedel_rrcs { 
        
        class RRCS_Client {
            constructor(host: string, port: number);
        }

        interface Endpoint {
            ip: string,
            port: number
        }

        interface RRCSServerCallbacks {
            log: (msg: string) => void;
            initial?: (msg: any, error: any) => void;
            error?: (msg: any, error: any) => void;
            sendString?: (msg: string) => void;
        }

        class RRCS_Server {
            constructor(local: Endpoint, remote: Endpoint, callbacks: RRCSServerCallbacks);
        }
    }

    export = riedel_rrcs;
}