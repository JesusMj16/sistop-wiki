import { P, H2, H3, List, Code, Callout, CodeExplain, Table, SemaphoreFlow } from '../../components/ui/Prose';

export default function SemaforosSysV() {
  return (
    <>
      <P>
        Vamos a comenzar con una imagen muy concreta. Imagina dos cocineros que comparten una sola tabla
        de picar en una cocina pequeña. Si los dos intentan usar la tabla al mismo tiempo, se estorban,
        se cortan, y el resultado es un desastre. La solución vieja del mundo real es poner una sola
        cuchara de madera al lado de la tabla. La regla es. Si tienes la cuchara, puedes cortar. Si no
        la tienes, esperas hasta que alguien la suelte. Eso es un semáforo. La cuchara representa un
        permiso. Solo hay un permiso disponible y la regla obliga a tomarlo antes de tocar el recurso
        compartido.
      </P>

      <P>
        Los <strong>semáforos de System V</strong> son una de las primeras primitivas de sincronización
        que UNIX introdujo para resolver exactamente este problema en software. Son distintos de los
        semáforos POSIX que veremos al final de esta nota. Los de System V tienen tres características
        que hay que tener claras desde el inicio porque influyen en cómo se usan.
      </P>

      <P>
        Lo primero. Viven dentro del kernel como objetos persistentes. No mueren cuando termina el
        proceso que los creó. Sobreviven hasta que alguien los borra explícitamente. Lo segundo. Se
        manipulan siempre a través de un identificador acordado, una llave, exactamente como vimos en la
        nota anterior sobre llaves IPC. Lo tercero, y aquí está la rareza que más confunde al principio.
        No existe el concepto de semáforo suelto. Siempre se crean en <strong>conjuntos</strong>, donde
        cada conjunto puede tener uno o varios semáforos numerados con índices empezando en cero. Esto
        permite operar sobre varios semáforos en un solo paso atómico, lo cual es muy útil para evitar
        deadlocks, pero también obliga a llevar contabilidad de cuál semáforo del conjunto estás
        tocando.
      </P>

      <Callout tone="info" title="Por qué se llaman semáforos">
        El nombre lo puso Edsger Dijkstra en los años sesenta inspirado en los semáforos de tren. Un
        guarda de tren bajaba una bandera para detener al maquinista y la levantaba para dejarlo pasar.
        El semáforo de software hace lo mismo con procesos. Es una bandera que el kernel sube y baja
        según un contador. Cuando el contador es cero, el proceso se detiene. Cuando es mayor que cero,
        el proceso pasa y el contador baja una unidad.
      </Callout>

      <H2>El trío de llamadas que tienes que conocer</H2>

      <P>
        Todo el API de semáforos System V cabe en tres funciones. Cada una hace exactamente una cosa.
        <em>semget</em> consigue el conjunto. <em>semop</em> opera sobre los semáforos del conjunto, es
        decir, los baja o los sube. <em>semctl</em> hace todo lo demás. Inicializar valores, leer
        estados, borrar el conjunto. Si entiendes ese trío entiendes el noventa por ciento de System V.
      </P>

      <Table
        headers={['Función', 'Para qué sirve']}
        rows={[
          [<em>semget()</em>, 'Crea un conjunto nuevo o abre uno existente a partir de una llave.'],
          [<em>semop()</em>,  'Aplica una o varias operaciones P y V de forma atómica sobre el conjunto.'],
          [<em>semctl()</em>, 'Control general. Inicializar valores, leer estado, eliminar el conjunto con IPC_RMID.'],
        ]}
      />

      <H3>semget. Obtener el conjunto</H3>

      <Code title="semget">{`int semget(key_t key, int nsems, int semflg);`}</Code>

      <P>
        El primer argumento es la llave que ya sabemos calcular con <em>ftok</em>. El segundo es cuántos
        semáforos quieres en el conjunto. Si vas a usar uno solo pasas un 1. Si vas a coordinar varias
        cosas en paralelo puedes pedir, por ejemplo, 3 semáforos en un mismo conjunto. El tercer
        argumento son los permisos al estilo UNIX combinados con banderas. La combinación típica es
        <em> 0666 | IPC_CREAT</em>, que se lee como permisos de lectura y escritura para todo el mundo,
        más la bandera de crearlo si no existe.
      </P>

      <P>
        Si el conjunto ya existía con esa llave, <em>semget</em> simplemente te devuelve el ID
        existente. Si no existía y pediste <em>IPC_CREAT</em>, lo crea y te devuelve el ID nuevo. Si no
        existía y no pediste <em>IPC_CREAT</em>, falla y devuelve menos uno. Si pediste también la
        bandera <em>IPC_EXCL</em> junto con <em>IPC_CREAT</em>, la función falla si el conjunto ya
        existía. Eso te sirve para asegurarte de que tú eres el creador y nadie llegó antes.
      </P>

      <H3>semop. Subir y bajar el semáforo</H3>

      <Code title="semop con struct sembuf">{`struct sembuf {
    unsigned short sem_num;  // indice del semaforo dentro del conjunto
    short          sem_op;   // negativo baja P, positivo sube V, cero espera a que llegue a 0
    short          sem_flg;  // banderas. IPC_NOWAIT, SEM_UNDO, ...
};

int semop(int semid, struct sembuf *ops, size_t nops);`}</Code>

      <P>
        Esta es la llamada que más se usa porque es la que efectivamente hace la sincronización.
        <em> semop</em> recibe un arreglo de operaciones y las aplica al conjunto de manera
        <strong> atómica</strong>. Esa palabra es importante. Atómica significa que el kernel garantiza
        que las operaciones se aplican todas juntas o ninguna. No puede pasar que el scheduler
        interrumpa al proceso a la mitad del arreglo. Esto te permite, por ejemplo, bajar dos semáforos
        en un solo paso sin riesgo de deadlock por orden de bloqueo.
      </P>

      <P>
        Cada elemento del arreglo es una estructura <em>sembuf</em> con tres campos. <em>sem_num</em>
        dice cuál semáforo del conjunto vas a tocar, empezando desde el índice cero. <em>sem_op</em> es
        un entero firmado que indica la operación. Si es negativo, le restas ese valor absoluto al
        semáforo, y si el semáforo no puede bajar tanto sin volverse negativo, el proceso se bloquea
        hasta que alguien lo suba. Si es positivo, le sumas ese valor, y si hay procesos esperando, los
        despiertas. Si es cero, el proceso se bloquea hasta que el semáforo valga cero. <em>sem_flg</em>
        son banderas opcionales como <em>IPC_NOWAIT</em>, que dice no me bloquees, devuelve error si no
        se puede.
      </P>

      <H3>semctl. Inicializar, leer y destruir</H3>

      <Code title="semctl">{`int semctl(int semid, int semnum, int cmd, ... /* union semun arg */);`}</Code>

      <P>
        Esta es la navaja suiza del API. Le pasas el <em>semid</em> del conjunto, el índice del
        semáforo que te interesa, un código de comando, y opcionalmente una unión llamada <em>semun</em>
        con datos asociados al comando. Los comandos más importantes y su significado se ven mejor en
        tabla.
      </P>

      <Table
        headers={['Comando', 'Qué hace', 'Qué pones en arg']}
        rows={[
          ['SETVAL', 'Inicializa un semáforo a un valor concreto.', 'arg.val con el valor deseado'],
          ['GETVAL', 'Lee el valor actual de un semáforo. Lo devuelve la función.', 'no se usa arg'],
          ['SETALL', 'Inicializa el valor de todos los semáforos del conjunto.', 'arg.array con un arreglo de valores'],
          ['GETALL', 'Lee el valor de todos los semáforos. Los guarda en arg.', 'arg.array como buffer destino'],
          ['IPC_STAT', 'Obtiene información del conjunto en una struct.', 'arg.buf apuntando a semid_ds'],
          ['IPC_SET', 'Cambia ciertos atributos del conjunto.', 'arg.buf con los nuevos valores'],
          ['IPC_RMID', 'Destruye el conjunto entero. Imprescindible al final.', 'no se usa arg en Linux'],
          ['IPC_INFO', 'Lee límites del sistema. Usado por utilidades como ipcs.', 'arg.__buf con seminfo'],
        ]}
      />

      <H2>La unión semun. Por qué la tienes que declarar tú</H2>

      <P>
        Como acabas de ver en la tabla, distintos comandos de <em>semctl</em> esperan distintos tipos de
        datos en el último argumento. Para no tener que cambiar la firma de la función según el comando,
        el diseño original usa una <em>unión</em>. Una unión en C es una estructura donde todos los
        campos comparten la misma posición en memoria. Solo uno está vivo a la vez. Tú decides cuál
        usar según el comando que vayas a ejecutar. La unión se llama <em>semun</em>.
      </P>

      <Code title="union semun completa">{`union semun {
    int               val;     // valor para SETVAL
    struct semid_ds  *buf;     // buffer para IPC_STAT e IPC_SET
    ushort           *array;   // tabla para GETALL y SETALL
    struct seminfo   *__buf;   // buffer para IPC_INFO en Linux
} arg;`}</Code>

      <P>
        El truco está en que en Linux moderno la libc dejó de exponer esta unión por razones de
        compatibilidad histórica. Antes venía declarada en <em>sys/sem.h</em> pero ahora no. Eso
        significa que cualquier programa que use <em>semctl</em> con un comando que requiera <em>arg</em>
        tiene que declarar su propia unión <em>semun</em> antes del <em>main</em>. Cuando veas esa
        declaración suelta arriba de los ejemplos, ya sabes por qué está ahí. No es un capricho.
      </P>

      <Callout tone="info" title="Las dos estructuras hermanas. semid_ds y seminfo">
        Junto con la unión hay dos estructuras del kernel que conviene tener identificadas aunque casi
        nunca las uses directamente. <em>semid_ds</em> es la estructura de control asociada a cada
        conjunto de semáforos que existe en el sistema. Guarda información de propietario, permisos,
        número de semáforos, marca de tiempo de la última operación, y apuntadores internos. Está en
        desuso oficialmente y se ha sustituido por <em>sem_array</em> dentro del kernel, pero sigue
        existiendo por compatibilidad. <em>seminfo</em> contiene los límites del sistema. Cuántos
        semáforos máximos por conjunto, cuántos conjuntos máximos en total, etcétera. La consulta
        normal de esos valores no la hace tu programa, la hace el comando <em>ipcs</em>.
      </Callout>

      <H2>Qué pasa cuando semctl falla</H2>

      <P>
        Si la llamada a <em>semctl</em> sale bien, devuelve un entero cuyo significado depende del
        comando. Por ejemplo, <em>GETVAL</em> devuelve el valor del semáforo. Si la llamada falla,
        devuelve menos uno y deja la razón en la variable global <em>errno</em>. Los códigos de error
        más comunes que vas a ver mientras aprendes son los siguientes.
      </P>

      <Table
        headers={['Código', 'Significado']}
        rows={[
          ['EACCES', 'El proceso no tiene derechos de acceso para realizar la operación.'],
          ['EFAULT', 'La dirección que pasaste en arg.buf o arg.array no es válida. Puntero a memoria no mapeada.'],
          ['EIDRM', 'El conjunto de semáforos ya fue borrado por otro proceso entre que conseguiste el ID y lo usaste.'],
          ['EINVAL', 'El valor de semid o de cmd es incorrecto. Casi siempre semid de un conjunto ya destruido o cmd inválido.'],
          ['EPERM', 'El proceso no tiene derechos para esta operación específica, típicamente IPC_SET o IPC_RMID.'],
          ['ERANGE', 'El cmd fue SETVAL o SETALL y el valor pedido es mayor que SEMVMX, el máximo permitido por el kernel.'],
        ]}
      />

      <P>
        El patrón para manejar estos errores es siempre el mismo. Revisar el retorno de la función. Si
        es menos uno, imprimir con <em>perror</em> y salir, o intentar recuperarse según el error. En
        producción nunca debes asumir que la llamada salió bien.
      </P>

      <H2>P y V. Las dos operaciones que tienes que recordar</H2>

      <P>
        Las dos operaciones canónicas sobre un semáforo vienen del trabajo de Dijkstra y conservan sus
        iniciales en holandés. Las vas a ver escritas como letras sueltas en todos los libros y código
        académico, así que conviene fijarlas en la memoria desde el inicio. La operación
        <strong> P</strong> viene de la palabra holandesa <em>proberen</em>, que significa probar.
        Intenta decrementar el semáforo. Si el valor del semáforo es cero, el proceso se bloquea hasta
        que alguien lo aumente. Si el valor es mayor que cero, lo decrementa y la función vuelve al
        instante. La operación <strong>V</strong> viene de <em>verhogen</em>, elevar. Incrementa el
        valor del semáforo. Si hay procesos bloqueados esperando, despierta a uno de ellos.
      </P>

      <P>
        Como <em>semop</em> usa <em>sem_op</em> con un entero firmado, la convención típica es envolver
        ambas operaciones en funciones llamadas <em>P</em> y <em>V</em> para que el código del algoritmo
        se lea como los libros de texto. Sin esa envoltura el código se vuelve ilegible muy rápido.
      </P>

      <Code title="Envolturas P y V">{`void P(int semid, int num) {
    struct sembuf op = { .sem_num = num, .sem_op = -1, .sem_flg = 0 };
    semop(semid, &op, 1);
}

void V(int semid, int num) {
    struct sembuf op = { .sem_num = num, .sem_op = 1, .sem_flg = 0 };
    semop(semid, &op, 1);
}`}</Code>

      <H2>Mira la sincronización paso a paso</H2>

      <P>
        Antes de leer el ejemplo completo en código, conviene ver visualmente cómo dos procesos
        coordinan sus turnos usando un par de semáforos como banderas. La animación que viene a
        continuación muestra el patrón clásico de ping-pong. Padre e hijo se van turnando para imprimir
        usando dos semáforos como turnos. SEM_HIJO empieza en cero, lo que significa cerrado. SEM_PADRE
        empieza en uno, abierto. El padre tiene permiso de entrar primero. Cuando termina su turno,
        sube SEM_HIJO con V para despertar al hijo. El hijo entra, hace lo suyo, y al terminar sube
        SEM_PADRE con V. La pelota va y viene.
      </P>

      <SemaphoreFlow />

      <P>
        Pon atención a tres detalles visuales en la animación. Los dos cuadros del centro muestran el
        valor actual de cada semáforo en el kernel. Verde significa abierto, rojo significa cerrado.
        Las dos cajas laterales son los procesos. Cuando una caja tiene borde rojo punteado y la
        leyenda <em>z z z</em>, significa que ese proceso está dormido esperando. El bloque de salida
        en la parte de abajo va acumulando los <em>printf</em> en el orden exacto en que se ejecutan.
        Si te fijas, las líneas alternan padre, hijo, padre, hijo. Ninguna se mezcla con la otra.
        Justo eso es lo que el semáforo está garantizando.
      </P>

      <H2>El programa completo que produce ese ping-pong</H2>

      <P>
        Aquí está la implementación completa del programa que acabas de ver animado. Crea un conjunto
        con dos semáforos, los inicializa con valores opuestos para que solo uno de los dos procesos
        pueda entrar a la vez, hace <em>fork</em>, y cada rama entra en un <em>while</em> que decrementa
        un contador grande. Antes de imprimir, cada proceso baja su propio semáforo con P. Después de
        imprimir, sube el del otro con V. Esa coreografía garantiza que jamás hay dos <em>printf</em>
        ocurriendo a la vez.
      </P>

      <CodeExplain
        title="ping_pong.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <sys/ipc.h>' },
          { code: '#include <sys/sem.h>' },
          { code: '#include <unistd.h>' },
          { code: '#include <errno.h>' },
          { code: '#define SEM_HIJO  0', note: 'Damos nombres simbólicos a los índices. Cero es el semáforo del hijo.' },
          { code: '#define SEM_PADRE 1', note: 'Uno es el semáforo del padre. Ahora podemos escribir SEM_PADRE en lugar de 1.' },
          { code: 'int main(int argc, char *argv[]) {' },
          { code: '    int i = 1000000, semid;' },
          { code: '    pid_t pid;' },
          { code: '    struct sembuf operacion;' },
          { code: '    key_t llave;' },
          { code: '    llave = ftok(argv[0], \'a\');', note: 'Generamos la llave a partir del propio binario y del caracter a.' },
          { code: '    if ((semid = semget(llave, 2, IPC_CREAT | 0600)) == -1) {', note: 'Pedimos un conjunto de DOS semáforos. Permisos solo para el dueño.' },
          { code: '        perror("semget");' },
          { code: '        exit(-1);' },
          { code: '    }' },
          { code: '    semctl(semid, SEM_HIJO, SETVAL, 0);', note: 'Inicializa SEM_HIJO en 0. CERRADO. Cualquiera que haga P sobre este se duerme.' },
          { code: '    semctl(semid, SEM_PADRE, SETVAL, 1);', note: 'Inicializa SEM_PADRE en 1. ABIERTO. El padre podrá entrar primero.' },
          { code: '    if ((pid = fork()) == -1) {' },
          { code: '        perror("fork");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    } else if (pid == 0) {', note: 'Rama del HIJO. Esta es la parte que corre en el proceso hijo.' },
          { code: '        while (i) {' },
          { code: '            operacion.sem_num = SEM_HIJO;', note: 'Vamos a tocar el semáforo del hijo.' },
          { code: '            operacion.sem_op = -1;', note: 'Operación P. Baja el semáforo. Si está en 0, duerme al hijo.' },
          { code: '            operacion.sem_flg = 0;' },
          { code: '            semop(semid, &operacion, 1);', note: 'Ejecuta la operación. El hijo se duerme en la primera vuelta porque SEM_HIJO empezó en 0.' },
          { code: '            printf("Proceso hijo: %d\\n", i--);' },
          { code: '            operacion.sem_num = SEM_PADRE;', note: 'Ahora toca el semáforo del padre.' },
          { code: '            operacion.sem_op = 1;', note: 'Operación V. Sube el semáforo. Despierta al padre que estaba dormido.' },
          { code: '            semop(semid, &operacion, 1);' },
          { code: '        }' },
          { code: '        semctl(semid, 0, IPC_RMID, 0);', note: 'Al terminar, borra el conjunto de semáforos. CRÍTICO. Si se te olvida, queda residente en el kernel.' },
          { code: '    } else {', note: 'Rama del PADRE.' },
          { code: '        while (i) {' },
          { code: '            operacion.sem_num = SEM_PADRE;' },
          { code: '            operacion.sem_op = -1;', note: 'P sobre SEM_PADRE. En la primera vuelta vale 1, así que el padre pasa sin bloquearse.' },
          { code: '            operacion.sem_flg = 0;' },
          { code: '            semop(semid, &operacion, 1);' },
          { code: '            printf("Proceso padre: %d\\n", i--);' },
          { code: '            operacion.sem_num = SEM_HIJO;' },
          { code: '            operacion.sem_op = 1;', note: 'V sobre SEM_HIJO. Sube el semáforo del hijo, lo despierta para que tome su turno.' },
          { code: '            semop(semid, &operacion, 1);' },
          { code: '        }' },
          { code: '        semctl(semid, 0, IPC_RMID, 0);' },
          { code: '    }' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <P>
        Léelo despacio. La estructura de cada iteración es siempre la misma. Baja tu propio semáforo
        con P, lo que significa cierro mi puerta. Haz el trabajo protegido, en este caso el
        <em> printf</em>. Sube el semáforo del otro con V, lo que significa abro tu puerta y te
        despierto. Esa coreografía produce el ping-pong perfecto que ves en la salida. Si lanzaras el
        programa con el contador en 5 en lugar de un millón, verías exactamente diez líneas alternadas
        y sabrías de antemano cuál proceso imprime cada una.
      </P>

      <Callout tone="warn" title="El detalle del doble IPC_RMID">
        En el código aparece la llamada <em>semctl</em> con <em>IPC_RMID</em> en las dos ramas, hijo y
        padre. Esto es defensivo pero técnicamente solo uno de los dos lo va a ejecutar útilmente. El
        primero borra el conjunto. El segundo recibe error porque el conjunto ya no existe. No es
        elegante pero no rompe nada. En programas serios se suele hacer la limpieza solo en la rama del
        padre tras un <em>wait</em>, o se instala un manejador de <em>SIGINT</em> compartido.
      </Callout>

      <H2>Y ahora, los semáforos POSIX</H2>

      <P>
        System V no es la única familia de semáforos en UNIX. Existe una segunda familia, los
        <strong> semáforos POSIX</strong>, que son más modernos, más limpios de usar y se llevan mucho
        mejor con los hilos. Para cosas nuevas casi siempre vas a preferir POSIX. La razón principal es
        que se manipulan con punteros directos a estructuras de tipo <em>sem_t</em> en lugar de pasar
        por la maquinaria de llaves y conjuntos del kernel. El precio es que los semáforos POSIX no
        son tan automáticamente compartibles entre procesos sin parentesco como los de System V.
        Necesitas memoria compartida explícita o ponerles nombre en el filesystem.
      </P>

      <H3>sem_init. Crear un semáforo</H3>

      <Code title="sem_init">{`#include <semaphore.h>

int sem_init(sem_t *sem, int pshared, unsigned int value);`}</Code>

      <P>
        Esta función inicializa un semáforo sin nombre en una cierta dirección de memoria. Para
        semáforos con nombre se usa <em>sem_open</em>, pero ese caso lo dejamos para otro día. El
        argumento <em>sem</em> debe ser la dirección de una variable de tipo <em>sem_t</em> que tú
        declaraste previamente. El argumento <em>value</em> especifica el valor inicial del semáforo,
        que típicamente es cero o uno según lo quieras cerrado o abierto al arrancar.
      </P>

      <P>
        El argumento más interesante es <em>pshared</em>. Indica si este semáforo se compartirá entre
        hilos del mismo proceso o entre procesos distintos. Si vale cero, el semáforo se comparte entre
        los hilos de un proceso. Debes ubicarlo en una dirección visible para todos los hilos, lo cual
        en la práctica significa una variable global o algo asignado dinámicamente en el heap. Si vale
        distinto de cero, el semáforo se comparte entre procesos. Debes ubicarlo en una región de
        memoria compartida, creada con <em>shm_open</em> o con <em>shmget</em>. Recuerda que si creas
        un hijo con <em>fork</em>, el hijo hereda las asignaciones de memoria del padre y por tanto
        también puede acceder al semáforo.
      </P>

      <H3>sem_wait. Bajar el semáforo</H3>

      <Code title="sem_wait">{`#include <semaphore.h>

int sem_wait(sem_t *sem);`}</Code>

      <P>
        Esta es la operación P en su versión POSIX. Le pasas la dirección de la variable semáforo y la
        función intenta decrementar el valor apuntado. Si el valor es mayor que cero, lo decrementa y
        retorna de forma inmediata. Si el valor es cero, la función se bloquea hasta que el valor sea
        mayor que cero, momento en el cual lo decrementa y vuelve. También puede salir antes si llega
        una señal interrumpiendo al proceso, en cuyo caso retorna menos uno con <em>errno</em> igual a
        <em> EINTR</em>.
      </P>

      <H3>sem_post. Subir el semáforo</H3>

      <Code title="sem_post">{`#include <semaphore.h>

int sem_post(sem_t *sem);`}</Code>

      <P>
        Esta es la operación V en POSIX. Incrementa el valor apuntado por la variable semáforo. Si
        después del incremento el valor se vuelve mayor que cero y había procesos o hilos bloqueados
        en <em>sem_wait</em>, uno de ellos se despierta y se desbloquea. La elección de cuál
        despertar la hace el scheduler, no tienes garantía de orden FIFO sin opciones extra.
      </P>

      <H2>Ejemplo POSIX. Dos hilos peleando por una variable</H2>

      <P>
        El siguiente programa muestra cómo se usan los semáforos POSIX para proteger una variable
        global de la cual dos hilos modifican el valor simultáneamente. Uno la incrementa mil veces.
        El otro la decrementa mil veces. Si todo está bien sincronizado, el resultado final debe ser
        cero. La recomendación pedagógica clásica es probar el código sin el semáforo y observar cómo
        el valor final cambia cada vez que ejecutas el programa. Esa variabilidad sin razón aparente
        es el síntoma del problema clásico de carrera de datos.
      </P>

      <CodeExplain
        title="dos_hilos.c"
        lines={[
          { code: '#include <pthread.h>' },
          { code: '#include <semaphore.h>' },
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#define VALOR 1000' },
          { code: 'void *funcion1(void *valor);' },
          { code: 'void *funcion2(void *valor);' },
          { code: 'int contador = 0;', note: 'Variable global que ambos hilos van a tocar.' },
          { code: 'sem_t semaforo;', note: 'El semáforo también es global para que ambos hilos vean la misma dirección.' },
          { code: 'int main() {' },
          { code: '    pthread_t hilo1, hilo2;' },
          { code: '    pthread_attr_t attr;' },
          { code: '    sem_init(&semaforo, 0, 1);', note: 'pshared = 0 porque compartimos entre hilos. value = 1 significa el semáforo arranca ABIERTO.' },
          { code: '    pthread_attr_init(&attr);' },
          { code: '    pthread_create(&hilo1, &attr, funcion1, NULL);' },
          { code: '    pthread_create(&hilo2, &attr, funcion2, NULL);' },
          { code: '    pthread_join(hilo1, NULL);' },
          { code: '    pthread_join(hilo2, NULL);' },
          { code: '    printf("Valor de Contador = %d\\n", contador);', note: 'Con el semáforo debe salir 0 siempre. Sin él, sale cualquier número.' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
          { code: 'void *funcion1(void *valor) {' },
          { code: '    for (int i = 0; i < VALOR; i++) {' },
          { code: '        sem_wait(&semaforo);', note: 'P. Pide el permiso para tocar el contador.' },
          { code: '        contador += 1;', note: 'Esta línea es la sección crítica.' },
          { code: '        sem_post(&semaforo);', note: 'V. Devuelve el permiso para que el otro hilo pueda entrar.' },
          { code: '    }' },
          { code: '    pthread_exit(EXIT_SUCCESS);' },
          { code: '}' },
          { code: 'void *funcion2(void *valor) {' },
          { code: '    for (int i = 0; i < VALOR; i++) {' },
          { code: '        sem_wait(&semaforo);' },
          { code: '        contador -= 1;' },
          { code: '        sem_post(&semaforo);' },
          { code: '    }' },
          { code: '    pthread_exit(EXIT_SUCCESS);' },
          { code: '}' },
        ]}
      />

      <Callout tone="info" title="Por qué el semáforo aquí parece exagerado">
        La operación contador más igual uno parece atómica porque es una sola línea de C. No lo es. El
        compilador la traduce en tres instrucciones de máquina. Leer el valor de la memoria a un
        registro, sumar uno al registro, escribir el registro de vuelta a memoria. Entre cualquiera
        de esos tres pasos el scheduler puede interrumpir al hilo. Si justo después de leer interrumpe
        y deja al otro hilo correr sus tres pasos completos, cuando el primer hilo vuelva va a escribir
        un valor desactualizado y pierdes una incrementación. El semáforo convierte esos tres pasos en
        un bloque que ningún otro hilo puede atravesar a la mitad.
      </Callout>

      <H2>Sincronización de hilos usando mutex</H2>

      <P>
        Los <strong>mutex</strong>, palabra que viene de mutual exclusion, son un mecanismo de
        sincronización a nivel de hilos. Se comportan como semáforos binarios diseñados específicamente
        para proteger un recurso compartido entre hilos. Si vas a hacer exclusión mutua entre hilos,
        usar un mutex es más natural y eficiente que usar un semáforo POSIX. La API es más pequeña y
        está optimizada para el caso de tomar y soltar rápido.
      </P>

      <P>
        Usar variables mutex en hilos es sencillo. Solo tres pasos. Primero, crea e inicializa un
        mutex para cada recurso que quieras proteger, llamando a <em>pthread_mutex_init</em>. Segundo,
        cuando un hilo necesite acceder al recurso compartido, llama a <em>pthread_mutex_lock</em>
        para bloquear y llevar a cabo la exclusión mutua. La biblioteca pthread garantiza que solo un
        hilo a la vez puede mantener el mutex bloqueado. Todas las demás llamadas a
        <em> pthread_mutex_lock</em> sobre el mismo mutex tienen que esperar hasta que el hilo dueño lo
        libere. Tercero, cuando el hilo haya terminado de usar el recurso, libera el mutex llamando
        <em> pthread_mutex_unlock</em>. Si se te olvida ese tercer paso, los otros hilos quedan
        esperando para siempre. Es el bug clásico de mutex.
      </P>

      <H3>Las cuatro funciones del API de mutex</H3>

      <Code title="prototipos de mutex">{`#include <pthread.h>

pthread_mutex_t mutex;

int pthread_mutex_init(pthread_mutex_t *mutex,
                       pthread_mutexattr_t *attr);

int pthread_mutex_destroy(pthread_mutex_t *mutex);

int pthread_mutex_lock(pthread_mutex_t *mutex);

int pthread_mutex_unlock(pthread_mutex_t *mutex);`}</Code>

      <P>
        El segundo argumento de <em>pthread_mutex_init</em> es un puntero a atributos. Si no necesitas
        nada especial, le pasas <em>NULL</em> y obtienes un mutex con comportamiento por defecto. Para
        casos avanzados puedes usar <em>pthread_mutexattr_init</em> y configurar cosas como mutex
        recursivos, donde el mismo hilo puede tomarlo varias veces sin trabarse, o mutex robustos, que
        detectan cuando un hilo dueño murió sin soltarlos.
      </P>

      <H3>Ejemplo de exclusión mutua con mutex</H3>

      <P>
        En el siguiente código se crean dos hilos que entran a una sección crítica. La sección crítica
        está protegida por un mutex llamado <em>EM</em>. Cada hilo, antes de entrar, ejecuta
        <em> pthread_mutex_lock</em>. Si el otro hilo ya estaba dentro, este queda esperando. Cuando
        el primero sale y libera con <em>pthread_mutex_unlock</em>, el que estaba esperando despierta y
        entra. La estructura del código deja claros los límites de la sección crítica con comentarios
        explícitos.
      </P>

      <CodeExplain
        title="mutex_basico.c"
        lines={[
          { code: '#include <pthread.h>' },
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <unistd.h>' },
          { code: '#include <sched.h>' },
          { code: 'void *funcion1(void *valor);' },
          { code: 'void *funcion2(void *valor);' },
          { code: 'pthread_mutex_t EM;', note: 'El mutex global. EM por Exclusión Mutua.' },
          { code: 'int main(int argc, char *argv[]) {' },
          { code: '    pthread_t hilo1, hilo2;' },
          { code: '    pthread_attr_t attr;' },
          { code: '    pthread_attr_init(&attr);' },
          { code: '    pthread_create(&hilo1, &attr, funcion1, NULL);' },
          { code: '    pthread_create(&hilo2, &attr, funcion2, NULL);' },
          { code: '    pthread_join(hilo1, NULL);' },
          { code: '    pthread_join(hilo2, NULL);' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
          { code: 'void *funcion1(void *valor) {' },
          { code: '    pthread_mutex_lock(&EM);', note: 'Inicio de la sección crítica. Bloquea aquí si el otro hilo tiene el mutex.' },
          { code: '    /* trabajo con el recurso compartido */' },
          { code: '    pthread_mutex_unlock(&EM);', note: 'Fin de la sección crítica. Libera el mutex y, si hay otro hilo esperando, lo despierta.' },
          { code: '    pthread_exit(EXIT_SUCCESS);' },
          { code: '}' },
          { code: 'void *funcion2(void *valor) {' },
          { code: '    pthread_mutex_lock(&EM);' },
          { code: '    /* trabajo con el recurso compartido */' },
          { code: '    pthread_mutex_unlock(&EM);' },
          { code: '    pthread_exit(EXIT_SUCCESS);' },
          { code: '}' },
        ]}
      />

      <H2>System V contra POSIX. La elección práctica</H2>

      <Table
        headers={['Aspecto', 'System V', 'POSIX']}
        rows={[
          ['Identificación', 'key_t más un ID interno', 'Variable sem_t en memoria o nombre tipo /miSem'],
          ['Granularidad', 'Conjuntos de varios semáforos', 'Uno por variable sem_t'],
          ['Persistencia', 'Sobrevive al proceso hasta IPC_RMID', 'Muere con el proceso si es sin nombre. Con nombre persiste hasta sem_unlink'],
          ['Limpieza tras crash', 'Manual con ipcs y ipcrm', 'Casi automática. El kernel libera al cerrar'],
          ['Llamadas', 'semget, semop, semctl', 'sem_open o sem_init, sem_wait, sem_post'],
          ['Compartir entre procesos', 'Por defecto. Solo necesitan la llave', 'Requiere shm explícita o nombre en filesystem'],
          ['Disponibilidad', 'En todos los UNIX, herencia histórica', 'Más moderno. No siempre presente en sistemas legacy'],
        ]}
      />

      <Callout tone="success" title="Cuándo usar cada uno">
        Si tu sistema target soporta POSIX y solo necesitas semáforos individuales para coordinar
        hilos, los semáforos POSIX son más limpios y se integran mejor. Si la coordinación es entre
        hilos del mismo proceso y solo necesitas exclusión mutua, los mutex son aún más naturales.
        System V brilla cuando necesitas operaciones atómicas sobre varios semáforos a la vez, gracias
        a la atomicidad del arreglo de <em>sembuf</em> que pasa <em>semop</em>, o cuando trabajas en
        código viejo que ya los usa. En el aula es donde más se enseñan porque exponen claramente la
        mecánica del kernel. Llaves, conjuntos, persistencia, limpieza explícita.
      </Callout>

      <H2>Qué entendimos</H2>

      <P>
        Si tuvieras que explicarle todo esto a alguien en treinta segundos, este sería el mapa mental
        completo que deberías poder recitar de memoria. Léelo lento. Cada punto resume una hora de
        confusión bien empleada.
      </P>

      <List>
        <li>Un <strong>semáforo</strong> es un contador entero protegido por el kernel que sirve como permiso de paso. Si el contador es mayor que cero, los procesos pueden pasar y bajar el contador. Si es cero, se quedan dormidos hasta que alguien lo suba.</li>
        <li>Las dos operaciones básicas son <strong>P</strong> que baja, y <strong>V</strong> que sube. Vienen de las palabras holandesas <em>proberen</em> y <em>verhogen</em>. Las verás en todo el material académico.</li>
        <li>Los <strong>semáforos de System V</strong> viven en el kernel, se identifican por una llave, se agrupan en <strong>conjuntos</strong> con varios semáforos numerados desde cero, y persisten hasta que alguien los borra con <em>IPC_RMID</em>.</li>
        <li>El API completo son tres funciones. <em>semget</em> consigue el conjunto a partir de una llave. <em>semop</em> aplica un arreglo de operaciones P y V de forma atómica. <em>semctl</em> hace todo lo demás. Inicializar, leer, destruir.</li>
        <li>La unión <em>semun</em> es el tercer argumento de <em>semctl</em> y cambia de tipo según el comando. En Linux moderno tú la declaras a mano porque la libc ya no la expone.</li>
        <li>Los comandos clave de <em>semctl</em> son <em>SETVAL</em> para inicializar uno, <em>SETALL</em> para inicializar todos, <em>GETVAL</em> y <em>GETALL</em> para leer, e <em>IPC_RMID</em> para destruir.</li>
        <li>Si <em>semctl</em> falla, devuelve menos uno y <em>errno</em> guarda la causa. Los códigos comunes son <em>EACCES</em>, <em>EINVAL</em>, <em>EIDRM</em>, <em>EPERM</em>, <em>EFAULT</em> y <em>ERANGE</em>.</li>
        <li>Los <strong>semáforos POSIX</strong> son una API más moderna. Usan variables <em>sem_t</em> directamente en memoria. Las funciones son <em>sem_init</em>, <em>sem_wait</em>, <em>sem_post</em>. Se comparten entre hilos con valor cero en <em>pshared</em>, o entre procesos colocándolos en memoria compartida con <em>pshared</em> distinto de cero.</li>
        <li>Los <strong>mutex</strong> son semáforos binarios optimizados para hilos. Su API es <em>pthread_mutex_init</em>, <em>pthread_mutex_lock</em>, <em>pthread_mutex_unlock</em> y <em>pthread_mutex_destroy</em>. Para exclusión mutua entre hilos son más naturales que los semáforos.</li>
        <li>El patrón canónico de uso es siempre el mismo. Baja tu semáforo con P, haz el trabajo protegido, sube el del otro con V. Esa coreografía produce sincronización determinista entre procesos o hilos.</li>
        <li>Si no limpias con <em>IPC_RMID</em> al final, los conjuntos quedan residentes en el kernel visibles con <em>ipcs</em> y borrables con <em>ipcrm</em>. Acostúmbrate a manejar señales como <em>SIGINT</em> para limpiar antes de salir.</li>
      </List>
    </>
  );
}
