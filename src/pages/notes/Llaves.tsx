import { P, H2, H3, List, Code, Callout, CodeExplain, Table, IpcKeyFlow } from '../../components/ui/Prose';

export default function Llaves() {
  return (
    <>
      <P>
        Vamos a empezar con una historia cotidiana. Imagina un gimnasio donde la gente deja sus cosas en
        casilleros. Tú llegas, agarras un casillero vacío y le pones tu candado. Tu amigo llega más tarde
        a la misma hora y también quiere usar el mismo casillero contigo para compartir gastos. Pero hay
        un problema. Tu amigo no estaba contigo cuando elegiste el casillero. ¿Cómo le dices cuál es?
        Necesitan acordar de antemano una regla. Por ejemplo, siempre el casillero número 47 al fondo a la
        derecha. Ese 47 es un nombre acordado que les permite encontrarse aunque hayan llegado por
        caminos separados.
      </P>

      <P>
        Los mecanismos IPC de System V tienen exactamente el mismo problema. Son tres recursos del kernel
        que viven dentro del sistema operativo y que sirven para que varios procesos hablen entre sí. Esos
        tres recursos son las colas de mensajes, los semáforos y la memoria compartida. Los tres comparten
        la misma mecánica para que dos procesos se encuentren. Necesitan un identificador acordado, un
        número que ambos puedan deducir por su cuenta. A ese número se le llama una <strong>llave IPC</strong>,
        o <em>key_t</em> en código.
      </P>

      <Callout tone="info" title="Por qué hace falta una llave">
        Cuando usas pipes anónimas, los dos procesos comparten descriptores porque uno fue padre del otro
        y los heredó vía <em>fork</em>. Pero los recursos de System V están diseñados para conectar procesos
        sin parentesco. Dos programas que arrancaron por separado, en momentos distintos, posiblemente
        lanzados por usuarios distintos. No tienen forma de pasarse descriptores. La llave es el truco que
        usa el kernel para que ambos lleguen al mismo objeto desde rutas distintas.
      </Callout>

      <H2>Qué es realmente una llave</H2>

      <P>
        Una llave es solo un entero. Su tipo formal es <em>key_t</em>, definido en <em>sys/types.h</em>.
        Cuando un proceso quiere obtener acceso a un recurso IPC, llama a una de las funciones de la familia
        <em> get</em>. Esas funciones son <em>semget</em> para semáforos, <em>shmget</em> para memoria
        compartida y <em>msgget</em> para colas de mensajes. Las tres reciben una llave como primer
        argumento y devuelven un identificador interno del kernel.
      </P>

      <P>
        Aquí está la parte importante. La llave y el identificador no son la misma cosa. La llave es el
        nombre acordado entre los procesos, como el número 47 del casillero del ejemplo. El identificador
        es el ticket real que el kernel te entrega cuando le presentas la llave. Cada vez que reinicias el
        sistema, los identificadores cambian, pero las llaves siguen produciendo los mismos números si las
        calculas con la misma receta.
      </P>

      <List>
        <li>La <strong>llave</strong> funciona como un nombre acordado. Tanto el productor como el consumidor deben deducir la misma llave por sus propios medios.</li>
        <li>El kernel devuelve un <strong>ID interno</strong> distinto de la llave. Para semáforos lo llamamos <em>semid</em>, para memoria compartida <em>shmid</em>, para colas <em>msqid</em>. Ese ID es lo que vas a usar en todas las llamadas posteriores.</li>
        <li>El recurso vive en el kernel y <strong>persiste</strong> hasta que alguien lo destruye con la bandera <em>IPC_RMID</em>, aunque el proceso que lo creó ya haya terminado.</li>
      </List>

      <Callout tone="info" title="Llave pública, ID privado">
        Otra forma de verlo. La llave es la dirección del bar al que quedaste con tu amigo. Cualquiera
        puede llegar si conoce la dirección. El ID es el número de mesa que te asigna el mesero cuando
        entras. Solo es válido para esta visita. Si vuelves mañana, te tocará otra mesa, aunque sigas
        yendo al mismo bar.
      </Callout>

      <H2>Las dos formas de obtener una llave</H2>

      <H3>1. IPC_PRIVATE</H3>

      <P>
        Si el recurso solo lo van a usar el proceso actual y sus descendientes, puedes pasar la constante
        <em> IPC_PRIVATE</em> como llave. El kernel crea un recurso nuevo cada vez que llamas <em>semget</em>
        con esta constante. Después haces <em>fork</em> y los hijos heredan el ID. Es la opción más
        sencilla. La desventaja es que no sirve para procesos sin parentesco, que es justamente lo que
        System V quería resolver. Por eso <em>IPC_PRIVATE</em> se usa sobre todo cuando quieres semáforos
        privados a tu propio árbol de procesos.
      </P>

      <H3>2. ftok genera una llave a partir de un archivo</H3>

      <P>
        Cuando los procesos no comparten ancestro, ambos necesitan calcular la misma llave sin haberse
        comunicado antes. La solución estándar de System V es la función <em>ftok</em>. Le pasas la ruta
        de un archivo que ya existe en disco y un caracter de proyecto. <em>ftok</em> toma esos dos datos,
        los mezcla con una fórmula determinista y te devuelve un entero <em>key_t</em>. Lo importante es
        que la mezcla es determinista. Si dos procesos llaman a <em>ftok</em> con el mismo archivo y el
        mismo caracter, los dos obtienen exactamente el mismo entero. Sin coordinación previa.
      </P>

      <Code title="ftok.h">{`#include <sys/types.h>
#include <sys/ipc.h>

key_t ftok(const char *pathname, int proj_id);`}</Code>

      <List>
        <li><strong>pathname</strong>. Ruta a un archivo que exista y al que ambos procesos puedan llegar. Internamente <em>ftok</em> hace un <em>stat</em> sobre él y toma el número de inodo y el número de dispositivo del archivo.</li>
        <li><strong>proj_id</strong>. Un entero del que se usan solo los 8 bits bajos. Por convención se pasa un caracter ASCII como <em>'A'</em> o <em>'X'</em>. Permite que el mismo archivo sirva como ancla para varias llaves distintas, una por cada proyecto que las necesite.</li>
        <li><strong>Retorno</strong>. El <em>key_t</em> calculado. Si el archivo no existe o no se puede acceder, devuelve <em>-1</em> y deja la razón en <em>errno</em>.</li>
      </List>

      <Callout tone="info" title="Analogía del código postal">
        Piensa en <em>ftok</em> como una calculadora de código postal. Le das una dirección de calle
        completa y un código de zona y te devuelve un número único. Si dos personas en lugares distintos
        meten la misma calle y la misma zona, obtienen el mismo número. Pero si cambia la calle, el número
        cambia. Por eso el archivo que pasas a <em>ftok</em> tiene que ser estable durante toda la vida de
        tu programa.
      </Callout>

      <Callout tone="warn" title="Cuidado al borrar y recrear el archivo">
        La fórmula de <em>ftok</em> usa el inodo del archivo. Si alguien borra el archivo y lo recrea
        con el mismo nombre, el inodo nuevo es distinto, y por lo tanto la llave también cambia. Esto
        suele pasar cuando usas <em>/tmp/algo</em> y otro proceso o un script de limpieza barre la
        carpeta. Recomendación práctica. Usa rutas dentro de directorios estables, o el propio
        ejecutable vía <em>argv[0]</em> si tu binario no se va a reemplazar durante la corrida.
      </Callout>

      <H2>Mira el viaje de una llave paso a paso</H2>

      <P>
        Antes de leer el ejemplo en C, conviene ver visualmente qué ocurre cuando dos procesos llegan al
        mismo recurso del kernel. La animación que viene a continuación muestra cómo se ve el ciclo
        completo. Dos procesos sin parentesco arrancan en distintas terminales. Ambos llaman <em>ftok</em>
        con la misma receta. El kernel les entrega el mismo <em>semid</em>. Uno se bloquea esperando, el
        otro lo despierta, y al final uno limpia con <em>IPC_RMID</em>.
      </P>

      <List>
        <li>El bloque del centro representa al kernel. Dentro vive el archivo del filesystem, la fórmula de <em>ftok</em>, la llave resultante y el conjunto de semáforos.</li>
        <li>Las cajas de los lados son los dos procesos. Cada uno guarda en sus propias variables la llave y el <em>semid</em> que recibe. Cuando un proceso queda con borde rojo y barra punteada, está dormido esperando.</li>
        <li>El borde verde parpadeante alrededor de un bloque del kernel indica qué syscall está activa en ese paso.</li>
      </List>

      <IpcKeyFlow />

      <H2>Ejemplo en C. ftok más semáforo de rendezvous</H2>

      <P>
        Para aterrizar todo lo anterior, este es el programa más corto que sigue siendo realista. Un padre
        crea la llave, abre el semáforo en 0, hace <em>fork</em>, y el hijo queda dormido esperando una
        señal. El padre espera dos segundos, le manda la señal, espera a que el hijo termine y limpia el
        semáforo. Es la versión System V de <em>condvar.wait</em> y <em>condvar.notify</em>. Aunque aquí
        comparten descriptor por herencia, lo importante es ver el patrón. Si lanzaras dos instancias
        separadas del binario, ambas llegarían a la misma llave por <em>ftok</em> y obtendrían el mismo
        <em>semid</em>.
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
          { code: 'union semun { int val; };', note: 'En Linux moderno tienes que declarar tu propia union semun. La libc ya no la expone por compatibilidad.' },
          { code: 'int main(int argc, char *argv[]) {' },
          { code: '    key_t llave;', note: 'Aquí guardamos el resultado de ftok.' },
          { code: '    int semid;' },
          { code: '    pid_t pid;' },
          { code: '    struct sembuf op;', note: 'Estructura que describe una operacion P o V sobre uno de los semaforos del conjunto.' },
          { code: '    union semun arg;' },
          { code: '    llave = ftok(argv[0], 65);', note: 'Usamos el propio ejecutable como ancla y el caracter A que es el ASCII 65 como proj_id. Cualquier proceso que corra este mismo binario calcula la misma llave.' },
          { code: '    semid = semget(llave, 1, 0666 | IPC_CREAT);', note: 'Crea un conjunto con 1 semaforo. Si el conjunto ya existia, IPC_CREAT no estorba y semget devuelve el ID existente.' },
          { code: '    arg.val = 0;' },
          { code: '    semctl(semid, 0, SETVAL, arg);', note: 'Inicializa el semaforo numero 0 del conjunto en valor 0. Ese cero significa que cualquiera que intente bajarlo se va a quedar bloqueado.' },
          { code: '    pid = fork();' },
          { code: '    if (pid == 0) {', note: 'Rama del HIJO.' },
          { code: '        printf("Hijo: esperando senal del padre...\\n");' },
          { code: '        op.sem_num = 0;', note: 'Operamos sobre el primer y unico semaforo del conjunto.' },
          { code: '        op.sem_op  = -1;', note: 'Operacion P. Resta 1. Como el valor es 0 y no puede volverse negativo, el hijo se duerme.' },
          { code: '        op.sem_flg = 0;' },
          { code: '        semop(semid, &op, 1);', note: 'Ejecuta la operacion. El kernel duerme al proceso si no puede completarla en este instante.' },
          { code: '        printf("Hijo: senal recibida, continuando ejecucion.\\n");' },
          { code: '    } else {', note: 'Rama del PADRE.' },
          { code: '        sleep(2);', note: 'Pausa artificial para que veas claramente que el hijo esta bloqueado mientras el padre tarda.' },
          { code: '        printf("Padre: enviando senal al hijo...\\n");' },
          { code: '        op.sem_num = 0;' },
          { code: '        op.sem_op  = 1;', note: 'Operacion V. Suma 1. El kernel ve que hay alguien esperando, deja el valor en 0 y despierta al hijo.' },
          { code: '        op.sem_flg = 0;' },
          { code: '        semop(semid, &op, 1);' },
          { code: '        wait(NULL);', note: 'Esperamos a que el hijo termine para no dejar procesos zombis colgando.' },
          { code: '        semctl(semid, 0, IPC_RMID);', note: 'Destruye el semaforo. CRITICO. Si lo olvidas, el conjunto sigue vivo en el kernel y queda ocupando la llave.' },
          { code: '        printf("Padre: proceso terminado.\\n");' },
          { code: '    }' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <H2>Qué demuestra este programa</H2>

      <List>
        <li><strong>La llave es punto de encuentro</strong>. En este ejemplo el padre y el hijo ya comparten <em>semid</em> por herencia. Pero si lanzaras dos instancias separadas del binario, ambas llegarían a la misma llave por <em>ftok</em> y <em>semget</em> les devolvería el mismo <em>semid</em>. Esa es la prueba de que la llave funciona como nombre acordado.</li>
        <li><strong>El recurso vive en el kernel</strong>. Incluso si el proceso original muere sin llamar <em>IPC_RMID</em>, otro proceso puede abrir el mismo semáforo con la misma llave y seguir usándolo. El semáforo no pertenece al proceso, pertenece al sistema.</li>
        <li><strong>Hay que limpiar a mano</strong>. Esta es la queja más común contra System V. Si tu programa se cae con un crash o lo matas con <em>Ctrl C</em> antes del <em>semctl IPC_RMID</em>, el semáforo se queda residente en el kernel. El comando <em>ipcs</em> te muestra los recursos vivos. El comando <em>ipcrm</em> los borra. Acostúmbrate a revisar <em>ipcs</em> durante el desarrollo.</li>
      </List>

      <H2>Errores típicos al usar llaves</H2>

      <Table
        headers={['Síntoma', 'Causa probable', 'Cómo evitarlo']}
        rows={[
          ['ftok devuelve -1', 'El archivo del pathname no existe o no es accesible', 'Verifica con stat antes de llamar a ftok, o crea el archivo con touch antes de correr el programa'],
          ['Dos procesos no se ven', 'Cada uno usó un archivo distinto como ancla', 'Define el pathname en un header común que ambos incluyan, por ejemplo #define IPC_KEYFILE "/tmp/app.lock"'],
          ['EEXIST en semget', 'Pediste IPC_CREAT junto con IPC_EXCL y el recurso ya existía', 'Decide quién es el creador y que los demás abran sin IPC_EXCL para reusar el existente'],
          ['Recurso huérfano', 'El programa terminó por crash o señal sin llegar a IPC_RMID', 'Maneja SIGINT y SIGTERM con un handler que limpie, o ejecuta ipcrm desde shell cuando quede basura'],
        ]}
      />

      <Callout tone="success" title="Idea para llevarte">
        La llave es solo el truco para que dos procesos lleguen al mismo nombre. Una vez que ambos tienen
        el ID en mano, todo el trabajo real ocurre con <em>semop</em>, <em>shmat</em> o <em>msgsnd</em>.
        Por eso este tema parece más burocrático que algorítmico. Lo es. La complejidad interesante viene
        en la siguiente nota, cuando los semáforos se usan para coordinar varios procesos en serio.
      </Callout>

      <H2>Qué entendimos</H2>

      <P>
        Si tuvieras que explicarle todo esto a alguien en treinta segundos, este sería el mapa mental
        completo que deberías poder recitar de memoria.
      </P>

      <List>
        <li>Los recursos IPC de System V son tres. Colas de mensajes, semáforos y memoria compartida. Los tres viven dentro del kernel y persisten más allá de los procesos que los crean.</li>
        <li>Una <strong>llave</strong> de tipo <em>key_t</em> es solo un entero que sirve como nombre acordado para que dos procesos sin parentesco encuentren el mismo recurso del kernel.</li>
        <li>El kernel no usa la llave como manejador directo. Tú le presentas la llave a una función de la familia <em>get</em> como <em>semget</em>, y el kernel te devuelve un <strong>ID interno</strong> que es lo que vas a usar en todas las llamadas siguientes.</li>
        <li>Hay dos formas de obtener una llave. <em>IPC_PRIVATE</em> crea una llave única buena solo para ti y tus descendientes. <em>ftok</em> calcula una llave determinista a partir de un archivo y un caracter de proyecto, y sirve para que procesos sin parentesco lleguen al mismo número.</li>
        <li>Para que <em>ftok</em> funcione, el archivo que le pasas tiene que existir durante toda la corrida y no debe ser borrado y recreado en el medio. Si cambia el inodo, cambia la llave.</li>
        <li>El recurso IPC vive en el kernel hasta que alguien lo destruye explícitamente con la bandera <em>IPC_RMID</em>. Si tu programa termina con un crash antes de limpiar, el recurso queda como basura visible en el comando <em>ipcs</em>.</li>
        <li>El patrón de uso es siempre el mismo. Calcular la llave, llamar a la función <em>get</em> para obtener el ID, hacer las operaciones reales con ese ID, y al final destruir con <em>IPC_RMID</em>.</li>
        <li>Acostúmbrate a manejar señales como <em>SIGINT</em> con un handler que limpie los recursos antes de salir. Si no, vas a llenar el sistema de semáforos huérfanos durante el desarrollo.</li>
      </List>
    </>
  );
}
