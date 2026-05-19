import { P, H2, H3, List, Code, Callout, CodeExplain, Table, SharedMemoryFlow } from '../../components/ui/Prose';

export default function MemoriaCompartida() {
  return (
    <>
      <P>
        Para arrancar, una imagen del mundo físico. Imagina un taller pequeño donde dos mecánicos
        trabajan en distintas mesas. Cada uno tiene su propia caja de herramientas, su propio espacio.
        Cuando necesitan intercambiar piezas, hay dos formas de hacerlo. La forma lenta. Uno toma la
        pieza, camina hasta la mesa del otro, se la entrega en la mano, regresa. Cada entrega es un
        viaje. La forma rápida. Ponen en el centro del taller una mesa común. El primero deja la
        pieza ahí. El segundo la recoge cuando quiera. Sin viajes. Sin intermediarios.
      </P>

      <P>
        Los mecanismos IPC que hemos visto hasta ahora, pipes, FIFOs y colas de mensajes, son del
        primer tipo. Cada mensaje se copia desde el proceso emisor al kernel, y luego del kernel al
        proceso receptor. Dos copias por cada operación. La <strong>memoria compartida</strong> es del
        segundo tipo. Es la mesa común del taller. El kernel reserva una región de memoria física y la
        mapea simultáneamente en el espacio virtual de varios procesos. Escribir un byte ahí es tan
        barato como modificar una variable local. El otro proceso lo ve al instante porque está
        mirando la misma memoria física.
      </P>

      <P>
        Esa velocidad tiene un precio. El kernel ya no media en cada acceso. Por tanto, tampoco
        sincroniza. Si dos procesos escriben en la misma zona al mismo tiempo, el resultado es
        impredecible. La memoria compartida casi siempre va de la mano de semáforos o algún otro
        mecanismo de sincronización. Es la primitiva más cercana al hardware crudo entre todas las
        IPC. Más potente, también más peligrosa.
      </P>

      <Callout tone="warn" title="Velocidad sin red de seguridad">
        Si dos procesos escriben en la misma posición sin coordinarse, los bytes pueden quedar
        entremezclados, parcialmente actualizados, o con valores que ninguno de los dos esperaba. La
        regla práctica es. Cualquier escritura concurrente sobre memoria compartida debe estar
        protegida con un semáforo o un mutex. Si solo lees, o si todos los procesos escriben en
        regiones distintas que tú asignaste por adelantado, puedes ahorrarte la sincronización.
      </Callout>

      <H2>Antes de las funciones, mira el ciclo completo en movimiento</H2>

      <P>
        La animación de abajo recorre las cinco fases del ciclo de vida de un segmento de memoria
        compartida. Crear, mapear en el primer proceso, mapear en el segundo, desacoplar, destruir.
        Pon atención a tres elementos visuales. El bloque central representa al kernel. Las cajas
        laterales son los procesos con sus espacios virtuales. Los cuadritos con letras dentro del
        bloque del kernel son las páginas físicas del segmento. El contador <em>shm_nattach</em>
        muestra cuántos procesos tienen ese segmento mapeado en este instante.
      </P>

      <SharedMemoryFlow />

      <H2>El API de System V para memoria compartida</H2>

      <P>
        Todo el manejo de memoria compartida se hace con cuatro funciones que siguen un ciclo de vida
        muy claro. Primero obtienes el segmento. Después lo enganchas a tu proceso. Trabajas con él
        como si fuera memoria local. Lo desenganchas cuando ya no lo usas. Al final, alguien lo
        destruye explícitamente para liberar los recursos del kernel.
      </P>

      <Table
        headers={['Función', 'Para qué sirve', 'Cuándo se llama']}
        rows={[
          [<em>shmget()</em>, 'Crea un segmento nuevo o abre uno existente a partir de una llave.', 'Una vez por proceso, al inicio'],
          [<em>shmat()</em>,  'Engancha el segmento al espacio de direcciones del proceso. Devuelve un puntero usable.', 'Inmediatamente después de shmget'],
          [<em>shmdt()</em>,  'Desengancha el segmento del proceso actual. NO lo destruye.', 'Al terminar el trabajo del proceso'],
          [<em>shmctl()</em>, 'Operaciones de control. Leer estado, modificar atributos, destruir con IPC_RMID.', 'Para configurar y al final para limpiar'],
        ]}
      />

      <H3>shmget. Obtener el segmento</H3>

      <Code title="shmget">{`#include <sys/ipc.h>
#include <sys/shm.h>

int shmget(key_t key, size_t size, int shmflg);`}</Code>

      <P>
        La función recibe tres parámetros. El primero es <em>key</em>, la llave que identifica el
        recurso IPC. Esa llave la calculas con <em>ftok</em> como vimos en la nota de llaves, o usas
        la constante <em>IPC_PRIVATE</em> si solo quieres un segmento para ti y tus descendientes. El
        segundo es <em>size</em>, el tamaño en bytes que necesitas. El kernel redondea ese número al
        múltiplo de tamaño de página más cercano hacia arriba. Si pides 100 bytes, en una máquina con
        páginas de 4096 te dará 4096. El tercero es <em>shmflg</em>, una <strong>máscara de bits</strong>
        que mezcla permisos y banderas de comportamiento.
      </P>

      <H3>Las máscaras de bits y banderas explicadas con calma</H3>

      <P>
        Aquí conviene detenerse porque es una de las cosas que más confunden al principio. El campo
        <em> shmflg</em> es un entero, pero no se usa como un número común. Se usa como una colección
        de interruptores. Cada bit del entero significa una cosa distinta. El truco está en combinar
        constantes simbólicas con el operador <em>OR</em> a nivel de bits, escrito como <em>|</em> en
        C. El resultado es un entero único que codifica todos los interruptores que querías activar.
      </P>

      <P>
        Las tres piezas más comunes que vas a combinar son las siguientes. La constante
        <em> IPC_CREAT</em> dice al kernel <em>crea el segmento si no existe</em>. Si la llave ya
        apuntaba a un segmento existente, no estorba, simplemente abre el que ya estaba. La constante
        <em> IPC_EXCL</em> se usa siempre acompañada de <em>IPC_CREAT</em>. Su efecto es modificador.
        Significa <em>si ya existe, fracasa con error en lugar de devolverme el viejo</em>. Sirve para
        garantizar que tú eres el creador y que nadie llegó antes con basura de una ejecución anterior.
        Sin esta bandera, podrías acabar usando un segmento que dejó otro programa sin limpiar.
      </P>

      <P>
        La tercera pieza son los permisos en octal, escritos con un cero al inicio. La notación
        <em> 0600</em> significa lectura y escritura solo para el dueño. <em>0660</em> añade lectura y
        escritura para el grupo. <em>0666</em> abre el segmento a todos. Estos números se interpretan
        exactamente igual que los permisos de archivos en UNIX. La combinación típica que verás en
        casi todos los programas es <em>IPC_CREAT | 0660</em>, lo cual se lee como <em>créalo si no
        existe y deja que el dueño y el grupo lo usen para leer y escribir</em>.
      </P>

      <Code title="ejemplo de invocación típica">{`shmid = shmget(IPC_PRIVATE, 4096, IPC_CREAT | 0600);`}</Code>

      <P>
        Si <em>shmget</em> tuvo éxito, devuelve un entero positivo llamado <em>shmid</em>. Ese entero
        es el manejador interno del segmento. No es un puntero todavía. Es solo una etiqueta que el
        kernel usa para llevar la contabilidad. Si la llamada falla, devuelve <em>-1</em> y deja la
        razón en <em>errno</em>. El patrón defensivo de uso es siempre el mismo. Comprueba el retorno.
        Si es menos uno, imprime con <em>perror</em> y sal del programa.
      </P>

      <H3>shmctl. Control y configuración del segmento</H3>

      <Code title="shmctl">{`#include <sys/ipc.h>
#include <sys/shm.h>

int shmctl(int shmid, int cmd, struct shmid_ds *buf);`}</Code>

      <P>
        Esta función realiza operaciones de control sobre un segmento ya creado. El primer parámetro
        es el <em>shmid</em> que devolvió <em>shmget</em>. El segundo parámetro es <em>cmd</em>, un
        código que dice qué operación quieres hacer. El tercer parámetro es un puntero a una
        estructura <em>shmid_ds</em> que sirve para leer o escribir datos del segmento, según el
        comando. Los códigos posibles son los siguientes.
      </P>

      <Table
        headers={['Comando', 'Qué hace']}
        rows={[
          ['IPC_STAT', 'Lee el estado completo de la estructura de control del segmento y lo copia en la memoria que apunta buf. Útil para inspeccionar tamaño, dueño, número de procesos atados, etcétera.'],
          ['IPC_SET', 'Modifica algunos campos de la estructura de control del segmento, tomando los nuevos valores del buf que tú pasaste. Típicamente para cambiar permisos.'],
          ['IPC_RMID', 'Borra el segmento de memoria compartida del sistema. El kernel lo elimina cuando todos los procesos lo han desacoplado.'],
          ['SHM_LOCK', 'Bloquea el segmento en memoria física. Impide que el kernel lo intercambie a disco. Solo el superusuario puede hacerlo.'],
          ['SHM_UNLOCK', 'Quita el bloqueo previo. Vuelve a permitir que el segmento sea intercambiado a disco normalmente.'],
        ]}
      />

      <P>
        Para borrar el segmento del sistema basta con escribir esta línea al final del programa.
        Pasar <em>NULL</em> o <em>0</em> en el último argumento porque no necesitamos enviar datos
        adicionales.
      </P>

      <Code title="borrar el segmento">{`shmctl(shmid, IPC_RMID, NULL);`}</Code>

      <H3>La estructura shmid_ds. Qué guarda el kernel sobre tu segmento</H3>

      <P>
        Antes de soltar el bloque de código, conviene saber qué representa. <em>shmid_ds</em> es la
        ficha de identidad que el kernel mantiene internamente para cada segmento de memoria
        compartida vivo en el sistema. Cuando usas <em>IPC_STAT</em>, el kernel copia esta ficha al
        buffer que tú le pasas. Cuando usas <em>IPC_SET</em>, lee del buffer y aplica los cambios
        permitidos. Pensar en ella como en el expediente del segmento ayuda. Tiene datos del dueño,
        datos del tamaño, marcas de tiempo y un contador de cuántos procesos lo tienen mapeado en
        este instante.
      </P>

      <Code title="struct shmid_ds">{`struct shmid_ds {
    struct ipc_perm shm_perm;    /* datos del propietario y permisos */
    size_t          shm_segsz;   /* tamaño del segmento en bytes */
    pid_t           shm_lpid;    /* PID del ultimo proceso que opero */
    pid_t           shm_cpid;    /* PID del proceso creador */
    shmatt_t        shm_nattach; /* numero de procesos atados ahora */
    time_t          shm_atime;   /* fecha de la ultima union */
    time_t          shm_dtime;   /* fecha de la ultima separacion */
    time_t          shm_ctime;   /* fecha del ultimo cambio */
};`}</Code>

      <P>
        Léelo despacio. Cada campo cuenta una parte de la historia. <em>shm_segsz</em> es el tamaño
        en bytes que el kernel reservó realmente para ti. Si pediste 100 y el kernel te dio 4096 por
        el redondeo de página, aquí aparece 4096. <em>shm_lpid</em> es el PID del último proceso que
        ejecutó alguna operación sobre este segmento. <em>shm_cpid</em> es el PID del proceso que lo
        creó. <em>shm_nattach</em> es el contador clave para la limpieza. Cuenta cuántos procesos
        tienen el segmento mapeado ahora mismo. Cuando llamas <em>IPC_RMID</em>, el segmento se
        marcará para borrado pero solo se borra realmente cuando <em>shm_nattach</em> llega a cero.
        Los tres <em>time_t</em> son marcas de tiempo automáticas que el kernel actualiza solo, útiles
        para auditoría.
      </P>

      <H3>La estructura ipc_perm. La ficha de permisos</H3>

      <P>
        Dentro de <em>shmid_ds</em> hay un campo anidado, <em>shm_perm</em>, que es de tipo
        <em> ipc_perm</em>. Esta sub-estructura guarda toda la información de control de acceso. Si
        venimos de UNIX, esto suena familiar. Es la misma idea que los permisos de archivos pero
        adaptada a recursos IPC.
      </P>

      <Code title="struct ipc_perm">{`struct ipc_perm {
    key_t          __key;  /* llave con la que se creo */
    uid_t          uid;    /* ID del usuario propietario actual */
    gid_t          gid;    /* ID del grupo propietario actual */
    uid_t          cuid;   /* ID del usuario que lo creo */
    gid_t          cgid;   /* ID del grupo que lo creo */
    unsigned short mode;   /* permisos de acceso, como en chmod */
    unsigned short __seq;  /* numero de secuencia interno */
};`}</Code>

      <P>
        El campo <em>mode</em> es el más útil para programar. Guarda los permisos en el mismo formato
        octal que usa <em>chmod</em>. La diferencia entre <em>uid</em> y <em>cuid</em> es sutil. El
        primero es el dueño actual, que puede haber cambiado con <em>IPC_SET</em>. El segundo es el
        creador original, que jamás cambia. Lo mismo aplica a <em>gid</em> y <em>cgid</em> con los
        grupos. El campo <em>__seq</em> es interno al kernel, no lo toques.
      </P>

      <H3>shmat y shmdt. Acoplar y desacoplar</H3>

      <P>
        Estas dos funciones son las que convierten un <em>shmid</em> en un puntero usable y de vuelta.
        Para unirte al espacio de direcciones virtuales de un segmento de memoria compartida se usa
        <em> shmat</em>. Para soltarlo cuando ya no lo necesitas se invoca <em>shmdt</em>. Acopla y
        desacopla, como un vagón de tren a la locomotora.
      </P>

      <Code title="shmat y shmdt">{`#include <sys/ipc.h>
#include <sys/shm.h>

void *shmat(int shmid, const void *shmaddr, int shmflg);
int   shmdt(const void *shmaddr);`}</Code>

      <P>
        La llamada a <em>shmat</em> devuelve la dirección virtual inicial del segmento dentro de tu
        proceso. A partir de ese momento, escribir en esa dirección modifica las páginas físicas que
        el kernel reservó, y todos los demás procesos atados al mismo segmento ven el cambio al
        instante. La pregunta interesante es <em>quién decide en qué dirección virtual se mapea</em>.
        La respuesta depende del segundo argumento <em>shmaddr</em>.
      </P>

      <P>
        Si pasas <em>NULL</em> o cero como <em>shmaddr</em>, le estás diciendo al kernel <em>elige tú
        dónde mapearlo en mi espacio virtual</em>. El kernel busca un hueco libre y te devuelve la
        dirección que escogió. Esta es la forma recomendada para casi todos los casos. No tienes que
        preocuparte por chocar con otras zonas mapeadas. Si pasas una dirección concreta distinta de
        cero, le estás diciendo <em>quiero que el mapeo empiece exactamente aquí</em>. Ese caso es
        raro y arriesgado. Solo tiene sentido si sabes muy bien lo que haces, por ejemplo, si quieres
        que el mismo puntero numérico funcione en varios procesos.
      </P>

      <H3>SHMLBA y el redondeo de direcciones</H3>

      <P>
        Si decidiste pasar una dirección concreta en <em>shmaddr</em>, todavía tienes que decidir qué
        pasa si esa dirección no está alineada al tamaño de página del sistema. Las máquinas modernas
        requieren que ciertos tipos de mapeo de memoria empiecen en direcciones múltiplas de una
        cantidad llamada SHMLBA, que significa <em>Shared Memory Lower Boundary Address</em>. En
        Linux típico esto coincide con el tamaño de página, normalmente 4096 bytes. La bandera
        <em> SHM_RND</em> entra en juego aquí.
      </P>

      <P>
        Si no especificas SHM_RND y pasas una dirección desalineada, <em>shmat</em> falla. Si
        especificas SHM_RND, el kernel toma la dirección que le pasaste y la redondea hacia abajo al
        múltiplo de SHMLBA más cercano. Esa es la dirección donde efectivamente mapea el segmento.
      </P>

      <Code title="ejemplo visual del redondeo SHM_RND">{`Pides:       0x7f3a1234 5678
SHMLBA:                 4096 (0x1000)
Redondeo abajo:  0x7f3a1234 5000   <- aqui mapea

La direccion final es el primer multiplo de 4096
menor o igual a la que pediste.`}</Code>

      <P>
        Cuando ya terminaste de usar el segmento, llamas <em>shmdt</em> pasándole el puntero que te
        devolvió <em>shmat</em>. El kernel desmapea el segmento de tu espacio virtual. Importante.
        <em> shmdt</em> no destruye el segmento. Solo lo desacopla de tu proceso. Otros procesos
        atados siguen viéndolo. Las páginas físicas siguen vivas con los datos intactos. Para destruir
        de verdad necesitas <em>IPC_RMID</em>.
      </P>

      <Callout tone="info" title="shmdt no borra. IPC_RMID sí">
        Es el error más común. La gente llama <em>shmdt</em> creyendo que limpia el segmento. No es
        así. <em>shmdt</em> es como bajarse del tren. El tren sigue su camino. <em>IPC_RMID</em> es
        ordenar que el tren entero se desmantele. Y el desmantelamiento solo ocurre cuando el último
        pasajero se bajó. Es decir, cuando <em>shm_nattach</em> llega a cero.
      </Callout>

      <H2>El ciclo de vida en una sola página de código</H2>

      <P>
        Después de todo lo anterior, el patrón de uso queda muy compacto. Una página de código resume
        la vida entera de un segmento de memoria compartida. Léelo varias veces hasta que se sienta
        natural. Esta plantilla cambia muy poco entre programas reales.
      </P>

      <Code title="plantilla de ciclo de vida">{`/* 1. Obtener la llave acordada y crear o abrir el segmento */
key_t llave = ftok("/ruta/anclaje", 'X');
int   shmid = shmget(llave, tamano, IPC_CREAT | 0660);

/* 2. Acoplar al espacio virtual y trabajar */
void *region = shmat(shmid, NULL, 0);
/*    desde aqui, usar region como memoria propia    */

/* 3. Limpiar al terminar */
shmdt(region);                       /* desacopla este proceso */
shmctl(shmid, IPC_RMID, NULL);       /* destruye el segmento */`}</Code>

      <H2>Ejemplo completo. Padre genera matriz, hijo calcula determinante</H2>

      <P>
        Para verlo en acción, un programa donde el padre genera una matriz aleatoria de NxN y la deja
        en memoria compartida. El hijo la lee, calcula su determinante por expansión de cofactores e
        imprime el resultado. El padre espera y luego limpia. Lo interesante no es solo el uso de
        memoria compartida sino el detalle estructural. En vez de mapear un buffer amorfo de bytes,
        se define un <em>struct</em> que contiene todo lo que el hijo necesita. El tamaño <em>n</em> y
        la matriz. Esto es típico en programas reales. Imponer un esquema a la zona compartida la
        vuelve mucho más manejable.
      </P>

      <Code title="estructura compartida">{`#define MAX_N 8

typedef struct {
    int    n;
    double mat[MAX_N][MAX_N];
} MatrizCompartida;`}</Code>

      <Callout tone="warn" title="Tamaño fijo, menos problemas">
        Definir <em>MAX_N</em> y reservar la matriz como un arreglo estático evita una clase entera
        de errores. Si la dimensión fuera variable, padre e hijo tendrían que ponerse de acuerdo
        sobre cómo interpretar los bytes y cómo calcular los desplazamientos dentro del buffer. Con
        tamaño fijo, el puntero al <em>struct</em> sirve exactamente igual en ambos procesos. El
        layout de memoria es idéntico porque el compilador es el mismo y el <em>struct</em> está
        definido en un header compartido.
      </Callout>

      <CodeExplain
        title="determinante.c. núcleo del programa"
        lines={[
          { code: 'key_t clave = ftok("/tmp", \'D\');', note: 'Llave derivada de /tmp con el caracter D como proyecto. /tmp casi siempre existe en cualquier sistema UNIX.' },
          { code: 'int shmid = shmget(clave, sizeof(MatrizCompartida),' },
          { code: '                   IPC_CREAT | IPC_EXCL | 0660);', note: 'Crea el segmento. IPC_EXCL hace que falle si ya existe. Útil para detectar restos de ejecuciones previas que no limpiaron.' },
          { code: 'MatrizCompartida *shm = (MatrizCompartida *)shmat(shmid, NULL, 0);', note: 'Mapea el segmento en este proceso. shm ahora apunta a memoria visible para cualquier proceso que adjunte el mismo shmid.' },
          { code: 'srand((unsigned)time(NULL));' },
          { code: 'shm->n = n;', note: 'El padre escribe el tamaño en el struct compartido.' },
          { code: 'for (int i = 0; i < n; i++)' },
          { code: '    for (int j = 0; j < n; j++)' },
          { code: '        shm->mat[i][j] = (double)(rand() % 20 + 1);', note: 'El padre llena la matriz con números aleatorios entre 1 y 20.' },
          { code: 'pid_t pid = fork();', note: 'Tras el fork, el hijo hereda el mismo mapeo de memoria. Tanto el shmid como el puntero shm son válidos en ambos procesos.' },
          { code: 'if (pid == 0) {', note: 'Rama del HIJO. Lee la matriz y calcula.' },
          { code: '    double det = determinante(shm->mat, shm->n);' },
          { code: '    printf("Determinante = %.4f\\n", det);' },
          { code: '    shmdt(shm);', note: 'El hijo se desacopla del segmento. No lo destruye. Esa tarea es del padre.' },
          { code: '    exit(EXIT_SUCCESS);' },
          { code: '} else {', note: 'Rama del PADRE. Espera y limpia.' },
          { code: '    int estado;' },
          { code: '    waitpid(pid, &estado, 0);', note: 'Bloquea hasta que el hijo termine. Sin esto, podríamos liberar la memoria mientras el hijo aún la usa.' },
          { code: '    shmdt(shm);' },
          { code: '    shmctl(shmid, IPC_RMID, NULL);', note: 'Marca el segmento para destrucción. El kernel lo libera cuando shm_nattach llega a cero. En este punto, nadie más está atado.' },
          { code: '}' },
        ]}
      />

      <H2>Por qué este ejemplo no necesitó semáforos</H2>

      <P>
        Aunque dijimos que la memoria compartida no se sincroniza sola, este ejemplo funciona sin
        semáforos. El truco está en el orden riguroso de las operaciones. El padre llena la matriz
        completa <em>antes</em> de hacer <em>fork</em>. El hijo solo lee, nunca escribe. El padre
        espera con <em>waitpid</em> a que el hijo termine antes de destruir el segmento. Cada acceso
        a la memoria compartida ocurre en una fase distinta del tiempo. Escritura, fork, lectura,
        wait, destrucción. Como no hay solapamiento, no hay riesgo de carrera. En cuanto varios
        procesos quieran escribir al mismo tiempo o intercalarse, harán falta semáforos o mutex.
      </P>

      <H2>Cálculo del determinante. El algoritmo del hijo</H2>

      <P>
        Como bono, el algoritmo del hijo es un buen ejemplo de recursión. Expansión de cofactores por
        la primera fila. Los casos base son 1x1 y 2x2 que se resuelven directamente. Para N mayor que
        2 se construye la submatriz quitando la fila cero y la columna actual, y se llama a la propia
        función recursivamente sobre esa submatriz. El signo del cofactor alterna positivo en
        columnas pares, negativo en impares.
      </P>

      <Code title="determinante recursivo">{`double determinante(double m[MAX_N][MAX_N], int n)
{
    if (n == 1) return m[0][0];
    if (n == 2) return m[0][0]*m[1][1] - m[0][1]*m[1][0];

    double det = 0.0;
    double sub[MAX_N][MAX_N];

    for (int col = 0; col < n; col++) {
        /* Submatriz: quitar fila 0 y columna col */
        for (int i = 1; i < n; i++) {
            int k = 0;
            for (int j = 0; j < n; j++) {
                if (j == col) continue;
                sub[i-1][k++] = m[i][j];
            }
        }
        double signo = (col % 2 == 0) ? 1.0 : -1.0;
        det += signo * m[0][col] * determinante(sub, n-1);
    }
    return det;
}`}</Code>

      <P>
        Este algoritmo es O de N factorial. Por eso el ejemplo limita N menor que 8. Para algo serio
        existen algoritmos mucho mejores, como eliminación gaussiana en O de N al cubo. Pero para
        explicar recursión y cofactores, esta versión es la más limpia didácticamente.
      </P>

      <Callout tone="success" title="Lo que demuestra el ejemplo">
        La memoria compartida es la primitiva más cercana al hardware entre todas las IPC. Dos
        procesos viendo la misma RAM física al mismo tiempo. Si le añades semáforos para coordinar
        accesos concurrentes, tienes en tus manos todo lo necesario para implementar buffers
        circulares de alta velocidad, caches compartidas entre procesos, productor consumidor con
        buffers grandes, e incluso bases de datos en memoria que viven entre varios procesos del
        mismo nodo. Es la herramienta más poderosa del catálogo IPC clásico de UNIX.
      </Callout>

      <H2>Qué entendimos</H2>

      <P>
        Si tuvieras que explicarle memoria compartida a alguien en treinta segundos, este sería el
        mapa mental completo que deberías poder recitar de memoria. Léelo lento. Cada punto resume
        una hora de confusión bien empleada.
      </P>

      <List>
        <li>La <strong>memoria compartida</strong> es el mecanismo IPC más rápido porque elimina las copias intermedias del kernel. Dos o más procesos mapean las mismas páginas físicas en su espacio virtual y ven los cambios al instante.</li>
        <li>El precio de esa velocidad es que el kernel no sincroniza nada. Si varios procesos escriben simultáneamente, los resultados son impredecibles. Casi siempre se usa junto con semáforos o mutex.</li>
        <li>El API de System V tiene cuatro funciones. <em>shmget</em> obtiene el segmento. <em>shmat</em> lo acopla a tu proceso. <em>shmdt</em> lo desacopla. <em>shmctl</em> hace control general, incluido el destruir con <em>IPC_RMID</em>.</li>
        <li>El parámetro <em>shmflg</em> de <em>shmget</em> es una máscara de bits. Combinas permisos en octal como <em>0660</em> con banderas como <em>IPC_CREAT</em> y <em>IPC_EXCL</em> usando el operador <em>OR</em>. La combinación típica es <em>IPC_CREAT | 0660</em>.</li>
        <li>El kernel guarda toda la información del segmento en una estructura llamada <em>shmid_ds</em>. Dentro de ella, <em>shm_nattach</em> cuenta cuántos procesos lo tienen mapeado en este instante. Esa cuenta es la que decide cuándo el segmento se destruye realmente tras un <em>IPC_RMID</em>.</li>
        <li>Dentro de <em>shmid_ds</em> hay una sub estructura <em>ipc_perm</em> con la información de propietario, creador y permisos. Su campo <em>mode</em> usa el mismo formato octal que <em>chmod</em>.</li>
        <li>Los comandos posibles de <em>shmctl</em> son <em>IPC_STAT</em> para leer el estado, <em>IPC_SET</em> para modificar atributos, <em>IPC_RMID</em> para destruir, y <em>SHM_LOCK</em> con <em>SHM_UNLOCK</em> para anclar el segmento en RAM.</li>
        <li>La función <em>shmat</em> devuelve un puntero al inicio del segmento dentro de tu espacio virtual. Si pasas <em>NULL</em> en <em>shmaddr</em>, el kernel elige la dirección. Si pasas una dirección concreta junto con la bandera <em>SHM_RND</em>, el kernel la redondea hacia abajo al múltiplo de <em>SHMLBA</em> más cercano.</li>
        <li><em>shmdt</em> solo desacopla el segmento de tu proceso. NO lo destruye. Para destruir hace falta <em>shmctl</em> con <em>IPC_RMID</em>. Y el segmento solo desaparece de verdad cuando el último proceso atado se desacopla.</li>
        <li>Si olvidas el <em>IPC_RMID</em>, el segmento queda residente en el kernel visible con el comando <em>ipcs</em> y borrable manualmente con <em>ipcrm</em>. En programas serios conviene instalar un manejador de <em>SIGINT</em> que limpie antes de salir.</li>
        <li>El patrón de vida es siempre el mismo. Calcular llave, crear o abrir con <em>shmget</em>, acoplar con <em>shmat</em>, trabajar con el puntero, desacoplar con <em>shmdt</em>, destruir con <em>shmctl IPC_RMID</em>.</li>
      </List>
    </>
  );
}
