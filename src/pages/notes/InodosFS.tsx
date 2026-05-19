import { P, H2, H3, Code, Callout, CodeExplain, InodeAnatomyFlow } from '../../components/ui/Prose';

export default function InodosFS() {
  return (
    <>
      <H2>7.2.2 Nodos índice. Los inodos a fondo</H2>

      <P>
        Si el superbloque es el plano maestro del almacén, el inodo es la <strong>etiqueta de
        registro</strong> pegada a cada caja individual. Cada archivo en UNIX o Linux tiene
        asociado exactamente un inodo. Esa etiqueta contiene toda la información administrativa
        que un proceso necesita para acceder al archivo. Propietario. Derechos de acceso. Tamaño.
        Localización física. Fechas. Tipo. Pero hay un detalle crítico que conviene grabar a
        fuego desde el inicio. <strong>El nombre del archivo no vive en el inodo</strong>. Vive
        en los directorios. El inodo solo conoce el contenido y los permisos del archivo, no su
        nombre.
      </P>

      <H3>La tabla de inodos en memoria</H3>

      <P>
        Durante el proceso de arranque del sistema, el kernel lee la lista de inodos del disco y
        carga una copia completa en memoria justo después del superbloque. Esa copia se llama
        <strong> tabla de inodos</strong>. A partir de ese momento, todas las manipulaciones que
        haga el subsistema de archivos sobre los archivos van a involucrar a la tabla de inodos en
        memoria, no a la lista de inodos en disco. La razón es la misma que con el superbloque.
        Velocidad. Operar en RAM es órdenes de magnitud más rápido que operar en disco.
      </P>

      <P>
        La actualización periódica de la lista de inodos en disco la realiza el kernel a través de
        los hilos de writeback del sistema de archivos. Exactamente el mismo mecanismo que vimos
        para el superbloque. La tabla en memoria es el caché. La lista en disco es la verdad
        persistente. Los hilos writeback son los encargados de mantener la verdad razonablemente
        actualizada.
      </P>

      <H3>Los campos que componen un inodo</H3>

      <P>
        Cada inodo es una estructura de tamaño fijo con los siguientes campos. Léelos uno por uno
        porque cada uno justifica su existencia con un caso de uso concreto.
      </P>

      <P>
        <strong>Identificador del propietario del archivo.</strong> La posesión se divide entre un
        propietario individual y un grupo de propietarios. Estos dos identificadores definen el
        conjunto de usuarios que tienen derecho de acceso al archivo. Hay que tener en cuenta que
        el superusuario, llamado root con UID cero, posee derecho de acceso a todos los archivos
        del sistema sin importar quién sea el dueño nominal.
      </P>

      <P>
        <strong>Tipo de archivo.</strong> Los archivos en UNIX pueden ser de varias clases. Los
        ordinarios o regulares contienen datos del usuario. Los directorios son tablas de mapeo
        nombre a inodo. Los archivos de dispositivo, también llamados especiales, representan
        hardware. Los archivos de comunicación incluyen pipes con nombre y sockets. Cada tipo se
        comporta distinto ante read y write.
      </P>

      <P>
        <strong>Tipo de acceso al archivo.</strong> Más conocido como permisos. Lectura, escritura
        y ejecución, replicados tres veces. Una para el dueño. Otra para el grupo. Otra para el
        resto del mundo. También guarda información sobre la fecha de la última modificación del
        archivo, su último acceso y la última vez que se modificaron los datos.
      </P>

      <P>
        <strong>Número de enlaces del archivo.</strong> Representa el total de los nombres que el
        archivo tiene en la jerarquía de directorios. Un archivo puede aparecer con distintos
        nombres en distintos directorios. A cada nombre adicional se le llama enlace duro. El
        contador se incrementa cuando se crea un enlace nuevo y se decrementa cuando se borra uno.
        Cuando llega a cero y nadie tiene el archivo abierto, el inodo y sus bloques se liberan.
      </P>

      <P>
        <strong>Entradas para los bloques de dirección de los datos.</strong> Si bien los usuarios
        tratan los datos de un archivo como una secuencia de bytes contiguos, el kernel puede
        almacenarlos en bloques que no están físicamente contiguos en el disco. Los bloques de
        dirección dentro del inodo son la lista de direcciones de los bloques de disco que contienen
        los datos del archivo. En archivos pequeños son apuntadores directos. En archivos grandes
        aparecen apuntadores indirectos a bloques de índice que a su vez apuntan a más bloques.
      </P>

      <P>
        <strong>Tamaño del archivo.</strong> En bytes. Los bytes de un archivo se pueden direccionar
        indicando un offset a partir de la dirección de inicio. El offset 0 es el primer byte.
      </P>

      <Callout tone="warn" title="Dos detalles cruciales para no confundirse">
        Primero. El nombre del archivo NO queda especificado en su inodo. Los nombres viven en los
        directorios. Por eso renombrar un archivo es instantáneo y por eso pueden existir varios
        nombres apuntando al mismo inodo. Segundo. Existe una diferencia entre escribir el
        contenido de un inodo en disco y escribir el contenido del archivo. El contenido del
        archivo cambia solo cuando se escribe en él vía write. El contenido del inodo cambia
        cuando se modifican los datos del archivo o cuando cambia su situación administrativa,
        permisos, dueño, enlaces, fechas. Son escrituras independientes.
      </Callout>

      <H3>La tabla de inodos en memoria guarda metadatos extra</H3>

      <P>
        La tabla de inodos en RAM contiene exactamente la misma información que la lista de inodos
        en disco, más una serie de campos adicionales que no tienen sentido en disco pero sí en
        memoria mientras el archivo está en uso. Estos campos extra son los siguientes.
      </P>

      <P>
        <strong>Estado del inodo.</strong> Indica varias cosas. Si el inodo está bloqueado por
        alguna operación en curso. Si hay algún proceso esperando a que el inodo quede
        desbloqueado. Si la copia en memoria difiere de la que hay en disco, es decir, si está
        dirty. Si la copia de los datos del archivo en memoria difiere de los datos en disco,
        situación típica cuando se escribe en el archivo a través del buffer caché.
      </P>

      <P>
        <strong>Número de dispositivo lógico</strong> del sistema de archivos que contiene al
        archivo. Permite saber a qué FS pertenece este inodo cuando hay varios montados.
      </P>

      <P>
        <strong>Número de inodo.</strong> El identificador único dentro del FS. La llave primaria.
      </P>

      <P>
        <strong>Apuntadores a otros inodos cargados en memoria.</strong> El kernel enlaza los
        inodos sobre una cola hash para búsqueda rápida y sobre una lista libre para reciclaje
        eficiente. Estos punteros son parte de la estructura interna del kernel y no se ven desde
        usuario.
      </P>

      <P>
        <strong>Contador de copias activas.</strong> Cuenta cuántos procesos tienen el archivo
        abierto en este momento. Cuando llega a cero y nadie escribió cambios, el inodo puede
        salir de la caché para liberar espacio.
      </P>

      <H3>Mira la anatomía del inodo paso a paso</H3>

      <P>
        Antes de las funciones C que permiten leer estos campos, ve la mecánica completa. La
        animación recorre ocho pasos. Empieza con un open que recorre directorios y aterriza en
        un número de inodo. Después disecciona el inodo campo por campo, agrupando permisos,
        propietario, enlaces, tamaño, marcas de tiempo y punteros a bloques. Termina con la
        llamada stat que copia toda esa información a la estructura del usuario.
      </P>

      <InodeAnatomyFlow />

      <H3>Inspeccionar inodos desde el shell</H3>

      <P>
        En Linux puedes consultar la información del inodo de cualquier archivo con el comando
        <em> stat</em>. También puedes obtener solo el número de inodo con <em>ls -i nombre</em> o
        <em> df -i nombre</em>. Tres comandos, tres niveles de detalle. Útiles para inspeccionar
        sin escribir código.
      </P>

      <H3>Las funciones C para leer el inodo. stat, fstat, lstat</H3>

      <P>
        De forma similar a los comandos, en lenguaje C puedes recuperar la información
        administrativa de un archivo usando las funciones <em>stat</em>, <em>fstat</em> o
        <em> lstat</em>. Las tres llenan la misma estructura. Cambia cómo identificas el archivo.
      </P>

      <Code title="stat / fstat / lstat">{`#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

int stat(const char *pathname,  struct stat *statbuf);
int fstat(int fd,               struct stat *statbuf);
int lstat(const char *pathname, struct stat *statbuf);`}</Code>

      <P>
        Cuando invocas alguna de las tres, el kernel coloca dentro de la estructura
        <em> statbuf</em> la información administrativa del archivo. <em>stat</em> y <em>lstat</em>
        reciben la ruta del archivo. <em>fstat</em> recibe el descriptor abierto. La diferencia
        entre <em>stat</em> y <em>lstat</em> es importante. Si el archivo es un enlace simbólico,
        <em> stat</em> sigue el enlace y te devuelve la información del archivo destino.
        <em> lstat</em> no lo sigue y te devuelve la información del enlace en sí.
      </P>

      <H3>La estructura struct stat con todos sus campos</H3>

      <P>
        La estructura que llena cualquiera de las tres funciones tiene los siguientes campos.
        Léelos despacio porque van a aparecer constantemente en tu código.
      </P>

      <Code title="struct stat">{`struct stat {
    dev_t     st_dev;        /* ID del dispositivo que contiene el archivo */
    ino_t     st_ino;        /* número de inodo */
    mode_t    st_mode;       /* tipo y modo del archivo */
    nlink_t   st_nlink;      /* número de enlaces duros */
    uid_t     st_uid;        /* ID del usuario propietario */
    gid_t     st_gid;        /* ID del grupo del propietario */
    dev_t     st_rdev;       /* ID del dispositivo si el archivo es especial */
    off_t     st_size;       /* tamaño en bytes */
    blksize_t st_blksize;    /* tamaño del bloque para E/S */
    blkcnt_t  st_blocks;     /* número de bloques de 512 bytes asignados */
    struct timespec st_atim; /* última fecha de acceso */
    struct timespec st_mtim; /* última fecha de modificación */
    struct timespec st_ctim; /* última fecha de cambio */

    /* compatibilidad con versiones anteriores */
    #define st_atime st_atim.tv_sec
    #define st_mtime st_mtim.tv_sec
    #define st_ctime st_ctim.tv_sec
};`}</Code>

      <H3>Las máscaras de tipo. Cómo saber qué clase de archivo es</H3>

      <P>
        Usando el campo <em>st_mode</em> puedes conocer el tipo de archivo. Los bits altos del
        modo guardan el tipo. Los bits bajos guardan los permisos. Para extraer solo el tipo
        existen máscaras predefinidas con valores en octal.
      </P>

      <Code title="máscaras de tipo de archivo">{`S_IFMT   0170000   /* máscara para usar con los tipos de archivo */
S_IFSOCK 0140000   /* socket */
S_IFLNK  0120000   /* enlace simbólico */
S_IFREG  0100000   /* archivo regular */
S_IFBLK  0060000   /* dispositivo de bloque */
S_IFDIR  0040000   /* directorio */
S_IFCHR  0020000   /* dispositivo de carácter */
S_IFIFO  0010000   /* FIFO */`}</Code>

      <P>
        Tienes dos formas idiomáticas de comprobar el tipo. La primera aplica la máscara
        <em> S_IFMT</em> al campo y compara con la constante de tipo. La segunda usa una macro
        del estilo <em>S_ISREG</em>, <em>S_ISDIR</em>, etc. La segunda forma es más legible y se
        prefiere en código moderno.
      </P>

      <Code title="dos formas de comprobar tipo">{`/* forma 1: máscara + comparación */
stat(pathname, &sb);
if ((sb.st_mode & S_IFMT) == S_IFREG) {
    /* archivo regular */
}

/* forma 2: macro idiomática */
stat(pathname, &sb);
if (S_ISREG(sb.st_mode)) {
    /* archivo regular */
}`}</Code>

      <H3>Ejemplo. Listar el contenido de un directorio con sus metadatos</H3>

      <P>
        El siguiente programa obtiene la ruta actual del proceso, abre el directorio, y por cada
        entrada llama a stat para imprimir información administrativa. Es la base de cómo está
        implementado el comando <em>ls -l</em> internamente.
      </P>

      <CodeExplain
        title="listar_dir.c"
        lines={[
          { code: '#include <stdlib.h>' },
          { code: '#include <stdio.h>' },
          { code: '#include <unistd.h>' },
          { code: '#include <dirent.h>', note: 'API de directorios. opendir, readdir, closedir.' },
          { code: '#include <sys/types.h>' },
          { code: '#include <sys/stat.h>' },
          { code: '#include <time.h>' },
          { code: '#include <sys/sysmacros.h>' },
          { code: '#define RUTA 255' },
          { code: 'int main(void) {' },
          { code: '    char ruta[RUTA];' },
          { code: '    DIR *dir;' },
          { code: '    struct dirent *direntrada;' },
          { code: '    struct stat sb;' },
          { code: '    if (getcwd(ruta, RUTA) == NULL) {', note: 'getcwd obtiene la ruta absoluta del directorio actual del proceso.' },
          { code: '        perror("No puedo leer la ruta actual");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    printf("Ruta actual: %s\\n", ruta);' },
          { code: '    printf("Mostrar contenido\\n");' },
          { code: '    if ((dir = opendir(ruta)) == NULL) {', note: 'opendir devuelve un handle al directorio que después recorremos con readdir.' },
          { code: '        perror("opendir");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    while ((direntrada = readdir(dir)) != NULL) {' },
          { code: '        if (stat(direntrada->d_name, &sb) == -1) {', note: 'Llenamos struct stat con metadatos del archivo. Si falla, brincamos.' },
          { code: '            perror("stat");' },
          { code: '            continue;' },
          { code: '        }' },
          { code: '        printf("%s\\tinodo=%lu\\ttamaño=%lld\\tmodo=%o\\n",' },
          { code: '               direntrada->d_name,' },
          { code: '               (unsigned long) sb.st_ino,' },
          { code: '               (long long) sb.st_size,' },
          { code: '               sb.st_mode & 0777);', note: 'Imprime nombre, número de inodo, tamaño y permisos en octal.' },
          { code: '    }' },
          { code: '    closedir(dir);' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <Callout tone="success" title="Qué entendimos en esta página">
        Cada archivo en UNIX tiene un inodo asociado. El inodo guarda propietario, tipo, permisos,
        número de enlaces, tamaño y punteros a los bloques de datos, pero NO guarda el nombre. Los
        nombres viven en los directorios. El kernel mantiene una tabla de inodos en RAM como
        caché de la lista en disco, con campos extra como estado, contador de copias y enlaces a
        cola hash y lista libre. Existe diferencia entre escribir el contenido del archivo y
        escribir el contenido del inodo. Cambian por razones distintas. Desde C se accede al
        inodo con stat, fstat o lstat según tengas ruta o descriptor o quieras seguir enlaces
        simbólicos. El campo st_mode codifica tipo en los bits altos y permisos en los bajos. Las
        macros S_ISREG, S_ISDIR y compañía son la forma idiomática de detectar el tipo.
      </Callout>
    </>
  );
}
