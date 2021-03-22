import socket
import debugpy
import sys


_this_process_attached = False


def start_debug(id: str = "python", host="127.0.0.1", port=8989, debugpy_host="127.0.0.1", debugpy_port=4567, debugpy_port_autoincrement=True):
    global _this_process_attached
    if _this_process_attached:
        return 0

    while True:
        try:
            debugpy.listen(debugpy_port)
            break
        except RuntimeError:
            if debugpy_port_autoincrement:
                debugpy_port += 1
            else:
                raise
    try:
        sock = socket.create_connection((host, port))
        sock.send(bytes(f"{id}\r\n{debugpy_host}\r\n{debugpy_port}\r\n", "utf8"))
        ret_code = sock.recv(1)[0]
        sock.close()
        if ret_code == 0:
            _this_process_attached = True
            debugpy.wait_for_client()
        return ret_code
    except Exception:
        print(f"Cannot connect to {host}:{port}", file=sys.stderr)
        return -1
