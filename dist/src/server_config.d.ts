import commander from 'commander';
export declare function loadServerConfigFile(config_file?: string): void;
export declare function merge(cmd_opts: commander.Command): {
    interface?: string;
    web_interface?: string;
    node_name?: string;
    webserver?: boolean;
    server_port?: number;
    webserver_port?: number;
    rrcs?: string;
    rrcs_port?: number;
    rrcs_osc_host?: string;
    rrcs_osc_port?: number;
    rrcs_server?: string;
    failsense_input?: number;
    failsense_output?: number;
    ignore_subtitles?: boolean;
};
