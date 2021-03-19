const vscode = require("vscode");
const net = require("net");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log("debug-trigger is now active!");

    let armCommand = vscode.commands.registerCommand("debug-trigger.arm", arm);
    context.subscriptions.push(armCommand);
    let disarmCommand = vscode.commands.registerCommand("debug-trigger.disarm", disarm);
    context.subscriptions.push(disarmCommand);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}

let server = null;

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
                        [_, _, _, r] = c.input_buffer.split("\r\n")
                        if (r != null)
                            handleRequest(c);
                    }
                );
                c.on("end", () => {
                    handleRequest(c);
                });
                
                const timeout = vscode.workspace.getConfiguration("debug-trigger").timeout;
                c.setTimeout(timeout);
                c.on('timeout', () => {
                    vscode.window.showWarningMessage(`Request timeout!`);
                    c.write("\x02");
                    c.end();
                });
            }
        );

        server.on('error', (e) => {
            vscode.window.showErrorMessage(`Error running server! Error: ${e}`);
            server.close();
            server = null;
        });
        
        [host, port] = listento.split(" ");
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

function handleRequest(c) {
    console.log(`Request:${c.input_buffer}`);

    [name, path, pid] = c.input_buffer.split("\r\n");
    if (!isFinite(pid))
    {
        vscode.window.showWarningMessage(`Invalid request: ${c.input_buffer}!`);
        c.write("\x00");
        c.end();
        return;
    }

    vscode.window.showInformationMessage(`Attaching process ${pid}...`);
    
    const configurations = vscode.workspace.getConfiguration("debug-trigger").configurations;
    
    var config = configurations[name] || name;
    if (typeof(config) == "object") {
        config = {...config};
        if (path)
            config.program = path;
        config.processId = pid;
    }

    vscode.debug.startDebugging(undefined, config).then(ok => {   
        if (ok)
            vscode.window.showInformationMessage(`Debugging process ${pid} started!`);
        else {
            vscode.window.showWarningMessage(`Failed to attach process ${pid}!`);
            c.write("\x01");
        }
        c.end();
    }).catch(e => vscode.window.showWarningMessage(e));
}
