import {v4 as uniqueId} from 'uuid';

import {Channel} from './audio_devices';
import {
    ManagedNodeStateListRegister,
    ManagedNodeStateMapRegister,
    ManagedNodeStateObject,
    ManagedNodeStateObjectData,
    NodeModule,
    ServerModule
} from './data';
import * as DSP from './dsp'
import {SIDSPNode} from './instance';
import * as Logger from './log';
import {ShowfileManager, ShowfileRecord, ShowfileTarget} from './showfiles';
import WebInterface from './web_interface';
import { DSPNode } from './dsp_node';

const log = Logger.get('INP');

interface NodeAndInputs {
    max_id: 0;
    si: SIDSPNode;
    inputs: Input[];
}

export class Input extends ShowfileRecord {

    constructor(id: number, name: string, format: DSP.PortTypes)
    {
        super(name);

        this.id   = id;
        this.name = name, this.format = format;
    }

    async plain()
    {
        if (this.id == 3)
            throw 'I dont want to';

        return {
            id : this.id,
            name : this.format,
            format : this.format,
            channels : this.channels.map((ch) => {
                return {
                    i: ch.i, name: ch.name
                }
            })
        };
    }

    restore(data: any): void
    {
        this.build(data);
    }

    build(data: any): void
    {
        Object.assign(this, data);
    }

    id: number;
    name: string;
    format: DSP.PortTypes;
    channels: Channel[] = [];
}

export class InputManager extends ShowfileTarget {

    targetName(): string
    {
        return 'inputs';
    }
    onEmptyShowfileCreate(s: import('./showfiles').Showfile): void
    {
    }

    nodes: NodeAndInputs[];
    // devices: AudioDeviceManager;
    webif: WebInterface;

    constructor(webif: WebInterface, audioDevMan: any, sfm: ShowfileManager)
    {
        super();

        let self = this;

        // this.devices = audioDevMan;
        this.nodes = [];

        this.webif = webif;

        sfm.register(this);

        webif.io.on('connection', socket => {
            socket.on('inputs.update',
                      () => { self.updateInterface(socket).catch(err => {
                          console.log(err);
                      }) });

            socket.on('inputs.add', this.addInput.bind(self));
        });
    }

    async updateInterface(sock: SocketIO.Socket|SocketIO.Server)
    {
        /*let nodes = await this.devices.getAllChannelLists();

        sock.emit('inputs.update', {
            nodes : nodes,
            inputs : this.nodes.map(nd => {
                return {
                    id: nd.si.id, inputs: nd.inputs.map(i => i.plain())
                }
            })
        });*/
    }

    async addInput(input: any)
    {
        /* let ins = this.devices.instances.find(ins => ins.id == input.nodeid);

        let chlist = await ins.devices.getChannelList();

        let chs = chlist.inputs.slice(
            input.ch_start, input.ch_start + input.ch_count);

        let nodeAndInput = this.nodes.find(ni => ni.si.id == input.nodeid);

        if (nodeAndInput == undefined)
            this.nodes.push({ si : ins, inputs : [], max_id : 0 });

        nodeAndInput = this.nodes.find(ni => ni.si.id == input.nodeid);

        log.info(`Added new Input to node ${nodeAndInput.si.name} (chs: ${
            chs.length}, name: ${input.name})`);

        let i = new Input(0, '', 0);

        i.build({
            name : input.name,
            channels : chs,
            format : input.format,
            id : ++nodeAndInput.max_id
        });

        nodeAndInput.inputs.push(i);

        this.updateInterface(this.webif.io);*/
    }
}

export interface NodeAudioInputDescription {
    name: string;
    channel: number;
    type: DSP.PortTypes;
    id: string;
    default_roomencode: boolean;
    default_encodingorder: number;
    default_gain: number;
}

export function basicNodeAudioInputDescription(
    name: string, channel: number,
    type: DSP.PortTypes): NodeAudioInputDescription
{
    return {
        name,
        channel,
        type,
        id : uniqueId(),
        default_roomencode : false,
        default_encodingorder : 3,
        default_gain : 1.
    };
}

export class NodeAudioInput extends
    ManagedNodeStateObject<NodeAudioInputDescription> {

    _description: NodeAudioInputDescription;

    async set(val: NodeAudioInputDescription)
    {
        this._description.channel = val.channel;
        this._description.name    = val.name;
    }

    get()
    {
        return this._description;
    }

    constructor(desc: NodeAudioInputDescription)
    {
        super();
        this._description = desc;
    }
}

export class NodeAudioInputList extends ManagedNodeStateListRegister {

    async remove(obj: ManagedNodeStateObject<NodeAudioInputDescription>)
    {
    }

    async insert(data: NodeAudioInputDescription)
    {
        return new NodeAudioInput(data);
    }
}

export class NodeAudioInputManager extends NodeModule {

    async addInput(input: NodeAudioInputDescription)
    {
        this._input_list.add(new NodeAudioInput(input));
        return this.save();
    }

    async removeInput(id: string)
    {
        this._input_list.removeItem(this._input_list._objects.find(
            obj => (<NodeAudioInputDescription>obj.get()).id == id));

        return this._input_list.save();
    }

    getRawInputDescriptionList()
    {
        return this._input_list._objects.map(obj => <NodeAudioInputDescription> obj.get());
    }

    findInputForId(id: string)
    {
        return <NodeAudioInput> this._input_list._objects.find(obj => obj.get().id == id);
    }

    destroy()
    {
    }

    init(): void
    {
    }

    start(): void
    {
        this.save().catch(err => {
            log.error('Could write data to node ' + err);
        });
    }

    _input_list: NodeAudioInputList;

    constructor()
    {
        super('inputs');
        this._input_list = new NodeAudioInputList();
        this.add(this._input_list, 'input-list');
    }
}

export class AudioInputsManager extends ServerModule {

    init(): void 
    {
        this.handle('update', (socket, node: DSPNode, data) => {
            try {
                socket.emit('inputs.update', node.id(), node.inputs.getRawInputDescriptionList());
            } catch (err) {
                this.webif.error(err);
            }
        });

        this.handle('add', (socket, node: DSPNode, data: NodeAudioInputDescription) => {
            try {
                node.inputs.addInput(data);
            } catch (err) {
                this.webif.error(err);
            }
        });

        this.handle('remove', (socket, node: DSPNode, data: string) => {
            try {
                node.inputs.removeInput(data);
            } catch (err) {
                this.webif.error(err);
            }
        });

        this.handle('modify', (socket, node: DSPNode, data: NodeAudioInputDescription) => {
            try {
                let input = node.inputs.findInputForId(data.id);
                if(input) {
                    input.set(data).catch(err => {
                        this.webif.error(err);
                    });
                } else {
                    this.webif.error("Input " + data.name + " not found");
                }
            } catch (err) {
                this.webif.error(err);
            }
        });
    }
    
    constructor() {
        super('inputs');
    }
}