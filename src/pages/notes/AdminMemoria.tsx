import { P, H2, H3, Code, Callout, CodeExplain, PartitionQueueFlow, MemoryTrackingFlow } from '../../components/ui/Prose';

export default function AdminMemoria() {
  return (
    <>
      <P>
        Este capítulo es un recorrido por cinco páginas del manual interno de un kernel. Reasignación
        y protección, intercambio, mapas de bits, listas enlazadas, memoria virtual, y las funciones C
        que te permiten observar todo eso desde un programa de usuario. Cada subtema viene en su
        propia página marcada con separador visual. Léelo en orden. El final de uno engancha con el
        inicio del siguiente.
      </P>

      <H2>5.5 Reasignación y protección</H2>

      <P>
        Imagina el almacén central de una fábrica con cinco mesas de ensamblaje numeradas. La mesa 1
        está pegada a la entrada, la mesa 2 viene después, y así sucesivamente. Llega un manual de
        ensamblaje que dice paso a paso saltar al instructivo en la posición 100 a partir del inicio.
        Si lees ese manual sentado en la mesa 1 que arranca en el metro 0, llegar al paso 100
        significa caminar 100 metros desde la pared. Pero si te sientan en la mesa 2 que arranca en
        el metro 200 mil, ese paso 100 ya no apunta a un sitio útil. Estás recorriendo la pared del
        sistema operativo.
      </P>

      <P>
        Esto es exactamente lo que le ocurre al kernel cuando hay multiprogramación. Las diversas
        tareas se ejecutarán en direcciones distintas. Cuando un programa se liga, el ligador debe
        conocer la dirección donde comienza el programa en memoria. Si la primera instrucción es una
        llamada a un procedimiento que se encuentra en la dirección relativa 100, dentro del archivo
        binario que generó el ligador, y ese programa se carga en la partición 1, esa instrucción
        saltará a la dirección absoluta 100. Es decir, justo dentro del sistema operativo. Lo que
        realmente se necesita es hacer una llamada a 100k más 100. Si el programa se carga en la
        partición 2, la llamada debe ser 200k más 100. Y así para cada partición. Este es el
        <strong> problema de reasignación</strong>.
      </P>

      <H3>La solución por hardware. Registro base y registro límite</H3>

      <P>
        La reasignación durante el proceso de cargado resuelve la mitad del problema pero no la
        protección. Si un proceso por error o por malicia escribe en una dirección fuera de su
        partición, podría machacar la memoria de otro proceso o del propio kernel. La solución
        elegante usa dos registros especiales de hardware llamados <strong>registro base</strong> y
        <strong> registro límite</strong>.
      </P>

      <P>
        Cuando el planificador decide ejecutar un proceso, carga el registro base con la dirección
        de inicio de la partición de ese proceso, y carga el registro límite con la longitud de la
        partición. A partir de ese momento, cada dirección de memoria que la CPU genere
        automáticamente se le añade el contenido del registro base antes de ser enviada al bus de
        memoria. Así, si el registro base tiene valor 100k, una instrucción <em>CALL 100</em> se
        interpreta como una <em>CALL 100k más 100</em> sin que la propia instrucción se vea
        modificada en su byte. Además, antes de mandar la dirección final, el hardware verifica que
        no rebase el registro límite. Si la rebasa, dispara una trampa y el proceso muere con error
        de violación de segmento. Reasignación y protección resueltas con dos registros y dos sumas
        por ciclo.
      </P>

      <Callout tone="info" title="Por qué es tan elegante esta solución">
        La belleza está en que el programa nunca se entera de dónde está realmente cargado. Sigue
        usando direcciones como si empezara en cero. El hardware hace la traducción silenciosa. Esto
        es el ancestro directo de la memoria virtual moderna. La MMU de hoy hace lo mismo pero a
        gran escala con tablas de páginas en vez de un solo par de registros.
      </Callout>


      <H2>5.6 Intercambio</H2>

      <P>
        A diferencia de un sistema por lotes, en un sistema de tiempo compartido existen por lo
        general más usuarios de los que la memoria física puede mantener cargados al mismo tiempo.
        La solución obvia es la que aplicarías en una bodega pequeña con muchos clientes. Lo que no
        cabe en la sala lo guardas en el almacén del fondo y lo traes de vuelta cuando alguien lo
        pide. Ese movimiento entre memoria principal y disco se llama <strong>intercambio</strong>,
        o en jerga moderna, swap.
      </P>

      <P>
        En principio, las particiones fijas se podrían usar para un sistema con intercambio. Cada
        vez que se bloqueara un proceso, se podría trasladar al disco y traer otro proceso a la
        partición que dejó libre. En la práctica, las particiones fijas no son atractivas cuando hay
        poca memoria porque la mayor parte se desperdicia con programas menores que el tamaño
        nominal de su partición. La alternativa que se impuso son las <strong>particiones
        variables</strong>, donde el tamaño de cada zona se ajusta al tamaño real de cada proceso al
        momento de cargarlo.
      </P>

      <H3>El swap en GNU/Linux</H3>

      <P>
        En sistemas GNU/Linux el intercambio se conoce como swap. Para verificar si está activo en
        tu sistema basta con escribir el comando swapon en una terminal. La salida típica es algo
        así.
      </P>

      <Code title="estado del swap">{`gcgero@gcgero-XPS-L421X:~$ swapon
NAME       TYPE       SIZE  USED PRIO
/dev/dm-1  partition  976M  49.9M  -2`}</Code>

      <H3>Programar el swap desde C. swapon y swapoff</H3>

      <P>
        Si quieres activar o desactivar el área de intercambio desde un programa en C, existen dos
        llamadas al sistema dedicadas. Sus prototipos son los siguientes.
      </P>

      <Code title="swapon y swapoff">{`#include <unistd.h>
#include <sys/swap.h>

int swapon(const char *path, int swapflags);
int swapoff(const char *path);`}</Code>

      <P>
        La función <em>swapon</em> fija el área de intercambio para el archivo o dispositivo de
        bloque especificado en el parámetro <em>path</em>. La función <em>swapoff</em> hace lo
        contrario. Detiene el uso del archivo o dispositivo como área de swap. Ambas requieren
        privilegios de superusuario porque manipulan estado global del kernel.
      </P>

      <H3>Compactación y la inquietud del fragmentado</H3>

      <P>
        El hecho de no estar sujeto a un número fijo de particiones mejora el uso de la memoria
        pero también hace más compleja la asignación y reasignación, y complica el mantener
        registro. Conforme procesos entran y salen, la memoria queda como un queso suizo. Bloques
        ocupados intercalados con huecos pequeños. Es posible combinar todos los huecos en uno
        grande si se mueven todos los procesos hacia la parte inferior mientras sea posible. Esta
        técnica se llama <strong>compactación de memoria</strong>. Pero en la práctica casi no se
        usa porque consume demasiado tiempo de CPU. Mover megabytes de un lado a otro mientras
        miles de instrucciones se quedan esperando es un lujo que un sistema interactivo no se
        puede dar.
      </P>

      <P>
        Otra estrategia paliativa es darle a cada proceso un espacio mayor al que realmente
        necesita, para permitirle crecer sin tener que reubicarlo. Funciona bien para procesos cuyo
        crecimiento es predecible.
      </P>

      <H3>Visualización. Particiones fijas con una cola por partición vs cola única</H3>

      <P>
        Cuando trabajas con particiones fijas, una decisión de diseño crítica es cómo manejar la
        fila de trabajos esperando entrar a memoria. La animación que viene compara las dos
        escuelas clásicas. En la versión con varias colas, cada partición tiene su propia fila y un
        trabajo nuevo se mete en la fila de la partición más chica donde quepa. En la versión con
        cola única, hay una sola fila central y el planificador despacha cada trabajo a la
        partición libre adecuada al momento del despacho. La diferencia visible es brutal. La
        versión multi cola permite que una partición quede ociosa mientras otra está saturada. La
        cola única balancea sola.
      </P>

      <PartitionQueueFlow />

      <H3>Tres maneras de llevar el registro de la memoria</H3>

      <P>
        En términos generales, existen tres formas usadas por los sistemas operativos para llevar
        un registro del uso de la memoria. Mapas de bits, listas enlazadas y sistemas amigables
        también llamados buddy systems. Las primeras dos las desarrollamos en las páginas
        siguientes. La tercera la mencionamos como referencia para que sepas que existe.
      </P>

      <H2>5.7 Administración de la memoria con mapas de bits</H2>

      <P>
        Imagina un edificio de cocheras dividido en cajones idénticos. Tienes un tablero a la
        entrada con un foquito por cada cajón. Foco rojo es cajón ocupado. Foco verde es cajón
        libre. Para encontrar cuatro cajones consecutivos libres, recorres los focos con la vista
        buscando una racha de cuatro verdes seguidos. Ese tablero de focos es exactamente un
        <strong> mapa de bits</strong>.
      </P>

      <P>
        Con un mapa de bits, la memoria se divide en unidades de asignación que pueden ser tan
        pequeñas como unas cuantas palabras o tan grandes como varios kilobytes. A cada unidad de
        asignación le corresponde un bit en el mapa de bits, el cual toma el valor 0 si la unidad
        está libre y 1 si está ocupada, o al revés según la convención del sistema.
      </P>

      <H3>El dilema del tamaño de unidad</H3>

      <P>
        El tamaño de la unidad de asignación es un aspecto crítico del diseño. Mientras más pequeña
        sea la unidad, más fino es el control pero más grande resulta el mapa. Una memoria
        compuesta por bloques de 32n bits utilizará n bits del mapa, lo que significa que el mapa
        ocupa 1 de cada 33 partes de la memoria total. Si haces la unidad grande, el mapa es
        pequeño y rápido de recorrer, pero corres el riesgo de desperdiciar una parte valiosa de
        memoria en la última unidad si el tamaño del proceso no es un múltiplo exacto de la unidad
        de asignación. A esto se le llama <em>fragmentación interna</em>.
      </P>

      <H3>El problema serio. Buscar k ceros consecutivos es lento</H3>

      <P>
        El mapa de bits es una forma sencilla de llevar registro porque el tamaño del mapa solo
        depende del tamaño de la memoria y del tamaño de la unidad. Pero tiene un problema
        importante. Cuando se decide traer a la memoria un proceso de k unidades, el administrador
        de la memoria debe buscar en el mapa una cadena de k ceros consecutivos. Esta búsqueda es
        lenta porque hay que examinar bit por bit. Por eso los mapas de bits, siendo conceptualmente
        bellos, no se utilizan con frecuencia en sistemas modernos.
      </P>
      <H2>5.8 Administración de la memoria con listas enlazadas</H2>

      <P>
        La alternativa al mapa de bits es modelar la memoria como una <strong>lista enlazada de
        segmentos</strong>. En vez de un bit por unidad, hay un nodo por región. Cada entrada de la
        lista especifica si es un hueco H o un proceso P, la dirección donde comienza, su longitud,
        y un apuntador a la siguiente entrada. La lista de segmentos está ordenada por direcciones.
        Este orden tiene la ventaja de que al terminar o intercambiar un proceso, la actualización
        de la lista es directa. Basta con marcar el nodo como hueco y fusionarlo con los huecos
        vecinos si los hay.
      </P>

      <H3>Animación. Mapa de bits versus lista enlazada</H3>

      <P>
        Antes de entrar a los algoritmos de asignación, conviene ver lado a lado las dos
        representaciones. Una misma memoria con cinco procesos y tres huecos descrita primero como
        un bloque continuo, después como mapa de bits, después como lista enlazada. La animación
        muestra el costo real de buscar un hueco grande en cada modelo. Examina lo cara que sale
        la búsqueda bit por bit comparada con saltar de nodo en nodo.
      </P>

      <MemoryTrackingFlow />

      <H3>Los cuatro algoritmos clásicos de asignación</H3>

      <P>
        Cuando los procesos y los huecos se mantienen en una lista ordenada por direcciones, se
        pueden utilizar diversos algoritmos para asignar memoria a un proceso recién creado o
        recién traído del disco. Los cuatro que más se enseñan son los siguientes. Cada uno
        representa una filosofía distinta sobre qué optimizar.
      </P>

      <H3>Algoritmo primero en ajustarse, first fit</H3>

      <P>
        El administrador de memoria revisa toda la lista de segmentos hasta encontrar un espacio lo
        suficientemente grande. El espacio se divide entonces en dos partes. Una para el proceso y
        otra para la memoria no utilizada, salvo el caso poco probable de un ajuste exacto. Este
        algoritmo es <strong>rápido</strong> porque busca lo menos posible. Encuentra el primer
        hueco que sirve y se detiene. Cabe hacer notar que este método es el que utiliza UNIX para
        la asignación de memoria, lo cual habla de su buena reputación práctica.
      </P>

      <H3>Algoritmo el siguiente en ajustarse, next fit</H3>

      <P>
        Funciona igual que el anterior, con una diferencia. Mantiene un registro del lugar donde
        encontró un hueco adecuado la última vez. La siguiente vez que se le llama, comienza a
        buscar desde ese punto en lugar de empezar siempre desde el principio. La intuición es que
        si encontró un hueco bueno cerca del medio de la memoria, probablemente el siguiente hueco
        bueno esté también más adelante. Reparte el desgaste por toda la memoria en vez de
        concentrarlo al inicio.
      </P>

      <H3>Algoritmo del mejor ajuste, best fit</H3>

      <P>
        El algoritmo busca en toda la lista y toma el mínimo hueco adecuado. En vez de asignar un
        hueco grande que podría necesitarse más adelante para un proceso grande, el mejor ajuste
        intenta encontrar un hueco lo más cercano posible al tamaño real necesario. Suena perfecto
        pero tiene un costo oculto. Como siempre rompe el hueco que mejor calza, deja como residuo
        un hueco pequeño que pocas veces va a poder reutilizarse. Con el tiempo, la memoria se
        llena de huecos minúsculos inútiles.
      </P>

      <H3>Algoritmo del peor ajuste, worst fit</H3>

      <P>
        Este método toma siempre el hueco más grande disponible, con la idea de que el sobrante que
        queda después de cortar el espacio para el proceso sea suficientemente grande para ser
        útil más adelante. Da la vuelta al problema del mejor ajuste. En lugar de generar huecos
        diminutos, intenta preservar huecos grandes. En la práctica el peor ajuste no es muy
        popular porque tiende a agotar los huecos grandes antes de tiempo, dejando sin recurso a
        los procesos realmente voluminosos cuando llegan.
      </P>

      <H3>Optimización. Dos listas separadas</H3>

      <P>
        Los cuatro algoritmos pueden agilizarse si se mantienen dos listas independientes. Una para
        los procesos y otra para los huecos. De esta forma, todos los algoritmos pueden dedicarse
        a inspeccionar solo la lista de huecos sin perder tiempo recorriendo procesos. El precio
        que se paga por ese aumento de velocidad al asignar memoria es complejidad adicional y
        disminución de velocidad al liberar memoria. Cuando un proceso termina, su segmento debe
        eliminarse de la lista de procesos e insertarse en la lista de huecos, posiblemente
        fusionándolo con huecos vecinos.
      </P>


      <H2>5.9 Memoria virtual</H2>

      <P>
        La idea fundamental detrás de la memoria virtual es directa. El tamaño combinado del
        programa, los datos y la pila puede exceder la cantidad de memoria física disponible. Por
        tanto, el sistema operativo debe mantener solo aquellas partes del programa que se utilicen
        en cada momento dentro de la memoria principal, y colocar el resto en una parte del disco.
        La mayoría de los sistemas con memoria virtual utilizan una técnica llamada
        <strong> paginación</strong>.
      </P>

      <H3>La MMU y la traducción de direcciones</H3>

      <P>
        Al utilizar memoria virtual, las direcciones virtuales que el programa genera no pasan de
        forma directa al bus de memoria. Antes pasan por un chip o conjunto de chips llamado
        <strong> MMU</strong>, Unidad de Administración de Memoria. La MMU asocia cada dirección
        virtual con una dirección física real. Los espacios de direcciones virtuales se dividen en
        unidades llamadas <strong>páginas</strong>. Sus unidades correspondientes en la memoria
        física se llaman <strong>marcos de página</strong>. Páginas y marcos siempre tienen el
        mismo tamaño. Las transferencias entre memoria y disco siempre se hacen por unidades de
        página completa.
      </P>

      <P>
        Mira un ejemplo concreto. El programa intenta tener acceso a la dirección 0 mediante la
        instrucción <em>MOV REG, 0</em>. La dirección virtual 0 se envía a la MMU. La MMU consulta
        su tabla y ve que esta dirección cae dentro de la página virtual 0, que abarca de 0 a 4095.
        Según su regla de correspondencia, esa página virtual 0 está mapeada actualmente al marco
        físico 2, que abarca de 8192 a 12287. La MMU transforma entonces la dirección virtual 0 en
        la dirección física 8192. Solo entonces emite la solicitud de lectura o escritura por el
        bus. Para el programa todo sigue siendo dirección 0. La MMU traduce todas las direcciones
        virtuales entre 0 y 4095 a direcciones físicas entre 8192 y 12287 sin que el programa lo
        sepa jamás.
      </P>

      <Callout tone="info" title="Analogía del traductor de salón">
        Piensa en la MMU como un traductor en un congreso internacional. El conferencista habla en
        un idioma. El traductor escucha cada frase y la convierte en tiempo real al idioma del
        oyente. El conferencista nunca se entera del idioma final. Solo nota que la gente reacciona.
        Cada acceso a memoria pasa por el traductor MMU que cambia la dirección virtual a la
        dirección física correspondiente sin que el programa se de cuenta.
      </Callout>

      <H3>Cómo Linux maneja el archivo de paginación</H3>

      <P>
        La memoria virtual es la técnica usada por los sistemas actuales para que los procesos no
        utilizados puedan albergarse en la memoria secundaria. En el caso de Linux distribución
        Ubuntu, antes de la versión 17.04 la información de paginación se almacenaba en una
        partición dedicada llamada swap. En versiones actuales se crea un archivo de paginación
        llamado swapfile almacenado en el directorio raíz del sistema de archivos. No existe
        diferencia de rendimiento entre los dos esquemas. Para conocer si tu sistema Linux usa
        partición o archivo, ejecuta <em>cat /proc/swaps</em> o consulta el archivo
        <em> /etc/fstab</em>.
      </P>

      <H3>El parámetro swappiness</H3>

      <P>
        El kernel de Linux decide enviar páginas a la swap a partir de cierto porcentaje de
        utilización de la memoria RAM. Ese umbral lo controla el administrador mediante un valor
        entre 0 y 100 almacenado en el archivo swappiness. Para consultarlo basta con escribir
        <em> cat /proc/sys/vm/swappiness</em>. El valor predeterminado en Ubuntu es 60, lo que
        significa que cuando la RAM llega al 40 por ciento de uso disponible el kernel ya empieza
        a usar la swap. Para cambiar el valor de forma temporal, ejecuta como superusuario
        <em> sysctl -w vm.swappiness=valor</em> donde valor es un número entre 0 y 100. Para
        modificarlo de forma permanente, cambia o añade la línea <em>vm.swappiness=valor</em> en
        el archivo <em>/etc/sysctl.conf</em>.
      </P>

    

      <H2>5.10 Funciones para conocer la memoria del sistema</H2>

      <P>
        Las siguientes subsecciones muestran funciones en C que permiten recabar información de
        las memorias RAM y swap del sistema, y mencionan los archivos del kernel donde está
        expuesta la información de la memoria usada por los procesos.
      </P>

      <H3>5.10.1 Función sysinfo</H3>

      <P>
        La función <em>sysinfo</em> retorna información estadística de la memoria principal, la
        memoria swap y el promedio de carga. Su prototipo es el siguiente.
      </P>

      <Code title="sysinfo">{`#include <sys/sysinfo.h>

int sysinfo(struct sysinfo *info);`}</Code>

      <P>
        Si la llamada fue exitosa, retorna 0 y deja la información en la estructura
        <em> sysinfo</em> apuntada por <em>info</em>. La estructura contiene los siguientes campos
        para GNU/Linux 2.3.23 en arquitectura i386 y para GNU/Linux 2.3.48 en todas las
        arquitecturas.
      </P>

      <Code title="struct sysinfo">{`struct sysinfo {
    long uptime;              /* segundos desde el boot */
    unsigned long loads[3];   /* 1, 5 y 15 min de carga promedio */
    unsigned long totalram;   /* tamano total de memoria principal */
    unsigned long freeram;    /* memoria principal disponible */
    unsigned long sharedram;  /* memoria compartida */
    unsigned long bufferram;  /* memoria usada por los buferes */
    unsigned long totalswap;  /* tamano total de swap */
    unsigned long freeswap;   /* swap disponible */
    unsigned short procs;     /* numero de procesos actuales */
    unsigned long totalhigh;  /* memoria alta total */
    unsigned long freehigh;   /* memoria alta disponible */
    unsigned int mem_unit;    /* tamano de la unidad en bytes */
    char _f[20-2*sizeof(long)-sizeof(int)];  /* relleno a 64 bytes */
};`}</Code>

      <P>
        La información que retorna <em>sysinfo</em> la obtiene de los archivos
        <em> /proc/meminfo</em> y <em>/proc/loadavg</em>. Recuerda que los números mostrados en la
        salida de <em>loadavg</em> indican el promedio de carga en el último minuto, en los
        últimos 5 minutos, en los últimos 15 minutos, los procesos ejecutándose actualmente sobre
        el número total de procesos existentes, y el identificador del proceso más reciente creado
        en el sistema. Para ver información detallada de cada proceso individual, entra al
        directorio <em>/proc</em>, después al número del proceso, y revisa el archivo
        <em> status</em>. Por ejemplo <em>/proc/4976/status</em>.
      </P>

      <H3>Ejemplo. Programa que obtiene información estadística del sistema</H3>

      <CodeExplain
        title="sysinfo_demo.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <sys/sysinfo.h>' },
          { code: '#define minuto 60' },
          { code: '#define hora   (minuto*60)' },
          { code: '#define dia    (hora*24)' },
          { code: '#define KB     1024' },
          { code: 'int main() {' },
          { code: '    struct sysinfo si;' },
          { code: '    sysinfo(&si);', note: 'Llena la estructura con los valores actuales del sistema. No requiere privilegios.' },
          { code: '    printf("Tiempo del sistema: %ld dias, %ld:%02ld:%02ld\\n",' },
          { code: '           si.uptime/dia,' },
          { code: '           (si.uptime%dia)/hora,' },
          { code: '           (si.uptime%hora)/minuto,' },
          { code: '           si.uptime%minuto);', note: 'Convierte segundos a dias horas minutos y segundos para presentacion humana.' },
          { code: '    printf("Total RAM: %ld\\n",  si.totalram/KB);', note: 'Memoria total en kilobytes.' },
          { code: '    printf("Libre RAM: %ld\\n",  si.freeram/KB);' },
          { code: '    printf("Swap:      %ld\\n",  si.totalswap/KB);' },
          { code: '    printf("Procesos:  %d\\n",   si.procs);' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <H3>5.10.2 Funciones mmap y munmap</H3>

      <P>
        Las funciones <em>mmap</em> y <em>munmap</em> colocan o retiran archivos o dispositivos
        dentro de la memoria del proceso. Sus prototipos son los siguientes.
      </P>

      <Code title="mmap y munmap">{`#include <sys/mman.h>

void *mmap(void *addr, size_t length, int prot, int flags,
           int fd, off_t offset);
int   munmap(void *addr, size_t length);`}</Code>

      <P>
        La función <em>mmap</em> crea una nueva asignación en el espacio de direcciones virtuales
        del proceso que la invoca. La dirección inicial sugerida para la nueva asignación va en el
        parámetro <em>addr</em>. Si pasas NULL, el kernel elige la dirección por ti. El argumento
        <em> length</em> especifica la longitud de la asignación en bytes y debe ser mayor que
        cero. Los argumentos <em>prot</em> y <em>flags</em> indican permisos y banderas de
        comportamiento. El argumento <em>fd</em> es el descriptor del archivo que vas a mapear, o
        un valor especial si quieres una zona anónima. El argumento <em>offset</em> dice desde qué
        posición del archivo empezar el mapeo.
      </P>

      <H3>Inspeccionar mapeos de un proceso desde /proc</H3>

      <P>
        Para visualizar los mapeos activos de cualquier proceso del sistema puedes consultar tres
        archivos dentro de su directorio en <em>/proc</em>. El archivo
        <em> /proc/[pid]/maps</em> muestra cada región mapeada con su dirección, permisos, offset
        y nombre. El archivo <em>/proc/[pid]/map_files</em> es un directorio simbólico con un
        enlace por cada región respaldada por archivo. El archivo <em>/proc/[pid]/smaps</em> es la
        versión detallada de <em>maps</em>, con conteo de páginas en memoria, páginas swapeadas y
        más métricas finas.
      </P>

      <H3>El mapa de la RAM física en /proc/iomem</H3>

      <P>
        Por otra parte, en <em>/proc/iomem</em> puedes ver información de las secciones en que
        está dividida la memoria RAM física. Primero entra como root y después lee el archivo donde
        se almacena la información. Un fragmento típico de salida.
      </P>

      <Code title="/proc/iomem fragmento">{`/proc$ sudo su
root@gcgero:/proc# cat iomem
00000000-00000fff : Reserved
00001000-0009d3ff : System RAM
0009d400-0009ffff : Reserved
000a0000-000bffff : PCI Bus 0000:00
000c0000-000cedff : Video ROM
000cf000-000cffff : Adapter ROM
000e0000-000fffff : Reserved
000f0000-000fffff : System ROM
00100000-1fffffff : System RAM
20000000-201fffff : Reserved
20000000-201fffff :   pnp 00:06
20200000-40003fff : System RAM
40004000-40004fff : Reserved
......
fee00000-fee00fff : Reserved
ff000000-ff000fff : pnp 00:05
ff010000-ffffffff : INT0800:00
ffb00000-ffffffff : Reserved
100000000-25f5fffff : System RAM
1bce00000-1bda031d0 :  Kernel code
1bda031d1-1be46d03f :  Kernel data
1be6f4000-1be99cfff :  Kernel bss
25f600000-25fffffff : RAM buffer`}</Code>

      <P>
        Léelo con atención. La imagen del kernel inicia en la dirección <em>0x1bce00000</em> y
        tiene un tamaño aproximado de 12 MB. Su área de datos ocupa unos 10.4 MB adicionales.
        Saber leer este archivo te da una vista de bajo nivel de qué hay físicamente en cada banda
        de tu RAM, incluyendo zonas reservadas para ROM de video, buses PCI y la propia imagen del
        kernel cargada.
      </P>


      <H2>Qué entendimos</H2>

      <P>
        Si tuvieras que explicarle este capítulo a alguien en treinta segundos, este sería el mapa
        mental completo que deberías poder recitar de memoria. Léelo lento. Cada punto resume una
        hora de confusión bien empleada.
      </P>

      <P>
        El problema de <strong>reasignación</strong> nace porque la dirección absoluta donde corre
        un programa depende de la partición donde se cargó. La solución por hardware son los
        registros base y límite. El base se suma automáticamente a cada dirección y el límite
        protege contra accesos fuera de la partición.
      </P>

      <P>
        El <strong>intercambio o swap</strong> mueve procesos enteros entre la memoria principal y
        el disco para que quepan más procesos lógicos de los que la RAM aguanta. En Linux se ve con
        el comando <em>swapon</em> y se programa desde C con <em>swapon</em> y <em>swapoff</em>.
        Las particiones fijas se complementan con particiones variables para reducir el desperdicio.
        La <strong>compactación</strong> de memoria es la solución teórica al fragmentado pero casi
        no se aplica por su costo en CPU.
      </P>

      <P>
        Los <strong>mapas de bits</strong> son la forma más sencilla de rastrear memoria. Un bit
        por unidad de asignación. Su gran limitación es que buscar k ceros consecutivos cuando
        quieres alojar un proceso de k unidades es una operación lenta. Las <strong>listas
        enlazadas</strong> son la alternativa moderna. Un nodo por región con bandera P o H,
        dirección de inicio, longitud y puntero al siguiente. Sobre la lista se aplican cuatro
        algoritmos de asignación. Primero en ajustarse, siguiente en ajustarse, mejor ajuste y
        peor ajuste. UNIX usa primero en ajustarse por su rapidez. Si separas la lista de procesos
        de la lista de huecos, ganas velocidad al asignar a cambio de complejidad al liberar.
      </P>

      <P>
        La <strong>memoria virtual</strong> permite que el tamaño combinado de código, datos y
        pila supere la RAM física. La <strong>paginación</strong> divide el espacio virtual en
        páginas del mismo tamaño que sus marcos físicos. La <strong>MMU</strong> traduce
        direcciones virtuales a físicas en cada acceso, de forma transparente para el programa. En
        Linux moderno la paginación usa un <em>swapfile</em> en el sistema de archivos en vez de
        una partición dedicada. El umbral de uso se controla con <em>vm.swappiness</em>.
      </P>

      <P>
        Para inspeccionar todo esto desde tu propio código, tienes <em>sysinfo</em> que llena una
        estructura con totales de RAM, swap, número de procesos y promedio de carga. Tienes
        <em> mmap</em> y <em>munmap</em> para crear y deshacer mapeos en tu espacio virtual.
        Tienes los archivos <em>/proc/[pid]/maps</em>, <em>/proc/[pid]/smaps</em>,
        <em> /proc/meminfo</em>, <em>/proc/loadavg</em>, <em>/proc/swaps</em> y
        <em> /proc/iomem</em> para inspeccionar el estado real del kernel sin escribir una sola
        línea de C.
      </P>
    </>
  );
}
