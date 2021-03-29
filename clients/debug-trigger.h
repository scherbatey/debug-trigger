#include <stdio.h>
#include <unistd.h>
#include <sys/socket.h> 
#include <arpa/inet.h> 

#ifdef __cplusplus
static int start_debug(
    char const * id = "cppdbg",
    char const * program_path = nullptr,
    char const * host = "127.0.0.1",
    int port = 8989,
    int timeout = 10000)
#else
static int start_debug(char const * id, char const * program_path, char const * host, int port, int timeout)
#endif
{
    int sock = 0, valread; 
    struct sockaddr_in serv_addr; 
    if ((sock = socket(AF_INET, SOCK_STREAM, 0)) < 0) 
    { 
        return -1; 
    } 
   
    serv_addr.sin_family = AF_INET; 
    serv_addr.sin_port = htons(port); 
       
    // Convert IPv4 and IPv6 addresses from text to binary form 
    if(inet_pton(AF_INET, host, &serv_addr.sin_addr)<=0)  
    { 
        printf("\nInvalid address/ Address not supported \n"); 
        return -1; 
    } 
   
    if (connect(sock, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0) 
    {            
        close(sock);
        return -1;
    }
    
    const int PATH_MAX = 2048;
    char path[PATH_MAX];
    
    if (!program_path) {
    #if __linux
        int path_len = readlink("/proc/self/exe", path, PATH_MAX);
        if (!path_len || path_len >= PATH_MAX) {
            close(sock);
            return -2;
        }
        path[path_len] = 0;
    #elif __APPLE__
        if(_NSGetExecutablePath(path, &PATH_MAX)) {
            return 1;
            close(sock);
        }
    #elif _WIN32
        //TODO: complete
        //GetModuleFileNameA
    #endif
        program_path = path;
    }
    
    dprintf(sock, "%s\r\n%s\r\n%d\r\n", id, program_path, getpid());
    
    char ret_code = 0;
    valread = read(sock, &ret_code, 1);

    close(sock);

    if (valread)
      return ret_code;
    
    return -1; 
}
