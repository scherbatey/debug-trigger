#include <stdio.h>
#include <unistd.h>
#include <sys/socket.h> 
#include <arpa/inet.h> 
#include <assert.h>


int main(int argc, char **argv)
{
    int sock = 0, valread; 
    struct sockaddr_in serv_addr; 
    char *hello = "Hello from client"; 
    char buffer[1024] = {0}; 
    if ((sock = socket(AF_INET, SOCK_STREAM, 0)) < 0) 
    { 
        printf("\n Socket creation error \n"); 
        return -1; 
    } 
   
    serv_addr.sin_family = AF_INET; 
    serv_addr.sin_port = htons(8989); 
       
    // Convert IPv4 and IPv6 addresses from text to binary form 
    if(inet_pton(AF_INET, "127.0.0.1", &serv_addr.sin_addr)<=0)  
    { 
        printf("\nInvalid address/ Address not supported \n"); 
        return -1; 
    } 
   
    if (connect(sock, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0) 
    { 
        printf("\nConnection Failed \n"); 
        return -1; 
    } 

    const int PATH_MAX = 2048;
    char path [PATH_MAX];

#if __linux
    int path_len = readlink("/proc/self/exe", path, PATH_MAX);
    if (!path_len || path_len >= PATH_MAX)
      return 1;
    path[path_len] = 0;
#elif __macos
    if(_NSGetExecutablePath(path, &bufsize))
      return 1;
#endif  
    assert(dprintf(sock, "test_c\r\n%s\r\n%d\r\n", path, getpid())); 
    valread = read( sock , buffer, 1024);
    if (valread)
    {      
      printf("Result code: %d\n", (int)buffer[0]);
      return buffer[0];
    }
    return -1; 
}
