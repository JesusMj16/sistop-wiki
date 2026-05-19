import { P, H2, H3, Code, Callout, CodeExplain, DiskGeometryFlow } from '../../components/ui/Prose';

export default function IoctlYDisco() {
  return (
    <>
      <H2>7.4.1 La función ioctl</H2>

      <P>
        La función <em>ioctl</em>, abreviatura de input output control, permite trabajar con los
        dispositivos de carácter de forma flexible. Es la navaja suiza de los drivers. Cuando
        necesitas pedirle a un dispositivo algo que no encaja en read o write, casi siempre la
        respuesta es ioctl. Cambiar el bitrate de un puerto serie. Consultar el tamaño de la
        ventana de tu terminal. Obtener la dirección MAC de tu tarjeta de red. Todo eso ocurre vía
        ioctl.
      </P>

      <Code title="ioctl">{`#include <sys/ioctl.h>

int ioctl(int fd, unsigned long request, char *argp, ...);`}</Code>

      <P>
        El primer argumento <em>fd</em> es el descriptor del archivo de dispositivo ya abierto. El
        segundo argumento <em>request</em> es el código de la solicitud específica, un entero que
        identifica qué operación quieres realizar. Estos códigos están definidos como macros en los
        headers del kernel y dependen del dispositivo. El tercer argumento <em>argp</em> es un
        apuntador a los parámetros que la operación necesita o donde quieres que se deposite el
        resultado. Si la llamada tiene éxito retorna 0. Si falla retorna -1 y deja el motivo en
        <em> errno</em>.
      </P>

      <Callout tone="info" title="Analogía. El control remoto universal">
        Piensa en ioctl como un control remoto universal con botones programables. El número del
        botón es el código <em>request</em>. El dispositivo decide qué hace cada botón. Subir
        volumen, cambiar canal, encender luces. Mismo control, distintos comportamientos según con
        qué aparato lo estés usando. Por eso ioctl es tan poderosa pero también tan caótica. No
        hay catálogo único de códigos. Cada driver define los suyos.
      </Callout>

      <H3>Ejemplo 1. Tamaño actual de la terminal con TIOCGWINSZ</H3>

      <P>
        Este programa usa ioctl para consultar cuántas filas y columnas tiene la terminal actual.
        Es exactamente lo que hace el shell internamente cada vez que abres una ventana y el
        prompt necesita acomodarse al ancho.
      </P>

      <CodeExplain
        title="winsize.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <unistd.h>' },
          { code: '#include <sys/ioctl.h>' },
          { code: '#include <fcntl.h>' },
          { code: 'int main() {' },
          { code: '    struct winsize w;', note: 'Estructura predefinida con campos ws_row, ws_col, ws_xpixel, ws_ypixel.' },
          { code: '    if (ioctl(STDOUT_FILENO, TIOCGWINSZ, &w) == -1) {', note: 'STDOUT_FILENO es el descriptor de la salida estándar. TIOCGWINSZ pide el tamaño de la ventana.' },
          { code: '        perror("ioctl");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    printf("Filas: %d\\n", w.ws_row);' },
          { code: '    printf("Columnas: %d\\n", w.ws_col);' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <H3>Ejemplo 2. IP y MAC de una interfaz de red</H3>

      <P>
        Este segundo ejemplo abre un socket, configura una estructura <em>ifreq</em> con el nombre
        de la interfaz y llama a ioctl con dos comandos distintos. <em>SIOCGIFADDR</em> para
        obtener la dirección IP. <em>SIOCGIFHWADDR</em> para obtener la dirección MAC del
        hardware. Mismo socket, dos consultas diferentes según el request.
      </P>

      <CodeExplain
        title="net_info.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <string.h>' },
          { code: '#include <sys/ioctl.h>' },
          { code: '#include <net/if.h>' },
          { code: '#include <unistd.h>' },
          { code: '#include <netinet/in.h>' },
          { code: '#include <arpa/inet.h>' },
          { code: 'int main() {' },
          { code: '    int sock;' },
          { code: '    struct ifreq ifr;' },
          { code: '    unsigned char *mac;' },
          { code: '    char *interface = "wlp8s0";', note: 'Cambia por tu interfaz activa. Lista las tuyas con: ip -br a' },
          { code: '    struct sockaddr_in *ipaddr;' },
          { code: '    sock = socket(AF_INET, SOCK_DGRAM, 0);', note: 'Necesitamos un socket UDP solo como handle, no transmite nada. Es el canal a través del cual ioctl habla con la pila de red.' },
          { code: '    if (sock == -1) {' },
          { code: '        perror("Error creando socket");' },
          { code: '        return EXIT_FAILURE;' },
          { code: '    }' },
          { code: '    strncpy(ifr.ifr_name, interface, IFNAMSIZ - 1);', note: 'Copia el nombre de la interfaz dentro de la estructura ifreq que viaja como argp.' },
          { code: '    if (ioctl(sock, SIOCGIFADDR, &ifr) == -1) {', note: 'SIOCGIFADDR = Get InterFace ADDRess. El kernel rellena ifr.ifr_addr con la IP.' },
          { code: '        perror("ioctl SIOCGIFADDR (¿Está activa la interfaz?)");' },
          { code: '    } else {' },
          { code: '        ipaddr = (struct sockaddr_in *)&ifr.ifr_addr;' },
          { code: '        printf("IP de %s: %s\\n", interface, inet_ntoa(ipaddr->sin_addr));' },
          { code: '    }' },
          { code: '    if (ioctl(sock, SIOCGIFHWADDR, &ifr) == -1) {', note: 'SIOCGIFHWADDR = Get InterFace HardWare ADDRess. Trae la MAC.' },
          { code: '        perror("ioctl SIOCGIFHWADDR");' },
          { code: '    } else {' },
          { code: '        mac = (unsigned char *)ifr.ifr_hwaddr.sa_data;' },
          { code: '        printf("MAC de %s: %02x:%02x:%02x:%02x:%02x:%02x\\n",' },
          { code: '               interface, mac[0], mac[1], mac[2],' },
          { code: '               mac[3], mac[4], mac[5]);' },
          { code: '    }' },
          { code: '    close(sock);' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      {/* ============================================================ */}

      <H2>7.4.2 Unidad de disco. Geometría y tiempos</H2>

      <P>
        La unidad de disco mecánico es un medio magnético donde se almacenan los datos. Para leer
        o escribir, sus cabezales deben posicionarse en un conjunto de círculos concéntricos
        llamados <strong>pistas</strong>. Cada pista se divide en bloques curvos llamados
        <strong> sectores</strong>. Los sectores suelen tener un tamaño de 512 bytes, o algún
        múltiplo de ellos, y son la unidad mínima de lectura o escritura. No puedes leer 100
        bytes sueltos. Lees el sector completo y descartas lo que no necesitas.
      </P>

      <H3>Los dos tiempos que cuestan</H3>

      <P>
        En un hardware con cabezales mecánicos, el tiempo total para acceder a un byte concreto
        se descompone en dos partes muy reales. El <strong>tiempo de búsqueda</strong>, en inglés
        seek time, es lo que tarda el brazo mecánico en mover el cabezal hasta la pista correcta.
        El brazo es una pieza física. Tiene masa. Acelerar y frenar lleva milisegundos. Discos
        típicos están entre 3 y 15 milisegundos para esta operación.
      </P>

      <P>
        Una vez que el cabezal está sobre la pista correcta, el controlador del disco espera hasta
        que el sector deseado se alinee con la cabeza por el giro del plato. A ese tiempo se le
        llama <strong>retardo de giro</strong> o latencia rotacional. Para un disco a 7200
        revoluciones por minuto el promedio es 4.16 milisegundos. Para uno a 15000 RPM es 2
        milisegundos. La suma del tiempo de búsqueda más el retardo de giro es el
        <strong> tiempo de acceso</strong>. Esa es la cifra honesta del rendimiento mecánico de
        un disco.
      </P>

      <H3>Mira la geometría en acción</H3>

      <P>
        Para entender bien dónde se va cada milisegundo, conviene ver el disco moviéndose. La
        animación recorre el ciclo completo de acceso. Punto inicial. El cabezal está en una
        pista cualquiera. El proceso pide un sector en otra pista. El brazo se mueve, tiempo de
        búsqueda. Después la pista es la correcta pero hay que esperar a que el sector deseado
        gire hasta el cabezal, retardo de giro. Por fin alineación. Lectura.
      </P>

      <DiskGeometryFlow />

      <H3>Particiones. Cada una es un dispositivo separado</H3>

      <P>
        Cada división lógica del disco se llama <strong>partición</strong>. Cada partición es
        tratada por el kernel como un dispositivo separado, ubicado generalmente en una entrada de
        <em> /dev</em>. Por ejemplo <em>/dev/sda1</em>, <em>/dev/sda2</em>, <em>/dev/sda3</em>.
        Cada partición tiene normalmente dos zonas funcionales. Un sistema de archivos que
        administra un área de datos, y opcionalmente una zona de swap o área de intercambio que
        usa el kernel cuando se queda corto de RAM física.
      </P>

      <H3>Inspeccionar el swap desde shell</H3>

      <P>
        En el archivo <em>/proc/swaps</em> puedes observar información del área de swap del
        sistema. También puedes usar los comandos <em>swapon</em> y <em>free</em>. La primera
        muestra qué dispositivos están actuando como swap. La segunda muestra cuánta RAM y swap
        están en uso ahora.
      </P>

      <Code title="swapon">{`gcgero@linux:~$ swapon
NAME       TYPE       SIZE   USED   PRIO
/dev/dm-1  partition  976M   13.4M  -2`}</Code>

      <Code title="free">{`gcgero@linux:~$ free
              total     usado     libre  compartido  búfer/caché  disponible
Memoria:    8015136   3434912    428528      576720      4151696     3695780
Swap:        999420     13692     98572`}</Code>

      <P>
        La salida de <em>free</em> es densa. La fila Memoria muestra RAM física en kilobytes. La
        columna disponible es la cifra que importa para saber cuánto realmente puedes usar sin
        forzar swap. La fila Swap muestra el espacio de intercambio configurado. Si el valor de
        usado crece sostenidamente, tu sistema está corto de RAM y conviene cerrar procesos o
        ampliar memoria física.
      </P>

      <Callout tone="success" title="Qué entendimos en esta página">
        ioctl es la syscall comodín para hablar con dispositivos de carácter cuando read y write
        no alcanzan. Recibe fd, un código request específico del driver, y un puntero a datos. Con
        TIOCGWINSZ obtienes el tamaño de la terminal. Con SIOCGIFADDR y SIOCGIFHWADDR obtienes IP
        y MAC de una interfaz de red abriendo un socket auxiliar. La unidad de disco organiza sus
        datos en pistas concéntricas divididas en sectores de 512 bytes. El acceso a un byte
        cuesta tiempo de búsqueda más retardo de giro, lo que llamamos tiempo de acceso total.
        Cada partición es un dispositivo independiente en /dev, con su filesystem y opcionalmente
        un swap. El swap del sistema se inspecciona con swapon, free o leyendo /proc/swaps. Los
        SSD eliminan tanto seek time como rotational latency, por eso son órdenes de magnitud más
        rápidos que los discos mecánicos.
      </Callout>
    </>
  );
}
