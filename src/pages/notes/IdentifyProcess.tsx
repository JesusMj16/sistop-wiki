import { P, H2, H3, List, Code, Callout, CodeExplain, ProcessFanAnimation } from '../../components/ui/Prose';

export default function IdentifyProcess() {
  return (
    <>
      <P>
        Todo proceso en un sistema operativo tipo UNIX tiene asociado un identificador único llamado
        <strong> PID</strong> (Process Identifier). Es un número entero positivo que el kernel asigna en el
        momento exacto en que el proceso nace. Mientras el proceso viva, ese número será su etiqueta única
        dentro del sistema: aparecerá en <em>ps</em>, en <em>top</em>, en los logs, y será la pieza con la
        que cualquier otra parte del sistema (señales, <em>wait</em>, <em>kill</em>, archivos en <em>/proc</em>)
        podrá referirse a él.
      </P>
      <P>
        Cada proceso conserva además una referencia hacia el proceso que lo creó: su <strong>padre</strong>.
        El identificador de ese padre se llama <strong>PPID</strong> (Parent Process Identifier). Esta relación
        padre–hijo es la columna vertebral de la jerarquía de procesos de UNIX: no hay procesos sueltos, todos
        descienden directa o indirectamente del proceso de arranque del sistema. Cuando dibujas el árbol con
        <em> pstree</em>, lo que estás viendo es exactamente la relación PID–PPID en cadena.
      </P>

      <H2>Obtener el PID y el PPID</H2>
      <P>
        Para consultar estos identificadores desde un programa en C, el sistema ofrece dos llamadas de la
        biblioteca POSIX, declaradas en <em>&lt;unistd.h&gt;</em>:
      </P>

      <H3>Prototipo de getpid()</H3>
      <Code title="getpid.h">{`#include <sys/types.h>
#include <unistd.h>

pid_t getpid(void);`}</Code>

      <H3>Prototipo de getppid()</H3>
      <Code title="getppid.h">{`#include <sys/types.h>
#include <unistd.h>

pid_t getppid(void);`}</Code>

      <P>
        El tipo de retorno <strong>pid_t</strong> representa el identificador de un proceso. En la biblioteca
        GNU C es un <em>entero con signo</em> cuyo tamaño depende de la arquitectura del sistema (32 o 64 bits).
        Se usa con signo no porque los PIDs sean negativos en condiciones normales, sino para poder distinguir
        valores especiales en otras funciones (por ejemplo <em>fork()</em> devuelve <em>-1</em> en caso de error).
      </P>
      <List>
        <li><strong>getpid()</strong> devuelve el PID del proceso que la invoca, es decir, su propio identificador.</li>
        <li><strong>getppid()</strong> devuelve el PID del proceso padre del proceso actual, es decir, su PPID.</li>
      </List>

      <H2>Grupos de procesos</H2>
      <P>
        Más allá de la relación padre–hijo, los procesos pueden organizarse en <strong>grupos de procesos</strong>.
        Un grupo permite al sistema operativo gestionar de forma conjunta un conjunto de procesos relacionados,
        por ejemplo, todos los que pertenecen a una misma <em>pipeline</em> del shell, o todos los que comparten
        una sesión o terminal. Si presionas <em>Ctrl+C</em> en una terminal, la señal <em>SIGINT</em> se envía a
        todo el grupo de procesos del primer plano, no a un único proceso. Por eso los grupos son tan importantes
        para el control de trabajos.
      </P>

      <H3>Consultar el grupo, getpgrp()</H3>
      <Code title="getpgrp.h">{`#include <sys/types.h>
#include <unistd.h>

pid_t getpgrp(void);`}</Code>

      <P>
        Esta llamada retorna el identificador del grupo de procesos al que pertenece el proceso actual,
        conocido como <strong>PGID</strong> (Process Group ID). El PGID coincide con el PID del proceso
        que es <em>líder</em> de ese grupo.
      </P>

      <H3>Crear o convertirse en líder de grupo, setpgrp()</H3>
      <Code title="setpgrp.h">{`#include <sys/types.h>
#include <unistd.h>

pid_t setpgrp(void);`}</Code>

      <P>
        Cuando un proceso invoca <em>setpgrp()</em>, el kernel establece el <em>PGID</em> de ese proceso
        igual a su propio <em>PID</em>, convirtiéndolo en líder de un nuevo grupo. En implementaciones
        modernas, esta operación suele estar respaldada internamente por la llamada más general
        <em> setpgid()</em>, que permite cambiar también el grupo de otros procesos hijos. Es el mecanismo
        que usa el shell para construir <em>pipelines</em>: arma un grupo nuevo, coloca a todos los procesos
        del pipeline dentro de él y declara a ese grupo como el de primer plano.
      </P>

      <H2>Procesos huérfanos y adopción por init/systemd</H2>
      <P>
        Hay un escenario que merece atención especial: ¿qué pasa si un proceso padre <strong>termina su
        ejecución antes que sus hijos</strong>? Los hijos no quedan sin control ni a la deriva. El kernel
        detecta la situación y <strong>reasigna automáticamente</strong> a los procesos huérfanos a un
        proceso especial con <strong>PID 1</strong>.
      </P>
      <P>
        Históricamente ese proceso fue <em>init</em>; en sistemas GNU/Linux modernos suele corresponder a
        <em> systemd</em>. Sea cual sea, su rol no cambia: adopta a todos los huérfanos del sistema y se
        encarga de recoger su estado de terminación mediante <em>wait()</em>, evitando que queden eternamente
        en estado <em>zombie</em>. Por eso si abres <em>ps -ef</em> después de matar un padre, verás a los
        hijos colgando ahora del PPID 1.
      </P>


      <H2>Ejemplo. Padre e hijo imprimen su PID</H2>
      <P>
        El siguiente programa hace un solo <em>fork()</em> y, tras la bifurcación, tanto el padre como el
        hijo imprimen su propio <em>PID</em> en la salida estándar usando <em>fprintf(stdout, ...)</em>.
        Es la versión mínima de cómo distinguir las dos ramas de ejecución posteriores a un <em>fork()</em>.
      </P>

      <CodeExplain
        title="pid_basico.c"
        lines={[
          { code: '#include <stdio.h>', note: 'fprintf y stdout.' },
          { code: '#include <stdlib.h>', note: 'EXIT_SUCCESS y EXIT_FAILURE.' },
          { code: '#include <sys/types.h>', note: 'pid_t.' },
          { code: '#include <unistd.h>', note: 'fork() y getpid().' },
          { code: 'int main(void) {' },
          { code: '    pid_t hijo;', note: 'Aquí se almacena el valor de retorno de fork(). Recuerda: ese valor es DISTINTO en el padre y en el hijo.' },
          { code: '    hijo = fork();', note: 'Punto de bifurcación. A partir de esta línea hay dos procesos ejecutándose en paralelo. El kernel ya asignó un PID nuevo al hijo y le puso al padre como su PPID.' },
          { code: '    if (hijo == 0) {', note: 'CAMINO DEL HIJO. fork() solo retorna 0 dentro del proceso hijo.' },
          { code: '        /* Código ejecutado por el proceso hijo */' },
          { code: '        fprintf(stdout, "Soy el hijo, PID=%ld\\n", (long)getpid());', note: 'getpid() devuelve el PID propio del hijo. El cast a (long) es buena práctica: pid_t puede ser int o long según la arquitectura.' },
          { code: '    } else if (hijo > 0) {', note: 'CAMINO DEL PADRE. fork() retornó un entero positivo: justamente el PID que el kernel acaba de asignar al hijo recién creado.' },
          { code: '        /* Código ejecutado por el proceso padre */' },
          { code: '        fprintf(stdout, "Soy el padre, PID=%ld\\n", (long)getpid());', note: 'Aquí getpid() devuelve el PID del padre, NO el del hijo. La variable hijo guarda el PID del hijo, pero quien imprime es el padre.' },
          { code: '    } else {', note: 'CAMINO DE ERROR. fork() retornó -1: el kernel no pudo crear el proceso (sin memoria, límite de procesos del usuario, etc).' },
          { code: '        /* Error al crear el proceso */' },
          { code: '        perror("fork");', note: 'perror imprime el mensaje pasado más la descripción del último errno. Útil para depurar.' },
          { code: '        return EXIT_FAILURE;' },
          { code: '    }' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <H2>Descriptores de archivo estándar y herencia</H2>
      <P>
        El uso de <em>stdout</em> en el ejemplo anterior pone de manifiesto una convención fundamental en
        los sistemas UNIX y sus derivados, como GNU/Linux: a cada proceso se le asocia, por defecto, un
        conjunto de <strong>descriptores de archivo estándar</strong> que permiten la comunicación básica
        con el entorno. No tienes que abrirlos manualmente; vienen heredados del proceso que te lanzó
        (típicamente, el shell).
      </P>

      <List>
        <li><strong>Entrada estándar (stdin)</strong>: descriptor <em>0</em>, asociado típicamente al teclado.</li>
        <li><strong>Salida estándar (stdout)</strong>: descriptor <em>1</em>, asociado normalmente a la pantalla.</li>
        <li><strong>Error estándar (stderr)</strong>: descriptor <em>2</em>, asociado también a la pantalla, pero separado de la salida estándar para que los mensajes de error puedan redirigirse de forma independiente.</li>
      </List>

      <P>
        Estos valores están estandarizados por <strong>POSIX.1</strong>, que define las constantes
        <em> STDIN_FILENO</em>, <em>STDOUT_FILENO</em> y <em>STDERR_FILENO</em> para los descriptores
        <em> 0</em>, <em>1</em> y <em>2</em> respectivamente. Todas viven en <em>&lt;unistd.h&gt;</em>.
        Usar las constantes en vez de los números literales es la práctica recomendada: deja claro el
        propósito y vuelve el código portable.
      </P>

      <Callout tone="success" title="Por qué padre e hijo escriben en la misma terminal">
        Cuando se ejecuta <em>fork()</em>, el proceso hijo <strong>hereda los descriptores de archivo
        abiertos del padre</strong>, incluyendo stdin, stdout y stderr. Por eso ambos procesos pueden
        imprimir mensajes en la terminal sin necesidad de abrir explícitamente un archivo: ambos comparten
        las mismas conexiones a la consola.
      </Callout>

      <H2>Ejemplo. Cadena de procesos</H2>
      <P>
        En una <strong>cadena de procesos</strong>, cada proceso crea exactamente un hijo, y es el
        <em> padre</em> quien deja de crear nuevos procesos después de cada bifurcación. La estructura
        resultante es lineal:
      </P>

      <Code title="estructura">{`P0 → P1 → P2 → P3 → ... → Pn`}</Code>

      <CodeExplain
        title="cadena.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <unistd.h>' },
          { code: 'int main(void) {' },
          { code: '    pid_t hijo;' },
          { code: '    int n = 5;', note: 'Profundidad deseada de la cadena. Significa que al final habrá n + 1 procesos vivos: el padre original y n descendientes encadenados.' },
          { code: '    for (int i = 0; i < n; i++) {' },
          { code: '        hijo = fork();', note: 'Bifurcación. Justo después de esta línea hay dos procesos ejecutándose dentro del mismo for: el padre actual y el hijo recién creado.' },
          { code: '        if (hijo > 0) {', note: 'Esta condición SOLO la cumple el padre. fork() devolvió un valor positivo (el PID del hijo).' },
          { code: '            /* El padre deja de crear más procesos */' },
          { code: '            break;', note: 'Clave del patrón cadena: el PADRE abandona el ciclo. Por eso quien continúa el for en la próxima iteración es el HIJO, no el padre.' },
          { code: '        }' },
          { code: '        fprintf(stderr,"Proceso PID=%ld, PPID=%ld\\n",(long)getpid(), (long)getppid());', note: 'Esta línea la imprime cualquier proceso que llegue aquí, es decir, el hijo recién creado antes de continuar la siguiente iteración. Verás la cadena formándose en stderr.' },
          { code: '    }' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <H3>Por qué resulta una cadena</H3>
      <List>
        <li>En cada iteración, <strong>solo el proceso hijo</strong> continúa el ciclo (porque el padre rompió con <em>break</em>).</li>
        <li>El padre original sale con <em>break</em> tras crear su único hijo y nunca más vuelve a llamar a <em>fork()</em>.</li>
        <li>Se genera una <strong>cadena lineal</strong> de profundidad <em>n</em>: P0 es padre de P1, P1 es padre de P2, y así sucesivamente.</li>
        <li>Cada proceso tiene <strong>exactamente un hijo</strong>, excepto el último, que termina el ciclo por agotar las iteraciones.</li>
      </List>

      <Callout tone="info" title="Cómo verificarlo">
        Si compilas y ejecutas con <em>./cadena</em>, en cada línea de salida verás que el <em>PPID</em> de
        un proceso coincide con el <em>PID</em> del anterior. Eso es la prueba visual de la cadena:
        P1.PPID = P0.PID, P2.PPID = P1.PID, y así sucesivamente.
      </Callout>

      <H2>Ejemplo. Abanico de procesos</H2>
      <P>
        En un <strong>abanico de procesos</strong> ocurre lo contrario al patrón anterior: un único proceso
        padre crea varios hijos, pero <strong>los hijos no crean más procesos</strong>. La diferencia con la
        cadena es sutil pero crítica: aquí quien rompe el ciclo es el <em>hijo</em>, no el padre. Por eso
        el padre sigue siendo el único responsable de invocar <em>fork()</em> en cada iteración, y todos
        los hijos generados cuelgan directamente de él, formando una estructura con forma de estrella.
      </P>

      <P>
        Antes de mostrar el código, recorre la siguiente animación. Avanza paso a paso para ver cómo, en
        cada iteración del <em>for</em>, el padre P0 lanza un nuevo hijo que sale inmediatamente del bucle
        gracias al <em>break</em>. El árbol crece a lo ancho, no en profundidad. Observa cómo el código a
        la derecha resalta exactamente las líneas que están ejecutándose en cada paso.
      </P>

      <ProcessFanAnimation />

      <H3>Código del abanico</H3>
      <CodeExplain
        title="abanico.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <unistd.h>' },
          { code: 'int main(void) {' },
          { code: '    pid_t hijo;' },
          { code: '    int n = 5;', note: 'Cantidad de hijos que el padre creará. Al final habrá n + 1 procesos vivos: el padre y n hijos colgando de él.' },
          { code: '    for (int i = 0; i < n; i++) {' },
          { code: '        hijo = fork();', note: 'En cada iteración el padre crea UN hijo. La iteración del bucle pertenece exclusivamente al padre.' },
          { code: '        if (hijo == 0) {', note: 'Diferencia clave con la cadena: aquí filtramos por hijo == 0, es decir, por el HIJO. El que abandona el ciclo es el hijo, no el padre.' },
          { code: '            /* El hijo no crea más procesos */' },
          { code: '            break;', note: 'El hijo recién nacido sale del for de inmediato. No volverá a llamar a fork(). Así queda como una hoja sin descendencia.' },
          { code: '        }' },
          { code: '    }' },
          { code: '    fprintf(stderr, "Proceso PID=%ld, PPID=%ld\\n", (long)getpid(), (long)getppid());', note: 'Esta línea está FUERA del for. La ejecutan TODOS los procesos exactamente una vez: el padre tras salir por la condición del for, y cada hijo tras salir por su propio break.' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <H3>Por qué resulta un abanico</H3>
      <List>
        <li><strong>Solo el padre</strong> ejecuta el ciclo completo, iteración tras iteración.</li>
        <li>Cada iteración crea <strong>un hijo nuevo</strong> que es independiente del anterior.</li>
        <li>Cada hijo ejecuta <em>break</em> inmediatamente después de nacer y <strong>no genera más procesos</strong>.</li>
        <li>Se obtiene una <strong>estructura tipo estrella</strong> (abanico): un solo padre con <em>n</em> hojas. Profundidad 1, ancho <em>n</em>.</li>
        <li>Si listas los procesos con <em>ps -ef</em> o <em>pstree</em>, verás a P0 con sus n hijos colgando exactamente al mismo nivel.</li>
      </List>

      <Callout tone="idea" title="Cadena vs. abanico, en una sola frase">
        En la <strong>cadena</strong>, el <em>padre</em> rompe el ciclo, así que el hijo hereda el for y
        crea al siguiente. En el <strong>abanico</strong>, el <em>hijo</em> rompe el ciclo, así que el
        padre conserva el for y crea a todos los demás. Cambiar <em>hijo == 0</em> por <em>hijo &gt; 0</em>
        (y viceversa) transforma una topología en la otra.
      </Callout>

      <Callout tone="warn" title="Orden de salida no determinista">
        Cuando ejecutes el programa del abanico verás <em>n + 1</em> líneas en pantalla, pero el orden
        en que aparecen <strong>no es predecible</strong>: depende de cómo el planificador del kernel
        intercale a los procesos. No es un bug, es concurrencia real. Si necesitas un orden, debes
        sincronizar explícitamente con <em>wait()</em>, <em>waitpid()</em>, pipes o señales.
      </Callout>
    </>
  );
}
