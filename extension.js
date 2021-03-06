const vscode = require("vscode");
const net = require("net");

let disposables = [];

const RESP_OK = new Uint8Array([0]);
const RESP_INVALID_REQUEST = new Uint8Array([1]);
const RESP_INCOMPLETE_REQUEST = new Uint8Array([2]);
const RESP_ATTACH_FAILURE = new Uint8Array([3]);

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log("debug-trigger is now active!");

    let armCommand = vscode.commands.registerCommand("debug-trigger.arm", arm);
    context.subscriptions.push(armCommand);
    let disarmCommand = vscode.commands.registerCommand("debug-trigger.disarm", disarm);
    context.subscriptions.push(disarmCommand);

    vscode.debug.onDidStartDebugSession(session => {
        console.log(session)
    }, this, disposables);
    
    vscode.debug.onDidTerminateDebugSession(session => {
        var id = [session.configuration.type];
        if (id[0] == "cppdbg")
            id = id.append(Number(session.configuration.processId));
        else if (id[0] == "python")
            id = id.concat([session.configuration.connect.host, session.configuration.connect.port]);
        else
            return;
        debug_sessions.delete(id);
    }, this, disposables);
}

function deactivate() {
    disposables.forEach(d => {
        d.dispose();
    });
}

module.exports = {
	activate,
	deactivate
}

let server = null;
let debug_sessions = new Set;

function arm() {
    if (!server) {
        const listento = vscode.workspace.getConfiguration("debug-trigger").listento;

        server = net.createServer(
            {"allowHalfOpen": true},
            (c) => {
                // "connection" listener.
                console.log("client connected");
                c.setEncoding("utf8");
                
                c.on("data", 
                    (data) => {
                        c.input_buffer = (c.input_buffer || "") + data;
                        let [conf_name, param_str, param_num, r] = c.input_buffer.split("\r\n")
                        if (r != null) {
                            if (!isFinite(param_num)) {
                                vscode.window.showErrorMessage(`Invalid request: ${c.input_buffer}`);
                                c.write(RESP_INVALID_REQUEST, () => { c.end(); });
                                c.input_buffer = null;
                            } else {
                                console.log(`Request:${c.input_buffer}`);
                                c.input_buffer = null;
                                handleRequest(c, conf_name, param_str, Number(param_num));
                            }
                        }
                    }
                );
                
                c.on("end", () => {
                    if (c.input_buffer) {
                        vscode.window.showErrorMessage(`Incomplete request: ${c.input_buffer}`);
                        c.write(RESP_INCOMPLETE_REQUEST, () => { c.end(); });
                        c.input_buffer = null;
                    }
                });
            }
        );

        server.on('error', e => {
            vscode.window.showErrorMessage(`Error running server! Error: ${e}`);
            server.close();
            server = null;
        });
        
        let [host, port] = listento.split(" ");
        try {
            if (port)
                server.listen(Number(port), host, () => {
                    vscode.window.showInformationMessage(`Debug Trigger armed! Server started on ${host}:${port}`);
                });
            else
                server.listen(listento, () => {
                    vscode.window.showInformationMessage(`Debug Trigger armed! Server started on ${listento}`);
                });
        }
        catch(e){
            vscode.window.showErrorMessage(`Cannot start server due to invalid configuration! ${e}`);
            server = null;
        } 
    }
    else {
        vscode.window.showInformationMessage(`Already armed!`);
    }
}

function disarm() {
    if (server) {
        server.close();
        server = null;
        vscode.window.showInformationMessage(`Disarmed!`);
    }
    else {
        vscode.window.showInformationMessage(`Already disarmed!`);
    }
}

function handleRequest(c, conf_name, param1, param2) {
    const configurations = vscode.workspace.getConfiguration("debug-trigger").configurations;
    
    var config = configurations[conf_name];
    if (typeof(config) != "object")
    {
        vscode.window.showWarningMessage(`Debug configuration with name "${conf_name}" not found!`);
        return;
    }
    
    var id;
    
    config = {...config};
    if (config.type == "cppdbg") {
        if (param1)
            config.program = param1;
        config.processId = param2;
        id = [config.type, param2];
    }
    else if (config.type == "python") {
        config.connect = {...config.connect};
        config.connect.host = param1;
        config.connect.port = param2;
        id = [config.type, param1, param2];
    } else {
        vscode.window.showWarningMessage(`Unsupported configuration type "${conf_name}"!`);
        return;
    }

    if (debug_sessions.has(id)) {
        c.write(new Uint8Array([0]), () => { c.end(); });
        return;
    }

    vscode.window.showInformationMessage(`Attaching ${id}...`);    

    vscode.debug.startDebugging(undefined, config).then(ok => {   
        if (ok) {
            vscode.window.showInformationMessage(`Debugging of ${id} started!`);
            debug_sessions.add(id);
            c.write(RESP_OK, () => { c.end(); }); // Success!
        } else {
            vscode.window.showWarningMessage(`Failed to attach ${id}!`);
            c.write(RESP_ATTACH_FAILURE, () => { c.end(); });
        }
    });
}
