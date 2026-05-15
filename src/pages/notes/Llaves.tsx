import { P, H2, H3, List, Code, Callout, CodeExplain, Table } from '../../components/ui/Prose';

export default function Llaves() {
  return (
    <>
      <P>
        Los mecanismos IPC heredados de <strong>System V</strong> — colas de mensajes, semáforos y memoria
        compartida — comparten un mismo problema de diseño: el kernel necesita una forma estable de identificar
        cada recurso para que dos procesos sin relación de parentesco puedan referirse al mismo objeto. A
        diferencia de las pipes anónimas, donde los descriptores se heredan por <em>fork()</em>, aquí los procesos
        empiezan sin conocerse. Necesitan un <strong>punto de encuentro</strong> público, y ese punto se
        llama una <em>llave</em> (<em>key</em>).
      </P>

      <H2>¿Qué es exactamente una llave IPC?</H2>
      <P>
        Una llave es simplemente un entero del tipo <em>key_t</em> (definido en <em>sys/types.h</em>). Cuando un
        proceso quiere crear o abrir un recurso IPC de System V, le pasa esta llave a una de las funciones
        <em> get</em>: <em>semget()</em>, <em>shmget()</em>, <em>msgget()</em>. El kernel busca en su tabla
        interna si ya existe un recurso asociado a esa llave: si lo hay, devuelve el ID del recurso; si no
        existe y se solicitó con <em>IPC_CREAT</em>, lo crea.
      </P>

      <List>
        <li>La llave funciona como un <strong>nombre acordado</strong>: el productor y el consumidor deben llegar a la misma llave por sus propios medios.</li>
        <li>El kernel devuelve un <strong>ID interno</strong> distinto de la llave (lo que llamamos <em>semid</em>, <em>shmid</em>, <em>msqid</em>). Ese ID es el que usarás en las llamadas posteriores.</li>
        <li>El recurso persiste hasta que alguien lo destruye explícitamente con <em>IPC_RMID</em>, aunque los procesos que lo crearon ya hayan terminado.</li>
      </List>

      <Callout tone="info" title="Llave vs ID: dos identificadores distintos">
        La llave es <strong>pública</strong> (cualquier proceso la puede deducir). El ID es <strong>privado del
        kernel</strong> y solo es válido dentro de la ejecución actual. Si reinicias el sistema, los IDs cambian
        pero las llaves no.
      </Callout>

      <H2>Las dos formas de obtener una llave</H2>

      <H3>1. IPC_PRIVATE</H3>
      <P>
        Si el recurso solo lo van a usar el proceso actual y sus descendientes, puedes pasar la constante
        <em> IPC_PRIVATE</em> como llave. El kernel crea un recurso nuevo cada vez y los hijos heredan el ID por
        <em> fork()</em>. Es lo más simple, pero no sirve para comunicar procesos sin parentesco — justamente
        el caso que System V buscaba resolver.
      </P>

      <H3>2. ftok() — derivar una llave de un archivo</H3>
      <P>
        Cuando los procesos no comparten ancestro, ambos necesitan calcular la misma llave de forma independiente.
        La solución estándar es <em>ftok()</em>: dado un <em>pathname</em> existente y un caracter de proyecto,
        produce un <em>key_t</em> reproducible.
      </P>

      <Code title="ftok.h">{`#include <sys/types.h>
#include <sys/ipc.h>

key_t ftok(const char *pathname, int proj_id);`}</Code>

      <List>
        <li><strong>pathname</strong>: ruta a un archivo que exista y sea accesible por ambos procesos. Internamente <em>ftok</em> hace <em>stat()</em> sobre él y mezcla el inodo y el número de dispositivo en el resultado.</li>
        <li><strong>proj_id</strong>: un entero (solo se usan los 8 bits bajos, así que conviene un caracter como <em>'A'</em> o <em>65</em>). Permite que el mismo archivo genere varias llaves distintas para proyectos diferentes.</li>
        <li><strong>Retorno</strong>: el <em>key_t</em> calculado, o <em>-1</em> si <em>stat()</em> falló (típicamente porque el archivo no existe).</li>
      </List>

      <Callout tone="warn" title="El archivo debe ser estable">
        Si dos procesos llaman a <em>ftok()</em> con el mismo <em>pathname</em>, deben ver realmente el mismo
        archivo. Si entre las dos llamadas alguien borró el archivo y lo recreó, el inodo cambia y la llave
        cambia. Por eso es común usar como ruta una constante conocida (<em>"/tmp/ipc-app"</em>) o el propio
        ejecutable (<em>argv[0]</em>) si el binario no se reemplaza durante la ejecución.
      </Callout>

      <H2>Un ejemplo mínimo: ftok + semáforo de rendezvous</H2>
      <P>
        Para aterrizar la idea, aquí tienes el ciclo completo más corto que sigue siendo útil: un padre y un hijo
        que se sincronizan mediante un semáforo. El padre crea la llave, crea el semáforo en 0, hace <em>fork()</em>,
        y el hijo queda esperando hasta que el padre haga la señal. Es la versión <em>System V</em> de un
        <em>condvar.wait/notify</em>.
      </P>

      <CodeExplain
        title="sem_ftok.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <unistd.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <sys/ipc.h>', note: 'Constantes IPC_CREAT, IPC_RMID y el tipo key_t.' },
          { code: '#include <sys/sem.h>', note: 'Prototipos de semget, semop, semctl y struct sembuf.' },
          { code: '#include <sys/wait.h>' },
          { code: 'union semun { int val; };', note: 'En Linux moderno debes declarar tu propia unión semun: la libc ya no la expone.' },
          { code: 'int main(int argc, char *argv[]) {' },
          { code: '    key_t llave;', note: 'Aquí guardamos el resultado de ftok().' },
          { code: '    int semid;' },
          { code: '    pid_t pid;' },
          { code: '    struct sembuf op;', note: 'Estructura que describe una operación P o V sobre un semáforo del conjunto.' },
          { code: '    union semun arg;' },
          { code: '    llave = ftok(argv[0], 65);', note: 'Usamos el propio ejecutable como ancla y 65 (caracter "A") como proj_id. Cualquier proceso que ejecute este binario obtendrá la misma llave.' },
          { code: '    semid = semget(llave, 1, 0666 | IPC_CREAT);', note: 'Crea un conjunto con 1 semáforo. Si ya existía, devuelve el ID existente.' },
          { code: '    arg.val = 0;' },
          { code: '    semctl(semid, 0, SETVAL, arg);', note: 'Inicializa el semáforo 0 del conjunto en 0. Un valor de 0 significa "el hijo esperará al hacer P".' },
          { code: '    pid = fork();' },
          { code: '    if (pid == 0) {', note: 'Rama del HIJO.' },
          { code: '        printf("Hijo: esperando senal del padre...\\n");' },
          { code: '        op.sem_num = 0;', note: 'Operamos sobre el primer (y único) semáforo del conjunto.' },
          { code: '        op.sem_op  = -1;', note: 'Operación P: resta 1. Como vale 0, el hijo se bloquea hasta que alguien sume.' },
          { code: '        op.sem_flg = 0;' },
          { code: '        semop(semid, &op, 1);', note: 'Ejecuta la operación. El kernel duerme al proceso si no puede completarse de inmediato.' },
          { code: '        printf("Hijo: senal recibida, continuando ejecucion.\\n");' },
          { code: '    } else {', note: 'Rama del PADRE.' },
          { code: '        sleep(2);', note: 'Pausa artificial para que veas claramente que el hijo está bloqueado.' },
          { code: '        printf("Padre: enviando senal al hijo...\\n");' },
          { code: '        op.sem_num = 0;' },
          { code: '        op.sem_op  = 1;', note: 'Operación V: suma 1. Despierta al hijo que estaba esperando.' },
          { code: '        op.sem_flg = 0;' },
          { code: '        semop(semid, &op, 1);' },
          { code: '        wait(NULL);', note: 'Espera a que el hijo termine para no dejar zombis.' },
          { code: '        semctl(semid, 0, IPC_RMID);', note: 'Destruye el semáforo. CRÍTICO: si lo olvidas, el conjunto sobrevive a tu programa y queda ocupando la llave.' },
          { code: '        printf("Padre: proceso terminado.\\n");' },
          { code: '    }' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <H2>¿Qué demuestra este programa sobre las llaves?</H2>
      <List>
        <li><strong>La llave es un punto de encuentro:</strong> aunque aquí padre e hijo comparten <em>semid</em> por herencia, si lanzaras dos instancias separadas del binario, ambas llegarían a la misma llave por <em>ftok()</em> y <em>semget()</em> les devolvería el mismo <em>semid</em>.</li>
        <li><strong>El recurso vive en el kernel:</strong> incluso si el proceso original muere sin llamar <em>IPC_RMID</em>, otro proceso puede abrir el semáforo con la misma llave y seguir usándolo.</li>
        <li><strong>Hay que limpiar:</strong> esto es la principal queja contra System V. Si tu programa termina con un crash antes del <em>semctl(..., IPC_RMID)</em>, el semáforo se queda residente. La utilidad <em>ipcs</em> los lista; <em>ipcrm</em> los borra.</li>
      </List>

      <H2>Errores típicos al usar llaves</H2>

      <Table
        headers={['Síntoma', 'Causa probable', 'Cómo evitarlo']}
        rows={[
          ['ftok() devuelve -1', 'El archivo del pathname no existe', 'Verifica con stat() o crea el archivo antes (típicamente touch /tmp/ipc-app)'],
          ['Dos procesos no se ven', 'Usaron archivos distintos como ancla', 'Definir el pathname en un header común (#define IPC_KEYFILE "/tmp/app.lock")'],
          ['EEXIST en semget()', 'IPC_CREAT | IPC_EXCL y el recurso ya existía', 'Decide quién es el "creador" y quien los demás abren sin IPC_EXCL'],
          ['Recurso huérfano', 'El programa terminó sin IPC_RMID', 'Manejar SIGINT/SIGTERM y limpiar antes de salir, o usar ipcrm desde shell'],
        ]}
      />

      <Callout tone="success" title="Idea para llevarte">
        La llave es solo un truco para que dos procesos lleguen al mismo nombre. Una vez que tienen el ID, todo
        el trabajo real ocurre con <em>semop</em>, <em>shmat</em> o <em>msgsnd</em>. Por eso este tema parece
        más burocracia que algoritmo: lo es. La complejidad interesante viene en la siguiente nota, cuando los
        semáforos se usan para coordinar varios procesos en serio.
      </Callout>
    </>
  );
}
