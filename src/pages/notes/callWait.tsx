import { P, H2, H3, List, Code, Callout, CodeExplain, WaitTimeline, WaitpidMatrix } from '../../components/ui/Prose';

export default function callWait() {
  return (
    <>
      <P>
        Hasta ahora hemos visto cómo se crea un proceso con <em>fork()</em>. Pero crear no es todo: una vez
        que padre e hijo están corriendo en paralelo, surge una pregunta incómoda: <strong>¿qué pasa con
        el padre mientras el hijo trabaja?</strong> Y todavía más, <strong>¿cómo se entera el padre de que
        su hijo terminó, y con qué resultado?</strong> Aquí entra en escena la llamada al sistema
        <em> wait()</em>, junto con su prima más detallada <em>waitpid()</em>. Ambas están pensadas para
        que el padre pueda <em>sincronizarse</em> con los hijos que él mismo creó.
      </P>

      <H2>Después de fork(), padre e hijo viven sus propias vidas</H2>
      <P>
        Tras invocar <em>fork()</em>, ambos procesos continúan ejecutándose <strong>de manera concurrente</strong>
        desde la instrucción inmediatamente posterior a la llamada. Esto significa que cualquiera de los dos
        puede terminar primero, y el sistema operativo NO impone ningún orden por defecto. Visto de otra forma,
        el padre podría:
      </P>
      <List>
        <li>Terminar mucho antes que el hijo. En ese caso, el hijo queda huérfano y el kernel lo entrega al proceso <em>init</em> o <em>systemd</em> (PID 1).</li>
        <li>Terminar mucho después que el hijo. En ese caso, si el padre no recoge la información de salida del hijo, este queda en estado <strong>zombie</strong>.</li>
        <li>Coincidir en el tiempo o intercalarse de forma impredecible. El planificador del kernel decide.</li>
      </List>

      <H2>La idea central de wait()</H2>
      <P>
        Piensa en <em>wait()</em> como una <strong>sala de espera</strong>. El padre entra y dice al kernel:
        “No quiero seguir haciendo nada hasta que <em>alguno</em> de mis hijos termine. Avísame y dame su
        resultado.” El kernel acepta el trato: pone al padre a dormir (lo retira de la cola de procesos
        listos para correr) y, cuando un hijo termine, lo despierta entregándole un código que describe
        qué pasó con ese hijo.
      </P>
      <P>
        Esa simple idea resuelve cuatro problemas a la vez:
      </P>
      <List>
        <li><strong>Sincronización</strong>: el padre no avanza hasta que el hijo termine.</li>
        <li><strong>Códigos de salida</strong>: el padre puede recuperar el valor que el hijo devolvió mediante <em>exit()</em> o <em>return</em>.</li>
        <li><strong>Limpieza</strong>: el kernel borra la entrada del hijo de la tabla de procesos, evitando que se acumulen zombies.</li>
        <li><strong>Detección de fallos</strong>: si el hijo terminó por una señal (por ejemplo, un fallo de segmentación), el padre puede enterarse y reaccionar.</li>
      </List>

      <H2>Prototipos en C</H2>
      <P>
        Las dos llamadas viven en <em>&lt;sys/wait.h&gt;</em> y sus prototipos son:
      </P>
      <Code title="wait.h">{`#include <sys/types.h>
#include <sys/wait.h>

pid_t wait(int *stat_loc);
pid_t waitpid(pid_t pid, int *wstatus, int options);`}</Code>
      <P>
        La diferencia salta a la vista: <em>wait()</em> es minimalista, recibe solo un apuntador donde el
        kernel deja la información de terminación. <em>waitpid()</em> es más expresiva, recibe además qué
        hijo concreto te interesa y un campo de opciones para afinar el comportamiento.
      </P>

      <Callout tone="info" title="¿Cuándo wait() retorna realmente?">
        <em>wait()</em> bloquea al padre hasta que ocurra <strong>uno</strong> de estos tres eventos:
        que uno de los hijos termine; que un hijo se detenga; o que el propio padre reciba una señal que interrumpa la llamada. Si el padre nunca tuvo hijos, <em>wait()</em>
        retorna inmediatamente con error (errno = ECHILD) en vez de bloquearse para siempre. Lo mismo si
        algún hijo ya terminó antes de que llamaras a <em>wait()</em>: la llamada regresa sin bloquearse.
      </Callout>

      <H2>El recorrido de un wait(), paso a paso</H2>
      <P>
        Antes de leer más código, recorre la siguiente animación. Cada paso muestra qué hace el padre,
        qué hace el hijo y qué está haciendo el kernel por debajo. Es importante notar cuándo aparece
        el famoso estado <strong>ZOMBIE</strong> y cuándo el kernel lo limpia.
      </P>

      <WaitTimeline />

      <H2>Valores de retorno y errores típicos</H2>
      <P>
        Cuando <em>wait()</em> retorna debido a la terminación o detención de un hijo:
      </P>
      <List>
        <li>Devuelve un <strong>entero positivo</strong>: el PID del hijo que se acaba de recoger. Es útil cuando tienes varios hijos vivos: te dice exactamente cuál atrapaste.</li>
        <li>Devuelve <strong>-1</strong> en caso de error y la variable global <em>errno</em> queda con un código que describe la causa.</li>
      </List>
      <P>Los dos valores de <em>errno</em> que casi siempre verás son:</P>
      <List>
        <li><strong>ECHILD</strong>: el proceso que llamó <em>wait()</em> no tiene (o ya no le quedan) hijos a quien esperar. Es la señal típica de “terminé de recoger a todos”.</li>
        <li><strong>EINTR</strong>: la llamada fue interrumpida porque al padre le llegó una señal. Es habitual: el patrón canónico es reintentar el <em>wait()</em> en un bucle mientras <em>errno == EINTR</em>.</li>
      </List>

      <H2>Decodificando el estado de terminación</H2>
      <P>
        El entero al que apunta <em>stat_loc</em> (o <em>wstatus</em>, según la llamada) <strong>no es el código
        de salida</strong> tal cual. El kernel empaqueta varios trozos de información dentro de ese entero:
        si el hijo salió normalmente, qué código devolvió, si murió por señal, qué señal lo mató, si se
        detuvo, si fue volcado a un <em>core dump</em>, etc. Para extraer cada pedazo, <em>&lt;sys/wait.h&gt;</em>
        define <strong>macros</strong>:
      </P>
      <List>
        <li><strong>WIFEXITED(status)</strong>: verdadero si el hijo terminó normalmente, es decir, ejecutó <em>exit()</em>, <em>_exit()</em> o retornó desde <em>main</em>.</li>
        <li><strong>WEXITSTATUS(status)</strong>: solo tiene sentido si <em>WIFEXITED</em> fue verdadero. Devuelve los 8 bits menos significativos del valor entregado a <em>exit()</em>. Por eso convencionalmente los códigos de salida se limitan al rango 0..255.</li>
        <li><strong>WIFSIGNALED(status)</strong>: verdadero si el hijo terminó porque le llegó una señal que no estaba siendo capturada (por ejemplo, SIGSEGV o un <em>kill -9</em>).</li>
        <li><strong>WTERMSIG(status)</strong>: solo tiene sentido si <em>WIFSIGNALED</em> fue verdadero. Devuelve el número de la señal culpable de la muerte del hijo.</li>
      </List>


      <H2>Ejemplo. El esqueleto típico padre + wait()</H2>
      <P>
        Vamos al patrón que vas a repetir cientos de veces: un padre que crea un hijo, le pide al kernel
        que lo espere y luego analiza el resultado.
      </P>

      <CodeExplain
        title="wait_basico.c"
        lines={[
          { code: '#include <sys/types.h>' },
          { code: '#include <sys/wait.h>', note: 'Aquí viven wait(), waitpid() y las macros WIFEXITED, WEXITSTATUS, etc.' },
          { code: '#include <unistd.h>', note: 'fork().' },
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: 'int main(void) {' },
          { code: '    pid_t hijo = fork();', note: 'Creamos el hijo. A partir de aquí hay dos procesos.' },
          { code: '    if (hijo < 0) { perror("fork"); return 1; }', note: 'Camino de error. Sin él, podríamos bloquearnos esperando un hijo que jamás existió.' },
          { code: '    if (hijo == 0) {', note: 'Camino del hijo.' },
          { code: '        /* HIJO: hace su trabajo y termina con un código */' },
          { code: '        return 42;', note: 'El padre recibirá ese 42 a través de WEXITSTATUS. Por convención, 0 = éxito, distinto de 0 = error.' },
          { code: '    }' },
          { code: '    /* PADRE */' },
          { code: '    int status;', note: 'Aquí el kernel dejará la información de terminación codificada.' },
          { code: '    pid_t recogido = wait(&status);', note: 'Bloquea hasta que ALGUN hijo termine. Si retorna -1, hubo error (ECHILD si ya no había hijos).' },
          { code: '    if (recogido < 0) { perror("wait"); return 1; }' },
          { code: '    if (WIFEXITED(status)) {', note: 'Solo si el hijo terminó normalmente tiene sentido leer WEXITSTATUS.' },
          { code: '        printf("Hijo %d salio con %d\\n", recogido, WEXITSTATUS(status));' },
          { code: '    } else if (WIFSIGNALED(status)) {', note: 'Si el hijo murió por señal, WEXITSTATUS no sirve.' },
          { code: '        printf("Hijo %d murio por senal %d\\n", recogido, WTERMSIG(status));' },
          { code: '    }' },
          { code: '    return 0;' },
          { code: '}' },
        ]}
      />

      <Callout tone="success" title="Patrón mental">
        Por cada <em>fork()</em> que hagas, escribe mentalmente un <em>wait()</em> que lo limpie. Si no,
        producirás zombies o procesos huérfanos. Esta regla aplica a shells, supervisores, gestores de
        tareas y a cualquier servidor que delegue trabajo en procesos hijos.
      </Callout>

      <H2>waitpid(): elige qué hijo esperar y cómo esperarlo</H2>
      <P>
        Cuando tienes <strong>varios hijos</strong> y solo te interesa uno en particular, o cuando no
        quieres bloquearte para nada, <em>wait()</em> se queda corto. Para esos casos existe
        <em> waitpid()</em>, que añade dos parámetros: el primero (<em>pid</em>) selecciona qué hijos
        cuentan, y el tercero (<em>options</em>) modifica el comportamiento de la espera.
      </P>

      <H3>El parámetro pid: cuatro posibles significados</H3>
      <P>
        El truco mental aquí es que el valor de <em>pid</em> <strong>no es un solo número</strong>: es un
        selector. Según el rango en el que caiga, el kernel lo interpreta diferente.
      </P>
      <List>
        <li><strong>pid = -1</strong>: espera por <em>cualquier</em> hijo. Es equivalente a <em>wait()</em>.</li>
        <li><strong>pid &gt; 0</strong>: espera por el hijo cuyo PID sea exactamente ese valor.</li>
        <li><strong>pid = 0</strong>: espera por cualquier hijo cuyo grupo de procesos (PGID) sea igual al del padre.</li>
        <li><strong>pid &lt; 0</strong> (y distinto de -1): espera por cualquier hijo cuyo PGID sea igual al valor absoluto de <em>pid</em>.</li>
      </List>

      <P>
        Para que esto se sienta tangible, juega con el siguiente componente. Selecciona el modo y mira
        qué hijos cumplirían el criterio. Activa <em>WNOHANG</em> para ver cómo cambia el resultado
        cuando ya no quieres bloquearte.
      </P>

      <WaitpidMatrix />

      <H3>El parámetro options: afinando el comportamiento</H3>
      <P>
        El tercer parámetro de <em>waitpid()</em> es un conjunto de banderas combinables con OR bit a
        bit. Las que más vas a encontrar son:
      </P>
      <List>
        <li><strong>WEXITED</strong>: la llamada considera a los hijos que ya hayan terminado. Es el comportamiento por defecto.</li>
        <li><strong>WSTOPPED</strong>: incluye a los hijos que hayan sido <em>detenidos</em> por una señal (por ejemplo, SIGSTOP). No es lo mismo que terminados.</li>
        <li><strong>WNOHANG</strong>: si ningún hijo elegible ha terminado todavía, <em>waitpid()</em> <strong>no se bloquea</strong>: retorna 0 al instante. Es la base de los <em>reapers</em> no bloqueantes.</li>
        <li><strong>WNOWAIT</strong>: lee la información del hijo pero <strong>no</strong> lo borra de la tabla de procesos. Permite varias “lecturas” del estado.</li>
        <li><strong>WUNTRACED</strong>: hace que la llamada retorne también si un hijo se ha detenido, aunque no estuviera siendo trazado por un depurador.</li>
        <li><strong>WCONTINUED</strong>: hace que la llamada retorne si un hijo previamente detenido <em>reanudó</em> su ejecución tras recibir SIGCONT.</li>
      </List>

      <Callout tone="info" title="Detalle fino con SIGCHLD">
        Las banderas <em>WUNTRACED</em> y <em>WCONTINUED</em> <strong>solo surten efecto</strong> si el
        manejador de la señal <em>SIGCHLD</em> NO tiene activada la bandera <em>SA_NOCLDSTOP</em>. Si la
        tienes activada, le estás pidiendo al kernel que no te avise por hijos detenidos, así que estas
        banderas se vuelven inútiles. Si nunca has tocado <em>sigaction</em>, no te preocupes: el
        comportamiento por defecto deja todo funcionando.
      </Callout>

      <H2>Ejemplo. Esperar a un hijo concreto con waitpid()</H2>
      <CodeExplain
        title="waitpid_especifico.c"
        lines={[
          { code: '#include <sys/wait.h>' },
          { code: '#include <unistd.h>' },
          { code: '#include <stdio.h>' },
          { code: 'int main(void) {' },
          { code: '    pid_t a = fork();', note: 'Primer hijo.' },
          { code: '    if (a == 0) { sleep(1); return 10; }' },
          { code: '    pid_t b = fork();', note: 'Segundo hijo. Ahora el padre tiene dos hijos vivos: a y b.' },
          { code: '    if (b == 0) { sleep(3); return 20; }' },
          { code: '    int status;' },
          { code: '    /* Espera ESPECIFICAMENTE al segundo hijo */' },
          { code: '    pid_t r = waitpid(b, &status, 0);', note: 'Le pasamos el PID de b. waitpid() ignora a "a" aunque termine antes: bloquea solo para b.' },
          { code: '    if (WIFEXITED(status))' },
          { code: '        printf("b (%d) salio con %d\\n", r, WEXITSTATUS(status));' },
          { code: '    /* Ahora recogemos al otro con wait() */' },
          { code: '    pid_t r2 = wait(&status);', note: 'wait() puro: recoge al que falta. El orden en que llegaron a la cola de zombies no importa.' },
          { code: '    if (WIFEXITED(status))' },
          { code: '        printf("a (%d) salio con %d\\n", r2, WEXITSTATUS(status));' },
          { code: '    return 0;' },
          { code: '}' },
        ]}
      />

      <H2>Ejemplo. Polling con WNOHANG</H2>
      <P>
        A veces el padre tiene cosas que hacer mientras los hijos trabajan: actualizar una barra de
        progreso, atender peticiones de red, refrescar la UI. En esos casos no puede bloquearse en
        <em> wait()</em>. La solución es preguntar periódicamente con <em>WNOHANG</em>.
      </P>
      <CodeExplain
        title="reaper.c"
        lines={[
          { code: '#include <sys/wait.h>' },
          { code: '#include <unistd.h>' },
          { code: '#include <stdio.h>' },
          { code: 'void recoger_zombies(void) {' },
          { code: '    int status;' },
          { code: '    pid_t pid;' },
          { code: '    while ((pid = waitpid(-1, &status, WNOHANG)) > 0) {', note: 'WNOHANG = no bloquees. -1 = cualquier hijo. El bucle drena TODOS los hijos que ya terminaron, sin pausar al padre. Si no hay zombies, waitpid retorna 0 y sale del bucle.' },
          { code: '        if (WIFEXITED(status))' },
          { code: '            printf("Hijo %d cerrado, codigo %d\\n", pid, WEXITSTATUS(status));' },
          { code: '    }' },
          { code: '}' },
        ]}
      />

      <H2>Para qué sirve todo esto en la práctica</H2>
      <P>
        Más allá de pasar un examen, dominar <em>wait()</em> y <em>waitpid()</em> es lo que te permite
        construir cosas serias:
      </P>
      <List>
        <li><strong>Sincronizar padre e hijo</strong>: garantizar que cierto trabajo termine antes de continuar con el siguiente paso.</li>
        <li><strong>Recuperar códigos de terminación</strong>: distinguir éxito de fracaso, decidir si reintentar.</li>
        <li><strong>Evitar procesos zombi</strong>: cada hijo no recogido es una entrada permanente en la tabla de procesos. Si nunca llamas <em>wait()</em>, terminarás reciclando PIDs sin sentido y agotando el límite del sistema.</li>
        <li><strong>Servidores concurrentes</strong>: el patrón clásico de aceptar conexiones, hacer <em>fork()</em>, dejar que el hijo atienda y que el padre recoja con <em>waitpid(-1, &amp;st, WNOHANG)</em> en SIGCHLD.</li>
        <li><strong>Gestores de tareas y supervisores</strong>: programas como <em>systemd</em>, <em>supervisord</em>, <em>pm2</em> dependen enteramente de esta API para saber cuándo reiniciar un servicio.</li>
      </List>   
    </>
  );
}
