import socket
import debugpy
import sys


_this_process_attached = False


def start_debug(
    id="python",
    host="127.0.0.1",
    port=8989,
    timeout=10,
    debugpy_host="127.0.0.1",
    debugpy_port=4567,
    debugpy_port_autoincrement=True,
):
    global _this_process_attached
    if _this_process_attached:
        return 0

    try:
        sock = socket.create_connection((host, port))
    except Exception:
        print(f"Cannot connect to {host}:{port}", file=sys.stderr)
        return -1

    try:
        while True:
            try:
                if 0 > debugpy_port or debugpy_port > 0xFFFF:
                    print("debugpy port number is out of range")
                    return -2
                debugpy.listen(debugpy_port)
                print(f"debugpy is listening port {debugpy_port}", file=sys.stderr)
                break
            except RuntimeError:
                if debugpy_port_autoincrement:
                    debugpy_port += 1
                else:
                    print(f"Cannot listen to port {debugpy_port}")
                    return -2

        sock.settimeout(timeout)
        sock.send(bytes(f"{id}\r\n{debugpy_host}\r\n{debugpy_port}\r\n", "utf8"))
        ret_code = sock.recv(1)[0]
    except Exception as e:
        print(f"Communication error {e}", file=sys.stderr)
        return -2
    finally:
        sock.close()

    if ret_code == 0:
        _this_process_attached = True
        debugpy.wait_for_client()
    return ret_code
