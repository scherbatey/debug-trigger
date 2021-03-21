#include "../clients/debug-trigger.h"

int main()
{
    const int code = start_debug("test_c", 0, "127.0.0.1", 8989);
    printf("Code: %d\n", code);
    return code;
}
