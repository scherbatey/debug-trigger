import socket
import os
import debugpy

def start_debug(id: str, program_path: str, host="127.0.0.1", port=8989, debugpy_port=5678):
    sock = socket.create_connection((host, port))
    if not sock:
        return
    debugpy.listen(debugpy_port)
    sock.send(bytes(f"{id}\r\n{program_path}\r\n{os.getpid()}\r\n", 'utf8'))
    ret_code = sock.recv(1)
    sock.close()
    debugpy.wait_for_client()
    return ret_code
