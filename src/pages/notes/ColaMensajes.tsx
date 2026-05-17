import { P, H2, H3, List, Code, Callout, CodeExplain, Table, MessageQueueFlow } from '../../components/ui/Prose';

export default function ColaMensajes() {
  return (
    <>
      <H2>Repaso rápido. Cierre de memoria compartida</H2>

      <P>
        Antes de saltar al nuevo mecanismo, conviene cerrar la idea anterior con dos líneas. La memoria
        compartida usa <em>shmat</em> para acoplar el segmento al espacio de direcciones del proceso y
        <em> shmdt</em> para desacoplarlo. La llamada a <em>shmat</em> devuelve la dirección virtual de
        inicio. Si pasas <em>NULL</em> en el argumento <em>shmaddr</em>, el sistema escoge la dirección
        libre adecuada. Si pasas una dirección concreta, el comportamiento depende de si añadiste la
        bandera <em>SHM_RND</em>. Sin esa bandera, el kernel usa exactamente la dirección que pediste y
        falla si está mal alineada. Con esa bandera, redondea la dirección hacia abajo al múltiplo más
        cercano de la constante <em>SHMLBA</em>, llamada Lower Boundary Address.
      </P>

      <Code title="redondeo SHM_RND visualizado">{`Pides:           0x7f3a 1234 5678
SHMLBA:                       0x1000  (4096 bytes en Linux típico)
Redondeo abajo:  0x7f3a 1234 5000   <- aquí mapea realmente

Regla. La dirección final es el primer múltiplo
de SHMLBA menor o igual a la que pediste.`}</Code>

      <P>
        Con esto cerramos la sección anterior. <em>shmdt</em> solo desacopla el segmento de tu proceso.
        Para destruir de verdad la región del kernel hay que llamar <em>shmctl</em> con
        <em> IPC_RMID</em>. El segmento se borra cuando el último proceso atado se desacopla.
      </P>

      <H2>Qué son las colas de mensajes y por qué existen</H2>

      <P>
        Imagina una oficina de correos altamente eficiente dentro del kernel. Cualquier proceso con
        permisos puede llegar a la ventanilla y depositar un paquete. Ese paquete tiene una etiqueta de
        tipo numérico pegada en el frente. El kernel lo guarda en orden de llegada dentro de un casillero
        gigante. Cualquier otro proceso con permisos puede ir a la ventanilla y pedir un paquete, ya sea
        el primero que esté ahí sin importar su etiqueta, o el primero de una etiqueta específica, o el
        primero de cualquier etiqueta menor o igual a cierto número. Esa oficina de correos es
        exactamente una cola de mensajes de System V.
      </P>

      <P>
        Si la memoria compartida era la mesa común del taller donde todos dejan piezas a discreción y la
        coordinación queda en sus manos, la cola de mensajes es una banda transportadora industrial con
        un kernel que vigila el orden. Los emisores colocan paquetes en un extremo. Los receptores los
        retiran del otro. El kernel se encarga de copiar los bytes, de bloquear al receptor si la cinta
        está vacía, y de bloquear al emisor si la cinta está llena. No hay riesgo de pisar bytes ajenos
        porque cada mensaje es una unidad cerrada. Es el mecanismo IPC que más se acerca al modelo
        productor consumidor que después popularizarían los sistemas pub sub modernos.
      </P>

      <Callout tone="info" title="Diferencias clave con memoria compartida">
        La memoria compartida da velocidad cruda y deja la sincronización al programador. La cola de
        mensajes da estructura, conserva los límites entre mensajes, sincroniza implícitamente, y permite
        filtrar por etiqueta de tipo. A cambio, paga un costo. Cada mensaje se copia dos veces. Una vez
        del emisor al buffer del kernel. Otra vez del buffer del kernel al receptor. Para mensajes
        pequeños y poco frecuentes, ese costo es invisible. Para volúmenes masivos, la memoria compartida
        más semáforos vuelve a ganar.
      </Callout>

      <H2>Arquitectura. Crear la cola con msgget</H2>

      <Code title="msgget">{`#include <sys/types.h>
#include <sys/ipc.h>
#include <sys/msg.h>

int msgget(key_t key, int msgflg);`}</Code>

      <P>
        La llamada a <em>msgget</em> retorna un identificador entero asociado a la cola, llamado
        <em> msqid</em>. Recibe dos parámetros. El primero es <em>key</em>, la llave que identifica la
        cola. La llave puede venir de <em>ftok</em> si quieres que procesos sin parentesco lleguen a la
        misma cola, o puede ser la constante <em>IPC_PRIVATE</em> si solo el proceso creador y sus hijos
        por <em>fork</em> van a usarla. El segundo parámetro es <em>msgflg</em>, una máscara de bits que
        combina permisos y banderas de control.
      </P>

      <P>
        Si pasas <em>IPC_PRIVATE</em> en <em>key</em>, se crea una cola nueva siempre. Si pasas una llave
        calculada con <em>ftok</em>, debes incluir la bandera <em>IPC_CREAT</em> junto con el modo de
        acceso. Por ejemplo <em>IPC_CREAT | 0666</em>. Sin <em>IPC_CREAT</em>, <em>msgget</em> falla si
        la cola no existe todavía. Esta función devuelve un entero positivo si todo salió bien o
        <em> -1</em> si falló, dejando la razón en <em>errno</em>.
      </P>

      <H2>Control y permisos con msgctl</H2>

      <Code title="msgctl">{`#include <sys/types.h>
#include <sys/ipc.h>
#include <sys/msg.h>

int msgctl(int msqid, int cmd, struct msqid_ds *buf);`}</Code>

      <P>
        Esta función administra la cola identificada por <em>msqid</em>. El parámetro <em>cmd</em> indica
        qué quieres hacer. El parámetro <em>buf</em> apunta a una estructura <em>msqid_ds</em> que sirve
        de fuente o destino de datos según el comando. Los datos administrativos de cada cola viven en
        esa estructura. Antes de mirar el código completo, hay que conocerla.
      </P>

      <H3>La estructura msqid_ds. Ficha de control de la cola</H3>

      <P>
        Cada cola que existe en el sistema tiene una <em>msqid_ds</em> asociada dentro del kernel. Es la
        ficha de identidad. Guarda quién es el dueño, cuántos bytes hay en la cola en este instante,
        cuántos mensajes en total, cuál es el máximo permitido, y marcas de tiempo automáticas.
      </P>

      <Code title="struct msqid_ds">{`struct msqid_ds {
    struct ipc_perm msg_perm;       /* propietario y permisos */
    time_t          msg_stime;      /* fecha del ultimo mensaje escrito */
    time_t          msg_rtime;      /* fecha del ultimo mensaje leido */
    time_t          msg_ctime;      /* fecha del ultimo cambio */
    unsigned long   __msg_cbytes;   /* bytes actualmente en la cola */
    msgqnum_t       msg_qnum;       /* numero actual de mensajes */
    msglen_t        msg_qbytes;     /* numero maximo de bytes permitidos */
    pid_t           msg_lspid;      /* PID del ultimo proceso que envio */
    pid_t           msg_lrpid;      /* PID del ultimo proceso que leyo */
};`}</Code>

      <P>
        Léelo con calma. El primer campo es la sub estructura de permisos que vemos a continuación. Las
        tres marcas de tiempo se actualizan solas cuando alguien escribe, alguien lee o alguien cambia
        algún atributo. El campo <em>__msg_cbytes</em> es el tamaño total en bytes de todos los mensajes
        que la cola está sosteniendo en este momento. El campo <em>msg_qnum</em> es cuántos mensajes
        hay. El campo <em>msg_qbytes</em> es el techo. El kernel rechaza nuevos mensajes si superas ese
        techo, salvo que pidas explícitamente más vía <em>IPC_SET</em>. Los dos últimos campos te dicen
        quién fue el último que escribió y el último que leyó.
      </P>

      <H3>La estructura ipc_perm. Ficha de permisos</H3>

      <P>
        Dentro de <em>msqid_ds</em> hay un campo <em>msg_perm</em> de tipo <em>ipc_perm</em> que guarda
        toda la información de control de acceso. Es la misma estructura que aparece en semáforos y
        memoria compartida, idéntica en forma porque el modelo de permisos es común a los tres recursos
        de System V.
      </P>

      <Code title="struct ipc_perm">{`struct ipc_perm {
    key_t          __key;  /* llave suministrada en msgget */
    uid_t          uid;    /* UID del propietario actual */
    gid_t          gid;    /* GID del propietario actual */
    uid_t          cuid;   /* UID del creador */
    gid_t          cgid;   /* GID del creador */
    unsigned short mode;   /* permisos en formato octal estilo chmod */
    unsigned short __seq;  /* numero de secuencia interno */
};`}</Code>

      <H3>Comandos de msgctl. Qué puedes hacer con la cola</H3>

      <Table
        headers={['Comando', 'Qué hace']}
        rows={[
          ['IPC_STAT', 'Copia la información completa del kernel sobre esta cola dentro del buf que tú pasas. Necesitas permiso de lectura.'],
          ['IPC_SET', 'Modifica algunos campos de la estructura. Actualiza msg_qbytes, msg_perm.uid, msg_perm.gid y los 9 bits bajos de msg_perm.mode. Tu UID efectivo debe coincidir con el dueño o el creador.'],
          ['IPC_RMID', 'Elimina inmediatamente la cola. Cualquier proceso bloqueado dentro de msgsnd o msgrcv se despierta con error -1 y errno EIDRM. El tercer argumento se ignora. Ejemplo: msgctl(msgid, IPC_RMID, NULL)'],
        ]}
      />

      <H2>Envío y recepción. La mecánica de msgsnd y msgrcv</H2>

      <Code title="msgsnd">{`#include <sys/msg.h>

int msgsnd(int msqid, const void *msgp, size_t msgsz, int msgflg);`}</Code>

      <Code title="msgrcv">{`#include <sys/msg.h>

ssize_t msgrcv(int msqid, void *msgp, size_t msgsz,
               long msgtyp, int msgflg);`}</Code>

      <P>
        El proceso que invoca debe tener permisos de escritura sobre la cola si envía, y permisos de
        lectura si recibe. El parámetro <em>msgp</em> es un apuntador a una estructura que tú defines.
        Su forma canónica es la siguiente.
      </P>

      <Code title="struct msgbuf canónico">{`struct msgbuf {
    long mtype;       /* tipo de mensaje, debe ser estrictamente > 0 */
    char mtext[i];    /* datos del mensaje, longitud i */
};`}</Code>

      <P>
        El campo <em>mtext</em> es un arreglo cuyo tamaño está especificado por <em>msgsz</em>, un entero
        no negativo. El campo <em>mtype</em> debe ser estrictamente un valor entero positivo. Ese valor
        es el que los procesos receptores van a usar para seleccionar cuál mensaje quieren leer. Tú
        eliges el formato del payload. El kernel solo exige que el primer campo sea <em>long mtype</em>.
        Después puedes poner cadenas, enteros, estructuras anidadas, lo que necesites.
      </P>

      <P>
        La llamada a <em>msgsnd</em> añade una copia del mensaje apuntado por <em>msgp</em> a la cola. Si
        hay suficiente espacio, la operación tiene éxito. Si no hay suficiente espacio, la llamada
        bloquea hasta que se libere capacidad, salvo que hayas pedido <em>IPC_NOWAIT</em>. La llamada a
        <em> msgrcv</em> remueve un mensaje de la cola y lo coloca en el buffer apuntado por
        <em> msgp</em>. El argumento <em>msgsz</em> especifica el tamaño máximo en bytes del campo
        <em> mtext</em>. Si el mensaje es más grande que ese tamaño, el comportamiento depende de las
        banderas que veremos abajo.
      </P>

      <H2>La magia del parámetro msgtyp</H2>

      <P>
        Aquí está la pieza que hace especiales a las colas de mensajes. El parámetro <em>msgtyp</em> de
        <em> msgrcv</em> decide cuál paquete extraer. Tiene tres comportamientos según su signo.
      </P>

      <Code title="reglas de msgtyp visualizadas">{`cola actual (orden de llegada):
  [mtype=1 "datos A"] [mtype=5 "prio"] [mtype=2 "datos B"] [mtype=1 "datos C"]

msgrcv(..., msgtyp = 0, ...)
  trae el PRIMERO sin importar tipo  -> [mtype=1 "datos A"]

msgrcv(..., msgtyp = 2, ...)
  trae el primero con mtype EXACTO 2 -> [mtype=2 "datos B"]

msgrcv(..., msgtyp = -3, ...)
  trae el primero con mtype <= |3|   -> [mtype=1 "datos A"]   (el más antiguo que cumple)
  si no estuviera el A, trae         -> [mtype=2 "datos B"]
  el [mtype=5 "prio"] nunca calificaria porque 5 > 3.`}</Code>

      <P>
        En resumen. <em>msgtyp = 0</em> trae el primer mensaje de la cola sin importar su tipo.
        <em> msgtyp &gt; 0</em> trae el primer mensaje cuyo tipo coincida exactamente. <em>msgtyp &lt; 0</em>
        trae el primer mensaje cuyo tipo sea menor o igual al valor absoluto del número. Esta tercera
        forma sirve para implementar prioridades. Si reservas los tipos más bajos para los mensajes más
        urgentes, un consumidor que llame <em>msgrcv</em> con un msgtyp negativo grande recoge primero
        los urgentes.
      </P>

      <H2>Las banderas msgflg que cambian todo</H2>

      <P>
        El último parámetro tanto de <em>msgsnd</em> como de <em>msgrcv</em> es <em>msgflg</em>, una
        máscara de bits. Combinas las siguientes constantes con el operador OR según necesites.
      </P>

      <H3>IPC_NOWAIT</H3>

      <P>
        Hace que la llamada regrese de forma inmediata si no puede completarse. En <em>msgsnd</em>, si
        no hay espacio en la cola, en lugar de bloquear retorna <em>-1</em> con <em>errno</em> en
        <em> EAGAIN</em>. En <em>msgrcv</em>, si no hay mensaje del tipo solicitado, retorna <em>-1</em>
        con <em>errno</em> en <em>ENOMSG</em>. Útil cuando tu proceso no puede darse el lujo de dormirse
        esperando, por ejemplo dentro del bucle de una interfaz gráfica.
      </P>

      <H3>MSG_NOERROR</H3>

      <P>
        Modifica el comportamiento de <em>msgrcv</em> cuando el mensaje en la cola es más grande que el
        buffer que pasaste. Sin esta bandera, <em>msgrcv</em> falla con <em>-1</em> y <em>errno</em> en
        <em> E2BIG</em>. Con esta bandera, el kernel trunca silenciosamente el mensaje a los primeros
        <em> msgsz</em> bytes y descarta el resto. Útil cuando solo te interesan los primeros bytes y
        prefieres pérdida silenciosa a tener que manejar el error.
      </P>

      <H3>MSG_EXCEPT</H3>

      <P>
        Se usa junto con un <em>msgtyp</em> mayor que cero. Invierte el sentido de la búsqueda. En vez
        de leer el primer mensaje cuyo tipo sea igual al <em>msgtyp</em>, lee el primer mensaje cuyo
        tipo sea distinto del <em>msgtyp</em>. Sirve para procesar todo lo que llegue excepto cierta
        categoría.
      </P>

      <H3>MSG_COPY</H3>

      <P>
        Disponible a partir de Linux 3.8. Obtiene una copia no destructiva del mensaje en la posición
        ordinal de la cola especificada por <em>msgtyp</em>. Es decir, no extrae, solo mira. Los
        mensajes se consideran numerados desde cero. Esta bandera debe ir siempre acompañada de
        <em> IPC_NOWAIT</em>. Si no hay mensaje en esa posición, la llamada falla inmediatamente con
        <em> ENOMSG</em>.
      </P>

      <H3>Los errores que más vas a ver</H3>

      <Table
        headers={['errno', 'Significado típico']}
        rows={[
          ['ENOMSG', 'msgrcv con IPC_NOWAIT y no había mensaje del tipo pedido.'],
          ['EAGAIN', 'msgsnd con IPC_NOWAIT y la cola estaba llena.'],
          ['E2BIG', 'msgrcv recibió un mensaje más grande que msgsz y no usaste MSG_NOERROR.'],
          ['EIDRM', 'La cola fue eliminada con IPC_RMID mientras tu llamada estaba pendiente.'],
          ['EACCES', 'No tenías permisos suficientes para la operación.'],
          ['EINVAL', 'msqid inválido, msgtyp inválido o msgsz negativo.'],
        ]}
      />

      <H2>Mira la cola en acción paso a paso</H2>

      <P>
        Antes del código completo, conviene ver cómo se comporta visualmente la cola con distintos
        valores de <em>msgtyp</em> y banderas. La animación recorre ocho pasos. Cola vacía, varios
        <em> msgsnd</em>, luego cada variante de <em>msgrcv</em> incluyendo la del IPC_NOWAIT con
        resultado <em>ENOMSG</em>. Pon atención a tres elementos visuales. Los bloques laterales son el
        productor y el consumidor. El bloque central es la cola con sus mensajes apilados en orden de
        llegada, cada uno con su etiqueta de tipo de color distinto. Cuando un mensaje vuela hacia la
        cola es un <em>msgsnd</em>. Cuando vuela hacia el consumidor es un <em>msgrcv</em> exitoso.
        Cuando aparece un bloque rojo en el consumidor con <em>ENOMSG</em>, es la respuesta inmediata
        del <em>IPC_NOWAIT</em> sin mensaje disponible.
      </P>

      <MessageQueueFlow />

      <H2>Laboratorio en C. El programa mcola</H2>

      <P>
        El siguiente programa envía o recibe un mensaje con el tiempo del sistema según el argumento que
        le pasas en la línea de comandos. Si lo invocas con <em>s</em>, escribe un mensaje en la cola. Si
        lo invocas con <em>r</em>, lo lee. La llave se calcula con <em>ftok</em> sobre el propio binario,
        así que el envío y la recepción comparten la misma cola aunque vivan en terminales distintas.
        Esta es la forma idiomática de hacer un par productor consumidor entre procesos sin parentesco.
      </P>

      <CodeExplain
        title="mcola.c"
        lines={[
          { code: '/* compilar: gcc -Wall mcola.c -o mcola' },
          { code: ' * enviar:   ./mcola s' },
          { code: ' * recibir:  ./mcola r */' },
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <string.h>' },
          { code: '#include <time.h>' },
          { code: '#include <unistd.h>' },
          { code: '#include <errno.h>' },
          { code: '#include <sys/msg.h>' },
          { code: 'void send_msg(int, int);' },
          { code: 'void get_msg(int, int);' },
          { code: 'struct msgbuf {' },
          { code: '    long mtype;', note: 'Obligatorio. El primer campo siempre es long mtype.' },
          { code: '    char mtext[80];', note: 'Payload libre. Aquí 80 bytes para guardar la cadena con el tiempo.' },
          { code: '};' },
          { code: 'int main(int argc, char *argv[]) {' },
          { code: '    int qid;' },
          { code: '    int modo;             /* 1 = enviar, 2 = recibir */' },
          { code: '    int msgtype = 1;', note: 'Tipo fijo. Tanto el sender como el receiver usan mtype = 1 para que se vean.' },
          { code: '    int llave;' },
          { code: '    llave = ftok(argv[0], \'a\');', note: 'Llave derivada del propio binario y del caracter a. Determinista entre corridas.' },
          { code: '    if (argc > 1) {' },
          { code: '        if      (strcmp(argv[1], "s") == 0) modo = 1;' },
          { code: '        else if (strcmp(argv[1], "r") == 0) modo = 2;' },
          { code: '        else { printf("Use: ./mcola s|r\\n"); exit(EXIT_FAILURE); }' },
          { code: '    } else { printf("Use: ./mcola s|r\\n"); exit(EXIT_FAILURE); }' },
          { code: '    if ((qid = msgget(llave, IPC_CREAT | 0666)) == -1) {', note: 'Crea o abre la cola. IPC_CREAT con 0666 da permisos amplios al dueño y al resto.' },
          { code: '        perror("msgget"); exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    if (modo == 2) get_msg(qid, msgtype);' },
          { code: '    else           send_msg(qid, msgtype);' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
          { code: 'void send_msg(int qid, int msgtype) {' },
          { code: '    struct msgbuf msg;' },
          { code: '    time_t t;' },
          { code: '    msg.mtype = msgtype;', note: 'Etiqueta el paquete con mtype = 1.' },
          { code: '    time(&t);' },
          { code: '    snprintf(msg.mtext, sizeof(msg.mtext),' },
          { code: '             "El mensaje salio el: %s", ctime(&t));', note: 'Llena el payload con la fecha y hora actuales en formato legible.' },
          { code: '    if (msgsnd(qid, (void *)&msg, sizeof(msg.mtext), IPC_NOWAIT) == -1) {', note: 'Envía sin bloquear. Si la cola está llena, falla en el instante con EAGAIN.' },
          { code: '        perror("ERROR en msgsnd"); exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    printf("Mensaje enviado: %s\\n", msg.mtext);' },
          { code: '}' },
          { code: 'void get_msg(int qid, int msgtype) {' },
          { code: '    struct msgbuf msg;' },
          { code: '    if (msgrcv(qid, (void *)&msg, sizeof(msg.mtext), msgtype,', note: 'Pide un mensaje de tipo exacto msgtype.' },
          { code: '               MSG_NOERROR | IPC_NOWAIT) == -1) {', note: 'MSG_NOERROR trunca si el payload es muy grande. IPC_NOWAIT evita bloquear.' },
          { code: '        if (errno != ENOMSG) {' },
          { code: '            perror("ERROR en msgrcv"); exit(EXIT_FAILURE);' },
          { code: '        }' },
          { code: '        printf("No hay mensajes disponibles para leer/recibir con msgrcv()\\n");', note: 'Caso esperado. Distingue ENOMSG de cualquier otro fallo y solo en ese caso imprime el aviso amable.' },
          { code: '    } else printf("Mensaje recibido: %s\\n", msg.mtext);' },
          { code: '}' },
        ]}
      />

      <H3>Flujo mental de ejecución</H3>

      <P>
        Para depurar este programa mentalmente, imagina dos terminales abiertas. En la primera ejecutas
        <em> ./mcola s</em>. El programa calcula la llave con <em>ftok</em>, abre la cola con
        <em> msgget</em>, prepara un <em>struct msgbuf</em> con mtype 1 y el texto del tiempo actual, y
        llama <em>msgsnd</em>. Como pidió <em>IPC_NOWAIT</em>, si la cola estuviera llena la llamada
        fallaría al instante. En el caso normal, retorna éxito y el programa imprime <em>Mensaje
        enviado</em> y termina. La cola sigue ahí con un mensaje dentro.
      </P>

      <P>
        En la segunda terminal ejecutas <em>./mcola r</em>. Calcula la misma llave porque
        <em> argv[0]</em> es el mismo binario en el mismo path. Abre la misma cola. Llama <em>msgrcv</em>
        pidiendo mtype 1 con <em>MSG_NOERROR | IPC_NOWAIT</em>. Como hay un mensaje del tipo correcto,
        el kernel lo entrega. Imprime <em>Mensaje recibido</em> con el texto del tiempo. Si en lugar de
        eso la cola estaba vacía, <em>msgrcv</em> retorna <em>-1</em>, <em>errno</em> queda en
        <em> ENOMSG</em>, y el programa imprime el aviso amable sin abortar.
      </P>

      <Callout tone="warn" title="Detalle importante. Este programa no destruye la cola">
        El código de ejemplo nunca llama <em>msgctl(qid, IPC_RMID, NULL)</em>. Cada corrida deja la cola
        viva en el kernel. Esto es deliberado para que sender y receiver puedan ejecutarse en momentos
        distintos sin perder mensajes. Pero significa que tienes que limpiar a mano cuando termines de
        experimentar. Lista las colas vivas con <em>ipcs -q</em>. Borra la que ya no necesites con
        <em> ipcrm -Q msqid</em> donde msqid es el identificador.
      </Callout>

      <H2>Inspeccionar IPC desde el shell</H2>

      <P>
        En GNU/Linux puedes obtener información de los objetos IPC mediante el comando <em>ipcs</em>.
        Por defecto muestra los tres tipos juntos. Segmentos de memoria compartida, colas de mensajes y
        arreglos de semáforos. Un ejemplo de salida.
      </P>

      <Code title="salida típica de ipcs">{`gcgero@linux:~$ ipcs

------ Colas de mensajes -----
key        msqid  propietario perms  bytes  utilizados  mensajes

---- Segmentos memoria compartida ----
key        shmid  propietario perms  bytes      nattch  estado
0x00000000 884743 gcgero      600    1048576    2       dest
0x00000000 819208 gcgero      600    524288     2       dest

------ Matrices semáforo -------
key        semid  propietario perms  nsems
0x6100050e 1      gcgero      600    2
0x61000c49 2      gcgero      600    2`}</Code>

      <P>
        La misma información está expuesta en el sistema de archivos virtual. El directorio
        <em> /proc/sysvipc</em> contiene tres archivos legibles llamados <em>msg</em>, <em>sem</em> y
        <em> shm</em>. Cada uno lista en formato tabular los objetos IPC activos del tipo
        correspondiente. Es útil cuando quieres scriptear o monitorear sin parsear la salida de
        <em> ipcs</em>.
      </P>

      <Code title="contenido de /proc/sysvipc">{`gcgero@linux:/proc/sysvipc$ ls -la
total 0
dr-xr-xr-x   5 root root 0 mar  4 10:10 .
dr-xr-xr-x 364 root root 0 mar  2 07:38 ..
-r--r--r--   1 root root 0 mar  4 10:10 msg
-r--r--r--   1 root root 0 mar  4 10:10 sem
-r--r--r--   1 root root 0 mar  4 10:10 shm

gcgero@linux:/proc/sysvipc$ cat sem
key        semid perms nsems uid  gid  cuid cgid otime       ctime
1627391246 1     600   2     1000 1000 1000 1000 1772583562  1772583561
1627393097 2     600   2     1000 1000 1000 1000 1772585631  1772585624`}</Code>

      <H3>Límites configurables del kernel</H3>

      <P>
        El sistema impone límites a cada mecanismo IPC para prevenir que un proceso descontrolado cree
        miles de recursos y agote la memoria del kernel. Estos límites son visibles y modificables en
        <em> /proc/sys/kernel</em>. Tres archivos relevantes son <em>shmmax</em> que controla el tamaño
        máximo de un segmento de memoria compartida, <em>sem</em> que controla varios límites de
        semáforos, y <em>msgmax</em> que controla el tamaño máximo de un mensaje individual.
      </P>

      <H2>Comparativa rápida con pipes, FIFOs y memoria compartida</H2>

      <Table
        headers={['Aspecto', 'Pipe / FIFO', 'Cola de mensajes', 'Memoria compartida']}
        rows={[
          ['Modelo', 'Flujo de bytes anónimo', 'Mensajes discretos con tipo numérico', 'Bloque de RAM mapeado'],
          ['Sincronización', 'Implícita por bloqueo en read', 'Implícita más filtrado por mtype', 'NINGUNA. Programador la añade'],
          ['Procesos sin parentesco', 'Solo FIFO con nombre en el FS', 'Sí, vía ftok', 'Sí, vía ftok'],
          ['Persistencia', 'Hasta cerrar todos los fds', 'Hasta IPC_RMID o reinicio', 'Hasta IPC_RMID o reinicio'],
          ['Costo por operación', 'Bajo. Una copia kernel intermedia', 'Medio. Dos copias por mensaje', 'Mínimo. Sin copias intermedias'],
          ['Múltiples canales lógicos', 'Una por pipe', 'Una cola con varios mtype', 'Una región partida por el programador'],
          ['Caso ideal', 'Stream continuo de bytes', 'Mensajes discretos con prioridad', 'Datos grandes y compartidos en alta frecuencia'],
        ]}
      />

      <Callout tone="success" title="Cuándo elegir una cola de mensajes">
        Cuando el flujo natural de la comunicación es de mensajes y no de bytes, y especialmente cuando
        varios productores publican distintos tipos y varios consumidores leen filtrando por categoría.
        Las colas son el ancestro conceptual de los topics en sistemas pub sub modernos. Una cola
        compartida con etiquetas que decide quién lee qué. Si solo necesitas pasar un stream de bytes
        sin estructura, una pipe es más simple. Si necesitas transferir volúmenes masivos a alta
        velocidad, la memoria compartida más semáforos es mejor.
      </Callout>

      <H2>Qué entendimos</H2>

      <P>
        Si tuvieras que explicarle colas de mensajes a alguien en treinta segundos, este sería el mapa
        mental completo que deberías poder recitar de memoria. Léelo lento. Cada punto resume una hora
        de confusión bien empleada.
      </P>

      <List>
        <li>Una <strong>cola de mensajes</strong> es un buffer ordenado dentro del kernel donde los procesos depositan paquetes etiquetados con un mtype numérico y otros procesos los retiran filtrando por ese tipo.</li>
        <li>El API tiene cuatro funciones. <em>msgget</em> consigue el msqid a partir de una llave. <em>msgsnd</em> añade un mensaje al final. <em>msgrcv</em> retira un mensaje según msgtyp. <em>msgctl</em> administra y borra con <em>IPC_RMID</em>.</li>
        <li>Cada mensaje es una estructura cuyo primer campo es obligatoriamente <em>long mtype</em>. Lo demás lo defines tú según necesites. mtype debe ser estrictamente positivo.</li>
        <li>El parámetro <em>msgtyp</em> de <em>msgrcv</em> tiene tres comportamientos según signo. <strong>cero</strong> trae el más antiguo sin importar tipo. <strong>positivo</strong> trae el más antiguo con tipo exacto. <strong>negativo</strong> trae el más antiguo con tipo menor o igual al valor absoluto, lo que permite implementar prioridades.</li>
        <li>Las banderas <em>msgflg</em> más útiles son <em>IPC_NOWAIT</em> para no bloquear, <em>MSG_NOERROR</em> para truncar mensajes grandes, <em>MSG_EXCEPT</em> para leer todo menos cierto tipo, y <em>MSG_COPY</em> para mirar sin extraer.</li>
        <li>Los errores típicos a conocer son <em>ENOMSG</em> cuando IPC_NOWAIT no encontró mensaje, <em>EAGAIN</em> cuando la cola está llena, <em>E2BIG</em> cuando el mensaje no cupo en el buffer sin MSG_NOERROR, y <em>EIDRM</em> cuando borraron la cola mientras esperabas.</li>
        <li>La estructura <em>msqid_ds</em> guarda toda la información administrativa de la cola. Contiene una sub estructura <em>ipc_perm</em> con los permisos y los IDs de dueño y creador. La copias con <em>IPC_STAT</em> y la modificas con <em>IPC_SET</em>.</li>
        <li>El comando <em>ipcs</em> lista los recursos IPC vivos del sistema. El comando <em>ipcrm</em> los borra. El directorio <em>/proc/sysvipc</em> expone la misma información en formato de archivo legible.</li>
        <li>Compara contra pipes y memoria compartida. Pipes son flujo de bytes sin estructura. Memoria compartida es máxima velocidad sin sincronización automática. Colas son el punto medio. Estructura, sincronización implícita y filtrado por categoría a costa de dos copias por mensaje.</li>
        <li>Patrón de uso siempre igual. Llave con <em>ftok</em>, abrir con <em>msgget</em> e <em>IPC_CREAT</em>, enviar con <em>msgsnd</em>, recibir con <em>msgrcv</em>, y al final destruir con <em>msgctl IPC_RMID</em>. Si no destruyes, la cola queda residente hasta el reinicio.</li>
      </List>
    </>
  );
}
