"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
const express_1 = require("express");
const Logger = __importStar(require("./log"));
const communication_1 = require("./communication");
const log = Logger.get('RESTSV');
class RestService extends core_1.ServerModule {
    constructor() {
        super('rest');
    }
    registerRoutes(app) {
        let nodeRouter = express_1.Router();
        nodeRouter.get('/:id/name', (req, res) => {
            let node = this.getNode(req.params.id);
            if (node) {
                res.send(node.name());
            }
            else {
                res.status(400);
                res.send("Node not found");
                return;
            }
        });
        nodeRouter.get('/:id/graph', (req, res) => {
            let node = this.getNode(req.params.id);
            if (node) {
                res.send(node.dsp_process._graph.visualize());
            }
            else {
                res.status(400);
                res.send("Node not found");
                return;
            }
        });
        app.get('/nodes', (req, res) => {
            res.send(this.server.nodes(communication_1.NODE_TYPE.DSP_NODE).map(node => { return { id: node.id(), name: node.name() }; }));
        });
        app.use('/node', nodeRouter);
    }
    init() {
    }
    joined(socket) {
    }
    left(socket) {
    }
}
exports.RestService = RestService;
//# sourceMappingURL=rest.js.map