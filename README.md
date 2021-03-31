# Debug Trigger

Debug Trigger is a Visual Studio Code extension that starts debug session in responce to request from user code.
## Features

Currently Debug Trigger supports the following types of debug sessions:
* cppdbg
* python

However, it can be extended to support any other types of debug configurations.

## Usage
Client libraries can be found in `clents` folder. 
* Set breakpoints in VS Code
* In your code add the call to `start_debug` function from client libary (can be found in `clents` folder) 
### Python
    from debug_trigger import start_debug
    start_debug()

## Extension Settings

This extension contributes the following settings:

* `debug-trigger.configurations`: dictionary of debug configurations mapping `id` -> `configuration`. The `id` is passed in request by `start_debug` function and can be customized.
* `debug-trigger.listento`: set TCP socket ("\<host\> \<port\>") / Unix socket / Windows pipe name to listen

## Release Notes

Users appreciate release notes as you update your extension.

### 0.0.1

Initial release of debug-trigger
