import { PortTypes } from './dsp_defs';
export interface NodeAudioInputDescription {
    name: string;
    channel: number;
    type: PortTypes;
    id: string;
    default_roomencode: boolean;
    default_encodingorder: number;
    default_gain: number;
}
export declare function basicNodeAudioInputDescription(name: string, channel: number, type: PortTypes): NodeAudioInputDescription;
