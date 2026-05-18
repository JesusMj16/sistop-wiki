import { P, H2, H3, Code, Callout, CodeExplain, SuperblockSyncFlow } from '../../components/ui/Prose';

export default function EstructuraLogicaFS() {
  return (
    <>
      <H2>7.2 Estructura lógica del sistema de archivos</H2>

      <P>
        En la página anterior vimos la arquitectura como zonas físicas de un almacén. Ahora vamos a
        verla en su forma <strong>lógica</strong>. Misma arquitectura, distinta lente. La lógica es
        la que el kernel manipula cuando escribe código. La física es la que aterriza en sectores y
        cilindros. Las dos vistas viven una encima de la otra y se traducen mutuamente mediante el
        driver, como vimos en la animación de flujo.
      </P>

      <P>
        En forma lógica el sistema de archivos se compone de cuatro secciones consecutivas. Boot,
        superbloque, lista de inodos y bloque de datos. La estructura es la misma en ext2, ext3 y
        ext4. Vamos por cada una sin recortar nada.
      </P>

      <H3>1. Boot</H3>

      <P>
        Se localiza típicamente en el primer sector del disco y puede contener el código de arranque
        del sistema operativo. Ese código es un programa pequeñísimo que tiene una sola tarea.
        Buscar el sistema operativo dentro del disco, cargarlo en memoria e inicializarlo. Si el
        disco no es de arranque, el bloque sigue existiendo porque la estructura lo exige, aunque su
        contenido permanezca vacío.
      </P>

      <H3>2. Superbloque</H3>

      <P>
        Describe el estado completo del sistema de archivos. Tamaño total. Total de archivos.
        Cantidad de espacio libre. Es el plano maestro pegado en la pared del almacén. Sin él, el
        kernel está ciego.
      </P>

      <H3>3. Lista de inodos</H3>

      <P>
        Es una tabla con una entrada por cada archivo. Cada entrada se llama inodo y guarda la
        descripción completa del archivo. Situación física del archivo, propietario, permisos,
        fechas, conteo de enlaces, y punteros a los bloques de datos donde vive el contenido. Lo
        que NO guarda es el nombre. Esa decisión es deliberada y la explicamos en la página
        anterior. Los nombres viven en los directorios.
      </P>

      <H3>4. Bloque de datos</H3>

      <P>
        Es la zona donde efectivamente se almacena el contenido de cada archivo al que apunta la
        lista de inodos. La gran mayoría del disco es esto. Si tu partición es de 500 GB, casi
        todos esos bytes están en el bloque de datos. El boot ocupa un sector. El superbloque
        ocupa otro. La lista de inodos ocupa una fracción pequeña pero fija. El resto es datos
        puros.
      </P>


      <H2>7.2.1 El superbloque a fondo</H2>

      <P>
        El superbloque es la pieza más importante de los metadatos de un sistema de archivos. Si se
        corrompe el superbloque, el sistema entero queda inutilizable hasta que se restaure desde
        una copia de respaldo. Por eso las versiones modernas guardan varias copias replicadas en
        puntos distintos del disco. Veamos qué información contiene exactamente.
      </P>

      <H3>Campos que vive dentro del superbloque</H3>

      <P>
        El superbloque guarda, entre otras cosas, los siguientes datos críticos. Léelos despacio
        porque cada uno tiene un propósito específico en la mecánica del filesystem.
      </P>

      <P>
        <strong>Tamaño del sistema de archivos.</strong> Cuántos bloques en total componen el FS.
        Es la frontera que el kernel jamás debe cruzar al asignar nuevos bloques.
      </P>

      <P>
        <strong>Lista de bloques libres disponibles.</strong> Una tabla con las direcciones de los
        bloques que aún no están asignados a ningún archivo. Cuando se crea un archivo nuevo, de
        aquí salen sus bloques.
      </P>

      <P>
        <strong>Índice del siguiente bloque libre.</strong> Un puntero que dice cuál es el próximo
        bloque que se asignará. Funciona como cabeza de la lista de bloques libres. Asignación en
        tiempo constante.
      </P>

      <P>
        <strong>Tamaño de la lista de inodos.</strong> Cuántos inodos máximos puede contener este
        FS. Determinado al momento de formatear con mkfs y muy difícil de cambiar después.
      </P>

      <P>
        <strong>Total de inodos libres y lista de inodos libres.</strong> Mismo concepto que para
        bloques pero aplicado a inodos. Cuando creas un archivo nuevo, se consume un inodo además
        de bloques de datos.
      </P>

      <P>
        <strong>Índice del siguiente inodo libre.</strong> Puntero al próximo inodo que se asignará.
      </P>

      <P>
        <strong>Campos de bloqueo de las listas de bloques libres e inodos libres.</strong> Cuando
        un proceso pide reservar un bloque o un inodo, el kernel bloquea estas listas para evitar
        que otro proceso simultáneo le robe el mismo recurso. Estos campos son banderas internas
        de exclusión mutua.
      </P>

      <P>
        <strong>Banderas para indicar si el superbloque ha sido modificado.</strong> Esto es la
        famosa bandera dirty. Cuando vale verdadero, significa que la copia en RAM tiene cambios
        pendientes de bajarse al disco.
      </P>

      <H3>Por qué hay una copia en RAM</H3>

      <P>
        Para realizar de forma eficiente el acceso a los datos del disco, en la memoria del sistema
        se mantiene una copia del superbloque y de la lista de inodos. Cada vez que el kernel
        necesita saber cuántos bloques libres quedan, no va al disco a leer. Mira su copia en RAM.
        Diez veces más rápido. Pero introduce el problema de la sincronización. Las modificaciones
        van primero a la copia en RAM. Si el sistema se cae antes de bajarlas al disco, se pierden.
      </P>

      <P>
        Para amortiguar este riesgo, el kernel mantiene procesos internos llamados hilos de
        writeback. Los más conocidos son <em>sync_supers</em> y <em>sync_filesystems</em>. Estos
        hilos despiertan periódicamente, miran qué superbloques tienen la bandera dirty activa, los
        escriben al disco y limpian la bandera. Garantizan integridad de datos ante cierres
        inesperados o fallos de energía. No la garantizan al cien por ciento, pero reducen la
        ventana de pérdida a unos pocos segundos.
      </P>

      <P>
        Naturalmente, antes de apagar el sistema también hay que actualizar el superbloque y las
        tablas de inodos del disco. El encargado de coordinar esa última sincronización es el
        programa <em>shutdown</em>. Por eso apagar la máquina con el botón físico de encendido es
        agresivo. shutdown nunca corre, los hilos writeback nunca terminan su última pasada, y los
        datos en RAM se pierden con todo lo dirty.
      </P>

      <H3>Cómo forzar sincronización manual</H3>

      <P>
        Si quieres forzar manualmente la sincronización de la caché con el disco, puedes ejecutar
        el comando <em>sync</em> en una terminal. Si quieres hacerlo desde un programa en C, hay
        dos llamadas al sistema dedicadas.
      </P>

      <Code title="sync y syncfs">{`#include <unistd.h>

void sync(void);
int  syncfs(int fd);`}</Code>

      <P>
        La función <em>sync</em> hace que todas las modificaciones pendientes de los metadatos del
        sistema de archivos y los datos de los archivos en caché se escriban en los sistemas de
        archivos subyacentes. Es global. Afecta a todos los filesystems montados. La función
        <em> syncfs</em> es similar pero más quirúrgica. Sincroniza únicamente el sistema de
        archivos que contiene el archivo al que hace referencia el descriptor <em>fd</em> que tú le
        pasas. Devuelve 0 en éxito y -1 si fd no es un descriptor válido, dejando la causa en
        <em> errno</em>. <em>sync</em> en cambio siempre se ejecuta correctamente porque no
        depende de argumentos.
      </P>

      <H3>Mira la sincronización en acción</H3>

      <P>
        Antes de entrar a montar y desmontar, ve cómo se ve este baile entre RAM y disco paso a
        paso. La animación recorre ocho fases. Desde el montaje inicial donde RAM y disco
        coinciden, pasa por modificaciones que ensucian la copia en RAM, muestra el writeback
        bajando los cambios, fuerza una sincronización manual con sync, ejecuta shutdown y termina
        con umount. Pon atención a la bandera dirty en rojo del lado RAM, y al delta entre los
        contadores de bloques libres de los dos lados.
      </P>

      <SuperblockSyncFlow />

      <H3>Montar y desmontar sistemas de archivos</H3>

      <P>
        En GNU/Linux existen los comandos <em>mount</em> y <em>umount</em> para añadir y remover
        sistemas de archivos en caliente. En lenguaje C las llamadas equivalentes se llaman igual.
        Son la puerta de entrada del kernel para reconocer un disco nuevo o expulsar uno existente.
      </P>

      <Code title="mount">{`#include <sys/mount.h>

int mount(const char *source, const char *target,
          const char *filesystemtype, unsigned long mountflags,
          const void *data);`}</Code>

      <P>
        La función <em>mount</em> añade el sistema de archivos especificado en <em>source</em> en
        la ubicación dada por <em>target</em>. El primer parámetro suele ser la ruta del
        dispositivo, por ejemplo <em>/dev/sda1</em>, o la ruta asociada al directorio de montaje
        del dispositivo, o una cadena ficticia si el sistema de archivos no requiere dispositivo
        real. El segundo parámetro es el punto de montaje, un directorio existente donde el
        contenido del FS aparecerá visible. Para añadir un sistema de archivos hace falta la
        capacidad <em>CAP_SYS_ADMIN</em>, es decir, privilegios de administrador.
      </P>

      <P>
        El argumento <em>filesystemtype</em> indica qué driver de filesystem usar. Los valores
        admitidos por tu kernel están listados en <em>/proc/filesystems</em>. El argumento
        <em> mountflags</em> es una máscara de bits con opciones como solo lectura, sin ejecutar,
        sin actualizar tiempos de acceso. El argumento <em>data</em> depende del filesystem y
        suele ser una cadena de opciones extra.
      </P>

      <Code title="umount y umount2">{`#include <sys/mount.h>

int umount(const char *target);
int umount2(const char *target, int flags);`}</Code>

      <P>
        Las funciones <em>umount</em> y <em>umount2</em> eliminan el sistema de archivos montado
        en <em>target</em>. La diferencia es que <em>umount2</em> acepta banderas adicionales para
        controlar el comportamiento, por ejemplo forzar el desmontaje aunque haya archivos
        abiertos.
      </P>

      <H3>Estadísticas del sistema de archivos. statvfs y fstatvfs</H3>

      <P>
        También se pueden obtener estadísticas de los sistemas de archivos montados a través de los
        llamados <em>statvfs</em> y <em>fstatvfs</em>. Existen además los llamados al sistema
        <em> statfs</em> y <em>fstatfs</em>. La diferencia es importante. Los primeros son la
        interfaz estándar POSIX, definida en IEEE Std 1003.1-2001, recomendada cuando quieres
        escribir aplicaciones portables entre UNIX y Linux. Los segundos son la interfaz antigua,
        disponible en Linux pero no portable a todos los UNIX. Para código nuevo, casi siempre se
        usan los POSIX.
      </P>

      <Code title="statvfs y fstatvfs">{`#include <sys/statvfs.h>

int statvfs(const char *path, struct statvfs *buf);
int fstatvfs(int fd, struct statvfs *buf);`}</Code>

      <Code title="statfs y fstatfs (antigua)">{`#include <sys/vfs.h>      /* o <sys/statfs.h> */

int statfs(const char *path, struct statfs *buf);
int fstatfs(int fd, struct statfs *buf);`}</Code>

      <P>
        Las funciones devuelven información acerca del sistema de archivos montado al que pertenece
        el archivo que tú indiques. <em>statvfs</em> recibe una ruta de archivo. <em>fstatvfs</em>
        recibe un descriptor abierto. El resultado se deposita en una estructura <em>statvfs</em>
        con los siguientes campos.
      </P>

      <Code title="struct statvfs">{`struct statvfs {
    unsigned long  f_bsize;     /* tamaño del bloque del FS */
    unsigned long  f_frsize;    /* tamaño del fragmento */
    fsblkcnt_t     f_blocks;    /* tamaño del FS en unidades de fragmentos */
    fsblkcnt_t     f_bfree;     /* bloques libres */
    fsblkcnt_t     f_bavail;    /* bloques libres para usuarios sin privilegios */
    fsfilcnt_t     f_files;     /* total de inodos */
    fsfilcnt_t     f_ffree;     /* inodos libres */
    fsfilcnt_t     f_favail;    /* inodos libres para usuarios sin privilegios */
    unsigned long  f_fsid;      /* ID del FS */
    unsigned long  f_flag;      /* banderas de montaje */
    unsigned long  f_namemax;   /* longitud máxima del nombre de archivo */
};`}</Code>

      <P>
        Los tipos <em>fsblkcnt_t</em> y <em>fsfilcnt_t</em> están definidos en
        <em> sys/types.h</em> y pueden usarse como un tipo <em>unsigned long</em>. El campo
        <em> f_flag</em> es una máscara de bits que indica las opciones empleadas al montar el FS.
        Sus valores posibles son los siguientes.
      </P>

      <H3>Banderas de montaje reportadas en f_flag</H3>

      <P>
        <strong>ST_MANDLOCK.</strong> El bloqueo de archivos es obligatorio en este FS, no
        opcional.
      </P>

      <P>
        <strong>ST_NOATIME.</strong> El kernel no actualiza la fecha de último acceso al leer
        archivos. Ahorra escrituras de metadatos. Muy usado en servidores con discos lentos.
      </P>

      <P>
        <strong>ST_NODEV.</strong> No se permite el acceso a archivos especiales de dispositivo
        dentro de este FS. Útil para particiones de datos.
      </P>

      <P>
        <strong>ST_NODIRATIME.</strong> No se actualizan los tiempos de acceso a directorios. Más
        sutil que ST_NOATIME, solo aplica a directorios.
      </P>

      <P>
        <strong>ST_NOEXEC.</strong> La ejecución de programas no está permitida desde este FS. Si
        intentas ejecutar un binario que vive aquí, falla. Útil para particiones que solo deben
        contener datos.
      </P>

      <P>
        <strong>ST_NOSUID.</strong> Los bits set-user-ID y set-group-ID son ignorados al ejecutar
        archivos de este FS. Defensa contra binarios maliciosos con setuid.
      </P>

      <P>
        <strong>ST_RDONLY.</strong> El FS está montado solo para lectura. Cualquier intento de
        escribir falla.
      </P>

      <P>
        <strong>ST_RELATIME.</strong> Actualiza el tiempo de acceso solo si es anterior al de
        modificación o cambio. Compromiso entre rendimiento y precisión.
      </P>

      <P>
        <strong>ST_SYNCHRONOUS.</strong> Las escrituras se sincronizan de forma inmediata al disco.
        Sin caché. Cada write es atómico contra fallos de energía pero brutalmente lento.
      </P>

      <P>
        Las funciones <em>statvfs</em> y <em>fstatvfs</em> retornan 0 en éxito y -1 en error,
        dejando la causa en <em>errno</em>.
      </P>

      <H3>Ejemplo. Programa que consulta estadísticas con statvfs</H3>

      <CodeExplain
        title="vfs_demo.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <errno.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <sys/statvfs.h>' },
          { code: 'int main() {' },
          { code: '    struct statvfs vfs;' },
          { code: '    char *ruta = "/";', note: 'Consultamos la raíz del sistema de archivos.' },
          { code: '    if (statvfs(ruta, &vfs) != 0) {' },
          { code: '        perror("llamado de statvfs");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    printf("\\tArchivo: %s\\n", ruta);' },
          { code: '    printf("\\tTamaño de bloques: %ld\\n",  (long) vfs.f_bsize);' },
          { code: '    printf("\\tTamaño de fragmento: %ld\\n", (long) vfs.f_frsize);' },
          { code: '    printf("\\tTamaño en unidades: %lu\\n",  (unsigned long) vfs.f_blocks);' },
          { code: '    printf("\\tBloques libres: %lu\\n",      (unsigned long) vfs.f_bfree);' },
          { code: '    printf("\\tBloques disponibles: %lu\\n", (unsigned long) vfs.f_bavail);' },
          { code: '    printf("\\tNúmero de inodos: %lu\\n",    (unsigned long) vfs.f_files);' },
          { code: '    printf("\\tInodos libres: %lu\\n",       (unsigned long) vfs.f_ffree);' },
          { code: '    printf("\\tInodos disponibles: %lu\\n",  (unsigned long) vfs.f_favail);' },
          { code: '    printf("\\tID del SA: %#lx\\n",          (unsigned long) vfs.f_fsid);' },
          { code: '    printf("\\tBandera: ");' },
          { code: '    if (vfs.f_flag == 0) printf("(Ninguna)\\n");' },
          { code: '    else {' },
          { code: '        if ((vfs.f_flag & ST_RDONLY) != 0) printf("ST_RDONLY ");', note: 'Inspecciona bit por bit las banderas activas.' },
          { code: '        if ((vfs.f_flag & ST_NOSUID) != 0) printf("ST_NOSUID");' },
          { code: '        printf("\\n");' },
          { code: '    }' },
          { code: '    printf("\\tLongitud max para archivo: %ld\\n", (long) vfs.f_namemax);' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <Callout tone="success" title="Qué entendimos en esta página">
        El sistema de archivos lógico tiene cuatro secciones consecutivas. Boot. Superbloque. Lista
        de inodos. Bloque de datos. El superbloque es el plano maestro y guarda tamaño, listas de
        bloques e inodos libres, índices de la siguiente unidad libre, campos de bloqueo y la
        bandera dirty. El kernel mantiene una copia en RAM por velocidad. Los hilos writeback
        bajan los cambios al disco periódicamente. Los programas pueden forzar la bajada con sync
        o syncfs. shutdown hace la sincronización final antes de apagar. mount y umount añaden y
        quitan filesystems con privilegios CAP_SYS_ADMIN. statvfs y fstatvfs son la API POSIX
        portable para consultar estadísticas. statfs y fstatfs son la versión antigua específica
        de Linux.
      </Callout>
    </>
  );
}
