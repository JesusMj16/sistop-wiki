import { P, H2, H3, Code, Callout, CodeExplain, FileTypesFlow } from '../../components/ui/Prose';

export default function TiposArchivos() {
  return (
    <>
      <H2>7.3 Tipos de archivos en Linux</H2>

      <P>
        Hasta ahora hablamos del sistema de archivos como si todos los archivos fueran iguales. En la
        práctica no lo son. Linux clasifica cada archivo en uno de cuatro tipos bien definidos.
        Ordinarios, también llamados regulares o de datos. Directorios. De dispositivos, también
        conocidos como especiales. Y de comunicación, como tuberías o pipes. Los cuatro comparten la
        misma estructura básica de inodo pero el kernel los trata de forma muy distinta según el
        tipo. Vamos a recorrerlos uno por uno.
      </P>

      <H3>Vista comparada de los cuatro tipos</H3>

      <P>
        Antes de entrar al detalle de cada uno, conviene tener una imagen mental de los cuatro
        viéndolos lado a lado. La animación recorre los tipos en orden y resalta el que se está
        explicando. Pon atención a cómo cada uno representa internamente sus datos. El ordinario
        guarda bytes. El directorio guarda una tabla. El dispositivo guarda solo dos números. El
        pipe mueve bytes en tránsito sin guardarlos permanentemente.
      </P>

      <FileTypesFlow />

      <H2>1. Archivos ordinarios o regulares</H2>

      <P>
        Los archivos ordinarios contienen bytes de datos organizados como un arreglo lineal. Son lo
        que la mayoría de la gente imagina cuando piensa en un archivo. Un documento de texto. Una
        imagen. Un binario ejecutable. Todos caen en esta categoría. Las operaciones que se pueden
        realizar sobre sus datos son leer bytes, escribir bytes, añadir bytes al final, y truncar
        su tamaño. Las operaciones que NO están permitidas son insertar bytes en medio del archivo,
        borrar bytes individuales, o truncar el archivo a un tamaño que no sea cero o el tamaño
        completo.
      </P>

      <P>
        Hay un punto que conviene aclarar de una vez. En UNIX y Linux, los archivos ordinarios no
        contienen su propio nombre como parte de sus datos. El nombre es solo una etiqueta que mapea
        una cadena humana a un número de inodo específico, y esa etiqueta vive dentro del directorio
        que lo contiene. El archivo en sí solo almacena metadatos como tipo, permisos, propietario y
        tamaño, además de punteros a los bloques de datos reales en el disco. Por eso renombrar un
        archivo es instantáneo. Solo cambias una entrada del directorio.
      </P>

      <H2>2. Directorios. La estructura jerárquica</H2>

      <P>
        Los directorios son los archivos que permiten darle estructura jerárquica al sistema. Su
        función fundamental es establecer la relación entre el nombre de un archivo y su inodo
        correspondiente. En algunas versiones de UNIX, un directorio es un archivo cuyos datos
        están organizados como una secuencia de entradas, donde cada una contiene un número de
        inodo y el nombre de un archivo que pertenece al directorio. Al par inodo más nombre se le
        conoce como <strong>enlace</strong>, en inglés link.
      </P>

      <P>
        Esta es la idea elegante. Un directorio es solo un archivo más, pero su contenido es una
        tabla. El kernel maneja los datos del directorio con los mismos procedimientos con que
        maneja los datos de los archivos ordinarios, usando la estructura inodo y los bloques de
        acceso directo e indirectos. Los procesos pueden leer el contenido de un directorio como
        si fuera un archivo de datos. Pero no pueden modificarlo directamente. El derecho de
        escritura en un directorio está reservado al kernel. Cualquier modificación tiene que pasar
        por syscalls específicas como <em>creat</em>, <em>mknod</em>, <em>link</em> o
        <em> unlink</em>.
      </P>

      <H3>Permisos sobre un directorio. Significado especial</H3>

      <P>
        Los permisos clásicos lectura, escritura y ejecución tienen significado distinto cuando
        aplican a un directorio comparado con un archivo regular. Hay que tener este detalle muy
        claro porque genera mucha confusión al inicio.
      </P>

      <P>
        <strong>Permiso de lectura.</strong> Permite que un proceso pueda leer el contenido del
        directorio, es decir, listar los nombres de los archivos que contiene. Sin este permiso,
        comandos como <em>ls</em> fallan.
      </P>

      <P>
        <strong>Permiso de escritura.</strong> Permite a un proceso crear una nueva entrada en el
        directorio o borrar alguna ya existente. Esto se realiza a través de las llamadas
        <em> creat</em>, <em>mknod</em>, <em>link</em> o <em>unlink</em>. Importante. Permiso de
        escritura sobre el directorio basta para borrar archivos dentro, aunque no tengas permisos
        sobre los archivos mismos.
      </P>

      <P>
        <strong>Permiso de ejecución.</strong> Autoriza a un proceso a buscar el nombre de un
        archivo dentro del directorio. Sin permiso de ejecución no puedes ni siquiera entrar al
        directorio con <em>cd</em>, aunque tengas permiso de lectura. Suena raro la primera vez
        que lo encuentras.
      </P>

      <Callout tone="info" title="El kernel traduce pathname a inodo">
        Desde el punto de vista del usuario los archivos se referencian por su pathname, una cadena
        como /home/gcgero/notas.txt. El kernel se encarga de transformar ese pathname en su número
        de inodo correspondiente. Lo hace componente a componente. Abre la raíz, busca home,
        encuentra el inodo de home, lo abre como directorio, busca gcgero dentro, y así
        sucesivamente hasta el último componente. Por eso el permiso de ejecución en cada
        directorio intermedio es crítico.
      </Callout>

      <H3>Las funciones C para leer directorios. opendir y readdir</H3>

      <P>
        Existen funciones estándar para abrir y leer directorios desde un programa en C. Las dos
        principales son <em>opendir</em> y <em>readdir</em>, basadas en el Manual del Programador
        de Linux.
      </P>

      <Code title="opendir">{`#include <sys/types.h>
#include <dirent.h>

DIR *opendir(const char *nombre);`}</Code>

      <P>
        La función <em>opendir</em> devuelve un apuntador al flujo de directorio. Ese apuntador
        queda posicionado en la primera entrada del directorio listo para leer. Si ocurre un error
        devuelve NULL y deja la causa en <em>errno</em>. Los errores posibles son los siguientes.
      </P>

      <P>
        <strong>EACCES.</strong> Permiso denegado. El proceso no tiene permiso de lectura sobre el
        directorio.
      </P>

      <P>
        <strong>EMFILE.</strong> El proceso está usando demasiados descriptores de archivo abiertos
        simultáneamente.
      </P>

      <P>
        <strong>ENFILE.</strong> Hay demasiados archivos abiertos en el sistema entero, no solo en
        este proceso.
      </P>

      <P>
        <strong>ENOENT.</strong> El directorio no existe o el nombre es una cadena vacía.
      </P>

      <P>
        <strong>ENOMEM.</strong> Memoria insuficiente para completar la operación.
      </P>

      <P>
        <strong>ENOTDIR.</strong> El nombre apunta a algo que no es un directorio. Por ejemplo, un
        archivo regular.
      </P>

      <Code title="readdir">{`#include <dirent.h>

struct dirent *readdir(DIR *dirp);`}</Code>

      <P>
        Cada llamada subsecuente a <em>readdir</em> devuelve un apuntador a una estructura con
        información sobre la siguiente entrada del directorio. Cuando llega al final, devuelve
        NULL. Para volver al inicio del directorio sin cerrarlo se usa <em>rewinddir</em>. Para
        cerrarlo se usa <em>closedir</em>.
      </P>

      <Code title="struct dirent">{`struct dirent {
    long           d_ino;       /* número de inodo */
    off_t          d_off;       /* ajuste hasta el dirent */
    unsigned short d_reclen;    /* longitud del registro */
    unsigned char  d_type;      /* tipo de archivo, no en todos los FS */
    char           d_name[256]; /* nombre, terminado en nulo */
};`}</Code>

      <P>
        El campo <em>d_ino</em> es el número de inodo de la entrada. El campo <em>d_off</em> es la
        distancia desde el principio del directorio hasta esta estructura. El campo <em>d_reclen</em>
        es el tamaño del registro sin contar el carácter nulo final. El campo <em>d_name</em> es el
        nombre del archivo como cadena terminada en nulo, hasta 256 bytes.
      </P>

      <H3>Ejemplo. Imprimir el contenido de un directorio</H3>

      <CodeExplain
        title="lista_dir.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <string.h>' },
          { code: '#include <dirent.h>' },
          { code: '#include <errno.h>' },
          { code: 'int main(int argc, char *argv[]) {' },
          { code: '    DIR *directorio;' },
          { code: '    struct dirent *entradadir;' },
          { code: '    if (argc != 2) {', note: 'Esperamos exactamente un argumento que sea la ruta del directorio.' },
          { code: '        fprintf(stderr, "Use: %s nombre_directorio\\n", argv[0]);' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    if ((directorio = opendir(argv[1])) == NULL) {', note: 'Abre el directorio. Si falla, imprime el motivo con strerror sobre errno.' },
          { code: '        fprintf(stderr, "No puedo abrir el directorio %s. Error %s\\n",' },
          { code: '                argv[1], strerror(errno));' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    while ((entradadir = readdir(directorio)) != NULL)', note: 'Itera entrada por entrada hasta agotar el directorio. NULL indica el final.' },
          { code: '        printf("%s\\n", entradadir->d_name);' },
          { code: '    closedir(directorio);', note: 'Libera los recursos asociados al flujo de directorio.' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <H2>3. Archivos de dispositivos o especiales</H2>

      <P>
        Los archivos especiales o archivos de dispositivos permiten a los procesos comunicarse con
        los dispositivos periféricos. Discos, cintas, impresoras, terminales, redes. Existen dos
        tipos distintos. Modo bloque y modo carácter. Cada uno con su propio modelo de
        transferencia.
      </P>

      <H3>Modo bloque vs modo carácter</H3>

      <P>
        Los archivos de dispositivos modo bloque se ajustan a un modelo concreto. El dispositivo
        contiene un arreglo de bloques de tamaño fijo, generalmente múltiplo de 512 bytes. El
        kernel gestiona un buffer caché implementado vía software que acelera la velocidad de
        transferencia. Cuando lees un sector que ya está cacheado, no hace falta tocar el hardware.
        Típico ejemplo, los discos y las particiones.
      </P>

      <P>
        Los archivos de dispositivos modo carácter ven la información como una secuencia lineal de
        bytes. La velocidad de transferencia entre el kernel y el dispositivo es baja porque no se
        usa el buffer caché. Cada byte va y viene directamente. Típicos ejemplos son las terminales
        y los puertos serie.
      </P>

      <H3>Drivers. Los módulos del kernel que hablan con el hardware</H3>

      <P>
        Los módulos del kernel que gestionan la comunicación con los dispositivos se conocen como
        controladores o drivers. Para ver los drivers cargados en tu Linux, la forma más rápida es
        usar el comando <em>lsmod</em> que lista los módulos cargados. Si quieres ver qué driver
        está asociado a cada pieza de hardware, usa <em>lspci -k</em>.
      </P>

      <P>
        El sistema también soporta dispositivos de software o pseudo dispositivos que no tienen
        hardware asociado. En Linux estos se gestionan principalmente a través del directorio
        <em> /dev</em>. A diferencia de los dispositivos físicos como discos o tarjetas de red,
        estos no existen como hardware sino que son manejados directamente por el kernel. Por
        ejemplo, si una parte de la memoria del sistema se gestiona como un dispositivo, los
        procesos que quieran acceder a esa zona tendrán que usar las mismas syscalls de manejo de
        archivos pero sobre el archivo de dispositivo. El archivo <em>/dev/mem</em> es un
        dispositivo genérico para acceder a la memoria. En esta situación, la memoria es tratada
        como un periférico más.
      </P>

      <H3>El inodo del dispositivo no guarda datos. Guarda dos números</H3>

      <P>
        Los archivos de dispositivos tienen asociado un inodo igual que los demás. Pero en el caso
        de los archivos ordinarios o directorios, el inodo indica los bloques donde se encuentran
        los datos. En el caso de los archivos de dispositivos no hay datos a los que referenciar.
        En su lugar, el inodo contiene dos números conocidos como <strong>número mayor</strong> y
        <strong> número menor</strong>.
      </P>

      <P>
        El número mayor indica el tipo de dispositivo. Disco, cinta, terminal, etc. El número menor
        indica la unidad específica dentro de ese tipo. Por ejemplo, mayor 8 significa driver sd
        para discos SATA y SCSI, y menor 1 dentro de ese driver es la partición sda1. Por medio del
        comando <em>lsblk -d -o NAME,MAJ:MIN,SIZE,TYPE,MOUNTPOINT</em> puedes listar los
        dispositivos de bloque mostrando esa relación MAJ a MIN.
      </P>

      <P>
        En realidad, los números mayor y menor los usa el kernel para buscar dentro de tablas
        internas una colección de rutinas que permiten manejar el dispositivo. Esa colección de
        rutinas es lo que constituye el driver. Esto ya lo recorrimos paso a paso en la animación
        de la página 7.1.
      </P>

      <H3>Las funciones C para extraer mayor y menor</H3>

      <Code title="major y minor">{`#include <sys/sysmacros.h>

unsigned int major(dev_t dev);
unsigned int minor(dev_t dev);`}</Code>

      <P>
        Estas dos macros toman el campo <em>st_rdev</em> de la estructura <em>stat</em> y extraen
        los dos números. <em>st_rdev</em> solo es válido si el archivo es de tipo dispositivo. Si
        es regular o directorio, este campo no aplica.
      </P>

      <H3>Ejemplo. Detectar tipo de dispositivo y extraer mayor/menor</H3>

      <CodeExplain
        title="dispositivoMyMenor.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <sys/stat.h>' },
          { code: '#include <unistd.h>' },
          { code: '#include <sys/sysmacros.h>', note: 'Aquí viven las macros major y minor.' },
          { code: 'int main(int argc, char *argv[]) {' },
          { code: '    struct stat sb;' },
          { code: '    if (argc != 2) {' },
          { code: '        fprintf(stderr, "Uso: %s <ruta_dispositivo>\\n", argv[0]);' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    if (stat(argv[1], &sb) == -1) {', note: 'stat llena la estructura con todos los metadatos del archivo apuntado.' },
          { code: '        perror("stat");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    printf("Archivo: %s\\n", argv[1]);' },
          { code: '    if (S_ISCHR(sb.st_mode)) {', note: 'Detecta dispositivo de caracteres.' },
          { code: '        printf("Tipo: Dispositivo de caracteres (Char)\\n");' },
          { code: '    } else if (S_ISBLK(sb.st_mode)) {', note: 'Detecta dispositivo de bloques.' },
          { code: '        printf("Tipo: Dispositivo de bloques (Block)\\n");' },
          { code: '    } else {' },
          { code: '        printf("Tipo: No es un dispositivo de bloques o caracteres\\n");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    printf("Número Mayor (Major): %u\\n", major(sb.st_rdev));' },
          { code: '    printf("Número Menor (Minor): %u\\n", minor(sb.st_rdev));' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <H3>Salidas reales del programa</H3>

      <Code title="ejecuciones del programa anterior">{`$ ./dispositivoMyMenor /dev/tty1
Archivo: /dev/tty1
Tipo: Dispositivo de caracteres (Char)
Número Mayor (Major): 4
Número Menor (Minor): 1

$ ./dispositivoMyMenor /dev/loop49
Archivo: /dev/loop49
Tipo: Dispositivo de bloques (Block)
Número Mayor (Major): 7
Número Menor (Minor): 49`}</Code>

      <P>
        Léelo despacio. <em>/dev/tty1</em> es un dispositivo de caracteres. Mayor 4 corresponde al
        driver de terminales virtuales. Menor 1 es la primera terminal. <em>/dev/loop49</em> es un
        dispositivo de bloques. Mayor 7 corresponde al driver de loop devices. Menor 49 es la
        cuadragésima novena instancia. Con solo dos enteros y una tabla del kernel, queda
        completamente identificado el dispositivo.
      </P>

      <H2>4. Archivos de comunicación. Las tuberías</H2>

      <P>
        Como ya se mencionó en el capítulo de IPC, los archivos de comunicación, llamados también
        pipes o tuberías, son archivos con una estructura similar a la de los archivos ordinarios.
        La diferencia principal es que los datos de una tubería son <strong>transitorios</strong>
        y se utilizan para comunicar procesos. Lo normal es que un proceso abra la tubería para
        escritura y otro la abra para lectura.
      </P>

      <P>
        Los datos escritos en la tubería se leen en el mismo orden en que fueron escritos. Esto es
        el clásico modelo FIFO, first in first out. La sincronización del acceso a la tubería es
        algo de lo que se encarga el kernel. Si el escritor mete bytes más rápido de lo que el
        lector los consume, el kernel bloquea al escritor cuando se llena el buffer interno. Si el
        lector intenta leer cuando no hay datos, el kernel lo bloquea hasta que llegue algo.
      </P>

      <P>
        El almacenamiento de los datos en una tubería se realiza de la misma forma que en un
        archivo ordinario. La única particularidad es que el kernel solo utiliza entradas directas
        de la tabla de direcciones de bloque del inodo. No apuntadores indirectos. Esto limita el
        tamaño máximo del buffer pero simplifica la implementación y es suficiente para el caso
        típico.
      </P>

      <H3>Inspeccionar tuberías desde shell</H3>

      <P>
        En Linux puedes listar las tuberías en uso con <em>lsof | grep FIFO</em>. Si quieres
        buscar tuberías con nombre persistentes en el sistema de archivos, usa <em>find / -type p
        2 mayor que /dev/null</em>. Este comando busca en todo el sistema desde la raíz, filtra
        por tipo pipe, y oculta los errores de permisos redirigiendo stderr a /dev/null.
      </P>

      <Code title="comandos útiles">{`# tuberías abiertas por procesos vivos
lsof | grep FIFO

# tuberías con nombre persistentes en el FS
find / -type p 2>/dev/null

# todos los dispositivos de bloque con su mayor y menor
lsblk -d -o NAME,MAJ:MIN,SIZE,TYPE,MOUNTPOINT

# drivers cargados en el kernel
lsmod

# qué driver atiende a cada pieza de hardware PCI
lspci -k`}</Code>

      <Callout tone="success" title="Qué entendimos en esta página">
        Linux tiene exactamente cuatro tipos de archivos. Ordinarios para bytes lineales editables
        solo al final, directorios como tablas nombre a inodo donde escribir requiere syscalls
        específicas, dispositivos como interfaz al hardware con inodo que guarda mayor y menor en
        lugar de bloques, y pipes para datos transitorios FIFO entre procesos. Los directorios
        son archivos también pero el kernel los lee con read estándar y escribe solo con creat
        mknod link unlink. Los permisos en directorios significan algo distinto. Lectura lista
        nombres, escritura crea o borra entradas, ejecución permite atravesar y buscar. Los
        dispositivos modo bloque usan buffer caché de 512 bytes mínimo, los de carácter pasan
        cada byte directo. Mayor y menor son los dos índices que el kernel usa para encontrar el
        driver correcto y la instancia correcta. Las pipes solo usan apuntadores directos del
        inodo. El kernel sincroniza implícitamente lectura y escritura sobre ellas.
      </Callout>
    </>
  );
}
