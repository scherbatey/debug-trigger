#include "../clients/debug-trigger.h"

int main()
{
    const int code = start_debug("cppdbg", 0, "127.0.0.1", 8989, 10000);
    printf("Code: %d\n", code);
    return code;
}
