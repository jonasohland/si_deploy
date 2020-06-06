import * as ipc from './ipc';
export interface PluginDescription {
    category: string;
    display_name: string;
    manufacturer: string;
    name: string;
    platform_id: string;
    version: string;
}
export declare class Manager {
    knownPlugins: PluginDescription[];
    requester: ipc.Requester;
    constructor(con: ipc.Connection);
    refreshPluginList(): Promise<boolean>;
    isPluginInList(name: string): boolean;
    findPlugin(name: string): PluginDescription;
}
