import { P, H2, H3, List, Code, Callout, CodeExplain, Table } from '../../components/ui/Prose';

export default function SemaforosSysV() {
  return (
    <>
      <P>
        Los <strong>semáforos de System V</strong> son una de las primeras primitivas de sincronización que UNIX
        introdujo para coordinar procesos sin parentesco. A diferencia de los semáforos POSIX, estos viven en el
        kernel como objetos identificados por una llave, se manipulan en <em>conjuntos</em> (no uno a uno) y
        persisten incluso cuando los procesos que los crearon terminan. Esto los vuelve potentes pero también
        engorrosos: cada operación pasa por una estructura intermedia y la limpieza es manual.
      </P>

      <H2>Las tres llamadas básicas</H2>
      <P>
        El API completo de semáforos System V cabe en tres funciones. Aprendido este trío, ya tienes todo el
        vocabulario.
      </P>

      <Table
        headers={['Función', 'Para qué sirve']}
        rows={[
          [<em>semget()</em>, 'Crea un conjunto nuevo o abre uno existente a partir de una llave.'],
          [<em>semop()</em>,  'Aplica una o varias operaciones P/V (atomicas) sobre el conjunto.'],
          [<em>semctl()</em>, 'Control: inicializar valores, leer estado, eliminar el conjunto (IPC_RMID).'],
        ]}
      />

      <H3>semget()</H3>
      <Code title="semget">{`int semget(key_t key, int nsems, int semflg);`}</Code>
      <List>
        <li><strong>key</strong>: la llave (típicamente de <em>ftok()</em>). Si pasas <em>IPC_PRIVATE</em>, siempre crea uno nuevo.</li>
        <li><strong>nsems</strong>: cuántos semáforos quieres en el conjunto. Aquí está la diferencia con POSIX: System V agrupa varios para que operaciones atómicas combinadas sean posibles.</li>
        <li><strong>semflg</strong>: permisos al estilo UNIX (<em>0666</em>) combinados con <em>IPC_CREAT</em> y opcionalmente <em>IPC_EXCL</em>.</li>
      </List>

      <H3>semop()</H3>
      <Code title="semop + struct sembuf">{`struct sembuf {
    unsigned short sem_num;  // índice dentro del conjunto
    short          sem_op;   // negativo: P, positivo: V, 0: espera a que llegue a 0
    short          sem_flg;  // banderas: IPC_NOWAIT, SEM_UNDO, ...
};

int semop(int semid, struct sembuf *ops, size_t nops);`}</Code>
      <P>
        <em>semop()</em> aplica un arreglo de operaciones al conjunto de forma <strong>atómica</strong>: o se aplican
        todas, o ninguna y el proceso se bloquea. Esto es lo que permite, por ejemplo, decrementar dos semáforos
        en un solo paso sin que el scheduler nos interrumpa entre medio.
      </P>

      <H3>semctl()</H3>
      <Code title="semctl">{`int semctl(int semid, int semnum, int cmd, ... /* union semun arg */);`}</Code>
      <List>
        <li><strong>cmd = SETVAL</strong>: asigna el valor inicial de un semáforo.</li>
        <li><strong>cmd = GETVAL</strong>: lee el valor actual.</li>
        <li><strong>cmd = IPC_RMID</strong>: elimina el conjunto entero. Imprescindible al final.</li>
      </List>

      <Callout tone="warn" title="union semun: la haces tú">
        Históricamente <em>sys/sem.h</em> definía <em>union semun</em>. En Linux moderno la libc dejó de hacerlo
        y ahora cada programa que lo necesite debe declararla a mano. Por eso verás esa declaración suelta al
        inicio de casi todos los ejemplos.
      </Callout>

      <H2>P y V: bautismo histórico de las operaciones</H2>
      <P>
        Las dos operaciones canónicas vienen del trabajo de Dijkstra y conservan sus iniciales en holandés:
      </P>

      <List>
        <li><strong>P (proberen, "probar"):</strong> intenta decrementar. Si el valor del semáforo es 0, el proceso se bloquea hasta que alguien lo aumente.</li>
        <li><strong>V (verhogen, "elevar"):</strong> incrementa el valor. Si hay procesos bloqueados esperando, despierta a uno.</li>
      </List>

      <P>
        Como <em>semop()</em> usa <em>sem_op</em> con un entero firmado, la convención típica es envolver ambas
        operaciones en funciones <em>P()</em> y <em>V()</em> para que el código del algoritmo se lea como en los
        libros de texto:
      </P>

      <Code title="Envolturas P y V">{`void P(int semid, int num) {
    struct sembuf op = { .sem_num = num, .sem_op = -1, .sem_flg = 0 };
    semop(semid, &op, 1);
}

void V(int semid, int num) {
    struct sembuf op = { .sem_num = num, .sem_op = 1, .sem_flg = 0 };
    semop(semid, &op, 1);
}`}</Code>

      <H2>El problema clásico: productor / consumidor</H2>
      <P>
        El ejemplo canónico para entender cómo se combinan varios semáforos. Un proceso productor genera datos y
        los deja en un buffer compartido; un proceso consumidor los retira. El reto es triple:
      </P>

      <List>
        <li><strong>Exclusión mutua:</strong> productor y consumidor no pueden tocar el buffer al mismo tiempo.</li>
        <li><strong>Sincronización de espacio:</strong> el productor no puede escribir si el buffer está lleno.</li>
        <li><strong>Sincronización de datos:</strong> el consumidor no puede leer si el buffer está vacío.</li>
      </List>

      <P>
        Para resolverlo se usan <strong>tres semáforos</strong>:
      </P>

      <Table
        headers={['Semáforo', 'Significado', 'Valor inicial']}
        rows={[
          [<em>mutex</em>,  'Acceso exclusivo a la sección crítica (el buffer)',  '1'],
          [<em>empty</em>,  'Cuántos espacios libres quedan',                      'capacidad del buffer (aquí 1)'],
          [<em>full</em>,   'Cuántos elementos hay disponibles para consumir',     '0'],
        ]}
      />

      <H3>Patrón canónico</H3>
      <Code title="Productor / Consumidor">{`// PRODUCTOR
P(empty)         // espera un espacio libre
P(mutex)         // entra a la sección crítica
   colocar dato
V(mutex)         // sale de la sección crítica
V(full)          // anuncia que hay un dato nuevo

// CONSUMIDOR
P(full)          // espera un dato disponible
P(mutex)         // entra a la sección crítica
   retirar dato
V(mutex)         // sale de la sección crítica
V(empty)         // anuncia que hay un espacio libre`}</Code>

      <Callout tone="info" title="Orden de los P: importa">
        El <em>P(empty)</em> va <strong>antes</strong> que el <em>P(mutex)</em>. Si fuera al revés, el productor
        podría tomar el mutex y luego bloquearse esperando espacio. Como el consumidor también necesita el mutex
        para liberar espacio, ambos quedarían trabados: un <em>deadlock</em> de manual.
      </Callout>

      <H2>Implementación completa</H2>
      <P>
        Esta es la implementación con tres semáforos en un conjunto y un buffer de un solo entero en memoria
        compartida. El productor envía números del 1 al 5; el consumidor los imprime.
      </P>

      <CodeExplain
        title="prod_cons.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <unistd.h>' },
          { code: '#include <sys/ipc.h>' },
          { code: '#include <sys/sem.h>', note: 'API de semáforos System V.' },
          { code: '#include <sys/shm.h>', note: 'Memoria compartida: shmget, shmat, shmctl.' },
          { code: '#include <sys/wait.h>' },
          { code: 'union semun { int val; };', note: 'Como antes, hay que declararla a mano.' },
          { code: 'void P(int semid, int num) {', note: 'P: decrementa. Se bloquea si el semáforo vale 0.' },
          { code: '    struct sembuf op;' },
          { code: '    op.sem_num = num;' },
          { code: '    op.sem_op  = -1;' },
          { code: '    op.sem_flg = 0;' },
          { code: '    semop(semid, &op, 1);' },
          { code: '}' },
          { code: 'void V(int semid, int num) {', note: 'V: incrementa. Despierta a un esperante si lo hay.' },
          { code: '    struct sembuf op;' },
          { code: '    op.sem_num = num;' },
          { code: '    op.sem_op  = 1;' },
          { code: '    op.sem_flg = 0;' },
          { code: '    semop(semid, &op, 1);' },
          { code: '}' },
          { code: 'int main(int argc, char *argv[]) {' },
          { code: '    key_t llave;' },
          { code: '    int semid, shmid;' },
          { code: '    int *buffer;', note: 'Apuntará al entero en memoria compartida.' },
          { code: '    pid_t pid;' },
          { code: '    union semun arg;' },
          { code: '    llave = ftok(argv[0], 75);', note: 'Llave deducida del propio binario. Padre e hijo la calculan igual.' },
          { code: '    shmid = shmget(llave, sizeof(int), 0666 | IPC_CREAT);', note: 'Reserva una región de tamaño int en el kernel.' },
          { code: '    buffer = (int *) shmat(shmid, NULL, 0);', note: 'Mapea la región al espacio de direcciones del proceso. Tras esto, escribir en *buffer modifica memoria visible para ambos.' },
          { code: '    semid = semget(llave, 3, 0666 | IPC_CREAT);', note: 'Crea un conjunto de TRES semáforos: mutex (0), empty (1), full (2).' },
          { code: '    arg.val = 1;' },
          { code: '    semctl(semid, 0, SETVAL, arg);', note: 'mutex = 1. Buffer libre para entrar.' },
          { code: '    arg.val = 1;' },
          { code: '    semctl(semid, 1, SETVAL, arg);', note: 'empty = 1. Hay un espacio disponible (buffer de 1 slot).' },
          { code: '    arg.val = 0;' },
          { code: '    semctl(semid, 2, SETVAL, arg);', note: 'full = 0. Aún no hay datos para consumir.' },
          { code: '    pid = fork();' },
          { code: '    if (pid == 0) {', note: 'CONSUMIDOR' },
          { code: '        for (int i = 0; i < 5; i++) {' },
          { code: '            P(semid, 2);', note: 'Espera un dato (full).' },
          { code: '            P(semid, 0);', note: 'Entra a la sección crítica (mutex).' },
          { code: '            printf("Consumidor lee: %d\\n", *buffer);' },
          { code: '            V(semid, 0);', note: 'Libera el mutex.' },
          { code: '            V(semid, 1);', note: 'Avisa que hay un espacio libre (empty).' },
          { code: '            sleep(1);' },
          { code: '        }' },
          { code: '    } else {', note: 'PRODUCTOR' },
          { code: '        for (int i = 1; i <= 5; i++) {' },
          { code: '            P(semid, 1);', note: 'Espera un espacio libre (empty).' },
          { code: '            P(semid, 0);', note: 'Entra a la sección crítica (mutex).' },
          { code: '            *buffer = i;' },
          { code: '            printf("Productor produce: %d\\n", i);' },
          { code: '            V(semid, 0);', note: 'Libera el mutex.' },
          { code: '            V(semid, 2);', note: 'Avisa que hay un dato disponible (full).' },
          { code: '            sleep(1);' },
          { code: '        }' },
          { code: '        wait(NULL);', note: 'Espera al consumidor antes de limpiar recursos.' },
          { code: '        shmctl(shmid, IPC_RMID, NULL);', note: 'Marca la memoria compartida para borrarse cuando no haya nadie pegado a ella.' },
          { code: '        semctl(semid, 0, IPC_RMID);', note: 'Elimina TODO el conjunto de semáforos. Basta con apuntar a uno, el kernel los borra juntos.' },
          { code: '    }' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <H2>Lectura del flujo</H2>
      <P>
        Si te fijas en la salida cuando lo corres, los <em>printf</em> alternan productor — consumidor —
        productor — consumidor… porque <em>empty</em> empieza en 1 y <em>full</em> en 0. Solo cabe un dato a la
        vez en el buffer, así que el productor produce uno y se bloquea hasta que el consumidor lo retire.
        Cambia los valores iniciales o el tamaño del buffer y verás cómo el ritmo se acelera.
      </P>

      <Callout tone="warn" title="No olvides limpiar">
        Si el programa muere a mitad (Ctrl+C, segfault) sin llegar a los <em>IPC_RMID</em>, el conjunto de
        semáforos y la memoria compartida quedan residentes. Lista los recursos con <em>ipcs</em> y bórralos
        con <em>ipcrm -s &lt;semid&gt;</em> o <em>ipcrm -m &lt;shmid&gt;</em>. Para programas serios, instala
        un manejador de <em>SIGINT</em> que haga la limpieza antes de salir.
      </Callout>

      <H2>System V vs POSIX: la elección práctica</H2>

      <Table
        headers={['Aspecto', 'System V', 'POSIX']}
        rows={[
          ['Identificación', 'key_t + ID', 'Nombre tipo /miSem'],
          ['Granularidad', 'Conjuntos de varios', 'Uno por semáforo'],
          ['Persistencia', 'Hasta IPC_RMID', 'Hasta sem_unlink()'],
          ['Limpieza tras crash', 'Manual (ipcrm)', 'Mejor (kernel libera al cerrar)'],
          ['Llamadas', 'semget / semop / semctl', 'sem_open / sem_wait / sem_post'],
          ['Disponibilidad', 'Heredado, en todos los UNIX', 'Más moderno, no siempre presente'],
        ]}
      />

      <Callout tone="success" title="Cuándo usar cada uno">
        Si tu sistema target ya soporta POSIX y solo necesitas semáforos individuales, los semáforos POSIX son
        más limpios y se llevan mejor con hilos. System V brilla cuando necesitas operaciones <strong>atómicas
        sobre varios semáforos a la vez</strong> (la atomicidad de <em>semop</em> con un arreglo) o cuando
        trabajas en código viejo que ya los usa. En el aula es donde más se enseñan porque exponen claramente
        la mecánica del kernel: llaves, conjuntos, persistencia.
      </Callout>
    </>
  );
}
