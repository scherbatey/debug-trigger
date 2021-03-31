#include "../clients/debug-trigger.h"

int main()
{
    const int code = start_debug();
    printf("Code: %d\n", code);
    return code;
}
