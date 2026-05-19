import { P, H2, H3, Code, Callout, CodeExplain, IoDeviceFlow } from '../../components/ui/Prose';

export default function DispositivosIO() {
  return (
    <>
      <H2>7.4 Dispositivos de entrada y salida</H2>

      <P>
        El sistema operativo administra los accesos de entrada y salida a los dispositivos
        conectados. Tiempos de búsqueda. Tiempos de acceso. Tiempos de transferencia. Como ya
        vimos en la página anterior, en UNIX y Linux hay dos clases de dispositivos según su modelo
        de transferencia. Los <strong>de bloques</strong> y los <strong>de carácter</strong>.
        Puedes verificar la clasificación de tus propios dispositivos con el comando <em>ls -l
        /dev</em> y mirar el primer carácter de cada línea. Una <em>c</em> indica modo carácter.
        Una <em>b</em> indica modo bloque.
      </P>

      <H3>Mira los dos caminos en acción</H3>

      <P>
        Antes de entrar al detalle de cada modo, conviene ver visualmente cómo viajan los datos
        por ambos. La animación recorre el camino que toma una lectura en modo bloque, donde el
        kernel intermedia con un buffer caché, y el camino más directo del modo carácter, donde
        cada byte va y viene sin almacenamiento intermedio.
      </P>

      <IoDeviceFlow />

      <H2>Dispositivos de bloque</H2>

      <P>
        Los dispositivos de bloque trabajan con paquetes de 512 bytes como mínimo. La transferencia
        de información se realiza en uno o más de estos bloques. Dentro de esta clasificación entran
        los discos rígidos y las memorias tipo USB. La gracia es que el kernel mantiene un buffer
        caché en RAM que recuerda los bloques recientemente leídos. Si vuelves a pedir uno que ya
        está en caché, no hace falta tocar el hardware. Lectura instantánea.
      </P>

      <H3>Inspeccionar la velocidad del disco con hdparm</H3>

      <P>
        En Linux, si necesitas conocer la velocidad de transferencia de un disco rígido, puedes
        usar el comando <em>hdparm</em>. Es una interfaz de línea de comandos que obtiene y modifica
        parámetros de los dispositivos de bloque. Con la opción <em>-t</em> mide la velocidad
        sostenida de lectura.
      </P>

      <Code title="hdparm -t medir velocidad">{`$ sudo hdparm -t /dev/sda

/dev/sda:
 Timing buffered disk reads: 186 MB in 3.01 seconds = 61.83 MB/sec`}</Code>

      <P>
        La salida indica que el disco logra 61.83 MB por segundo en lectura sostenida. Es un dato
        muy útil para comparar generaciones de discos o para detectar degradación. Si quieres
        información detallada del dispositivo, usa la opción <em>-I</em>.
      </P>

      <Code title="hdparm -I detalles del dispositivo">{`$ sudo hdparm -I /dev/sda

/dev/sda:

ATA device, with non-removable media
        Model Number:       ST500LT012-9WS142
        Serial Number:      W0V0ZHEX
        Firmware Revision:  0001SDM1
        Transport:          Serial, ATA8-AST, SATA 1.0a, SATA II
                            Extensions, SATA Rev 2.5, SATA Rev 2.6
Standards:
        Used: unknown (minor revision code 0x0029)
        Supported: 8 7 6 5
        Likely used: 8
Configuration:
        Logical         max     current
        cylinders       16383   16383
        heads           16      16
        sectors/track   63      63
        ...`}</Code>

      <P>
        Los detalles reales de las operaciones de entrada y salida de los discos dependen del
        hardware y del sistema operativo trabajando juntos. El kernel envía comandos al
        controlador. El controlador mueve el cabezal, espera la rotación del plato y devuelve los
        bytes. Eso lo veremos a fondo en la siguiente página cuando hablemos de geometría del
        disco.
      </P>

      <H2>Dispositivos de carácter</H2>

      <P>
        Los dispositivos de carácter trabajan con cierta cantidad de caracteres pero no
        necesariamente en bloques constantes. Ejemplos típicos son las terminales, los teclados,
        las impresoras y las interfaces de red. La información se ve como una secuencia lineal de
        bytes. La velocidad de transferencia es baja porque no hay buffer caché involucrado, pero
        la latencia también es baja porque no hay intermediario. A continuación exploramos en
        profundidad el caso de las terminales en Linux porque ilustran muy bien todo el modelo.
      </P>

      <H2>Las terminales como dispositivo de carácter</H2>

      <P>
        Las terminales son dispositivos especiales que trabajan en modo carácter y son tratadas en
        el sistema como un archivo. El archivo de dispositivo que permite a un proceso acceder a
        su propia terminal es <em>/dev/tty</em>. Cada usuario que inicia sesión en el sistema lo
        hace a través de una terminal. Para conocer en cuál te encuentras puedes usar el comando
        <em> who</em> o el comando <em>w</em>. En su segunda columna de salida ambos indican la
        terminal donde está conectado el usuario en la forma <em>/dev/tty##</em>, donde <em>##</em>
        es el número de la terminal.
      </P>

      <H3>El archivo /etc/utmp. Quién está conectado y dónde</H3>

      <P>
        Si en algún momento necesitas comunicarte con un usuario conectado a través de su terminal,
        necesitas usar el archivo <em>/etc/utmp</em>. Este archivo es creado por el sistema y
        contiene información administrativa de los usuarios conectados. Está organizado como una
        secuencia de registros cuyos campos están en la estructura <em>utmp</em> declarada en
        <em> sys/utmp.h</em>. Para leer estos registros desde C se invoca <em>getutent</em>.
      </P>

      <Code title="getutent">{`#include <sys/utmp.h>

struct utmp *getutent(void);`}</Code>

      <P>
        Cada llamada a <em>getutent</em> lee un registro del archivo utmp. El archivo
        <em> /var/run/utmp</em> contiene los usuarios actualmente conectados. Después de leer un
        registro, la función devuelve un apuntador a una estructura utmp o NULL si llegó al final
        o hubo error.
      </P>

      <Code title="struct utmp">{`struct utmp {
    short ut_type;                    /* tipo de registro */
    pid_t ut_pid;                     /* PID del proceso conectado */
    char  ut_line[UT_LINESIZE];       /* nombre del tty sin /dev/ */
    char  ut_id[4];                   /* sufijo de la terminal */
    char  ut_user[UT_NAMESIZE];       /* nombre del usuario */
    char  ut_host[UT_HOSTSIZE];       /* host remoto si aplica */
    struct exit_status ut_exit;       /* estado de fin del proceso */
    long  ut_session;                 /* ID de sesión */
    struct timeval ut_tv;             /* tiempo de entrada */
    int32_t ut_addr_v6[4];            /* dirección IP remota */
    char __unused[20];                /* reservada */
};`}</Code>

      <P>
        Para saber si un usuario específico está conectado, basta con recorrer todas las entradas
        del archivo y comparar el campo <em>ut_user</em> con el nombre buscado. Para saber cuál
        archivo de dispositivo tiene asociado su terminal, usas el campo <em>ut_line</em> y le
        antepones <em>/dev/</em>.
      </P>

      <H3>Ejemplo. Mandar mensajes a un usuario por su tty y cerrarle la sesión</H3>

      <P>
        El siguiente programa es semejante a usar el comando <em>write</em> del sistema. Toma un
        nombre de usuario por argumento, lo busca en utmp, abre su tty para escritura y le manda
        mensajes interactivos. Cuando recibe la palabra adios, cierra el mensaje y mata el proceso
        del usuario. Para correrlo necesitas privilegios de root porque escribe en una tty ajena y
        elimina un proceso que no es tuyo.
      </P>

      <CodeExplain
        title="write_user.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <fcntl.h>' },
          { code: '#include <utmp.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <string.h>' },
          { code: '#include <unistd.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <signal.h>' },
          { code: 'int main(int argc, char *argv[]) {' },
          { code: '    int tty, salir = 0;' },
          { code: '    char terminal[40], mensaje[256], *logname;' },
          { code: '    struct utmp *utmp;' },
          { code: '    if (argc != 2) {' },
          { code: '        fprintf(stderr, "Forma de uso: %s usuario\\n", argv[0]);' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    while ((utmp = getutent()) != NULL', note: 'Recorre utmp registro por registro hasta encontrar al usuario.' },
          { code: '           && strncmp(utmp->ut_user, argv[1], 8) != 0);' },
          { code: '    if (utmp == NULL) {' },
          { code: '        printf("EL USUARIO %s NO ESTÁ EN SESIÓN.\\n", argv[1]);' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    sprintf(terminal, "/dev/%s", utmp->ut_line);', note: 'Construye la ruta completa al tty del usuario destino.' },
          { code: '    if ((tty = open(terminal, O_WRONLY)) == -1) {', note: 'Abre la tty del otro usuario en modo escritura. Requiere root.' },
          { code: '        perror(terminal);' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    logname = getenv("LOGNAME");' },
          { code: '    sprintf(mensaje,' },
          { code: '            "\\n\\t\\tMENSAJE PROCEDENTE DEL USUARIO %s\\t\\t\\n",' },
          { code: '            logname);' },
          { code: '    write(tty, mensaje, strlen(mensaje));' },
          { code: '    do {' },
          { code: '        fgets(mensaje, 256, stdin);' },
          { code: '        write(tty, mensaje, strlen(mensaje));', note: 'Escribir en la tty hace aparecer el texto en la pantalla del usuario destino.' },
          { code: '        if (strcmp(mensaje, "adios\\n") == 0) {' },
          { code: '            sprintf(mensaje, "\\n<FIN DEL MENSAJE>\\n");' },
          { code: '            write(tty, mensaje, strlen(mensaje));' },
          { code: '            close(tty);' },
          { code: '            kill(utmp->ut_pid, 9);', note: 'SIGKILL al PID del usuario destino. Cierra su sesión bruscamente.' },
          { code: '            salir = 1;' },
          { code: '        }' },
          { code: '    } while (salir != 1);' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <Callout tone="warn" title="Usa esto con cuidado">
        El programa anterior demuestra cómo el modelo unificado de archivos hace que mandar texto
        a la pantalla de otro usuario sea conceptualmente igual que escribir en cualquier archivo.
        Pero requiere privilegios de root y mata el proceso del destinatario. En producción nunca
        querrías esto sin autorización explícita. El ejemplo es didáctico para mostrar que las
        terminales son archivos especiales accesibles vía syscalls comunes.
      </Callout>

      <Callout tone="success" title="Qué entendimos en esta página">
        Los dispositivos en UNIX se dividen en modo bloque y modo carácter según su modelo de
        transferencia. Bloque usa paquetes fijos mínimo 512 bytes con buffer caché del kernel.
        Carácter pasa byte por byte sin caché. Los discos y memorias USB son bloque. Las
        terminales, teclados, impresoras y tarjetas de red son carácter. La velocidad del disco se
        mide con hdparm -t. Los detalles del modelo del disco salen con hdparm -I. Las terminales
        se tratan como archivos en /dev/ttyN. El archivo /etc/utmp lista los usuarios conectados
        con su tty asociada. Desde C se lee con getutent una entrada por llamada hasta NULL. La
        estructura utmp guarda tipo, PID, tty, usuario, host, sesión y timestamps. Escribir en la
        tty de un usuario es exactamente igual que escribir en cualquier archivo, requiriendo
        privilegios de root para tty ajenas.
      </Callout>
    </>
  );
}
