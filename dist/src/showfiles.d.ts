/// <reference types="node" />
import { EventEmitter } from 'events';
interface ShowfileRecordData {
    data: any;
    name: string;
    uid: string;
}
interface ShowfileSectionData {
    records: ShowfileRecordData[];
    name: string;
    uid: string;
}
interface ShowfileTargetData {
    name: string;
    sections: ShowfileSectionData[];
}
export declare abstract class ShowfileTarget extends EventEmitter {
    _sections: ShowfileSection[];
    abstract targetName(): string;
    abstract onEmptyShowfileCreate(s: Showfile): void;
    beforeShowfileLoad(): void;
    afterShowfileLoad(): void;
    addSection(section: ShowfileSection): import("winston").Logger;
    doLoadShowfile(sf: Showfile): void;
    showfileTargetData(): Promise<ShowfileTargetData>;
}
export declare abstract class ShowfileRecord {
    _name: string;
    _uid: string;
    constructor(name: string);
    abstract plain(): Promise<any>;
    abstract restore(data: any): void;
    doSave(): Promise<{
        data: any;
        uid: string;
        name: string;
    }>;
}
export declare abstract class ShowfileSection {
    private _name;
    private _uid;
    private _records;
    constructor(name?: string);
    abstract restoreSection(data: any): ShowfileRecord[];
    addRecord(s: ShowfileRecord): void;
    showfileSectionName(): string;
    showfileSectionId(): string;
    showfileSectionData(): Promise<ShowfileSectionData>;
}
export declare class Showfile {
    _sections: ShowfileSectionData[];
    _created: string;
    constructor();
    init(): void;
    getSectionDataByName(name: string): ShowfileSectionData;
    getSectionById(id: string): ShowfileSectionData;
}
export declare class ShowfileManager {
    targets: ShowfileTarget[];
    dependencies: [string, string][];
    constructor();
    register(t: ShowfileTarget, dependencies?: string[]): void;
    createEmptyShow(name: string): void;
    storeShowfile(): Promise<void>;
    loadShowfile(): void;
    start(): void;
}
export {};
