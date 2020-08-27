"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestService = void 0;
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