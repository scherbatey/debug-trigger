import socket
from sys import stderr
import debugpy


def start_debug(id: str = "python", host="127.0.0.1", port=8989, debugpy_host="127.0.0.1", debugpy_port=4567):
    debugpy.listen(debugpy_port)
    try:
        sock = socket.create_connection((host, port))
        sock.send(bytes(f"{id}\r\n{debugpy_host}\r\n{debugpy_port}\r\n", "utf8"))
        # print("Request sent!\nWaiting for responce...")
        ret_code = sock.recv(1)[0]
        # print(f"Responce received! Code = {ret_code}")
        sock.close()
        # print("Waiting for debugger to connect!")
        debugpy.wait_for_client()
        return ret_code
    except:
        # print(f"Cannot connect to {host}:{port}", file=stderr)
        return -1 #response[0]
