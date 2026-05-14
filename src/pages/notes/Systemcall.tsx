import { P, List, H2, H3, Code, Callout, ProcessFan, ForkTree, CodeExplain, CowAnimation } from '../../components/ui/Prose';

export default function Systemcall() {
  return (
    <>
      <P>
        Los procesos pueden nacer por dos caminos. El sistema operativo crea muchos desde el arranque, conforme necesita
        cumplir tareas internas . El usuario también crea procesos: directamente, al
        ejecutar un programa, o indirectamente, cuando una aplicación lanza procesos hijos durante su ejecución.
      </P>
      <P>
        En GNU/Linux, la pieza fundamental para crear procesos es la llamada al sistema <strong>fork()</strong>. Su efecto es simple
        de enunciar pero potente: un proceso existente (el padre) le pide al kernel crear un nuevo proceso (el hijo) que es,
        lógicamente, una <strong>copia</strong> del padre. El kernel asigna un descriptor nuevo, establece la relación de parentesco
        y, desde ese punto, ambos procesos siguen su vida por separado.
      </P>

      <CowAnimation />

      <H3>Prototipo de la función</H3>
      <Code title="fork.h">{`#include <sys/types.h>
#include <unistd.h>

pid_t fork(void);`}</Code>
      <P>
        Tras la llamada, <strong>ambos procesos continúan ejecutándose</strong> desde la instrucción siguiente al <em>fork()</em>.
        Aquí aparece el detalle clave: aunque comparten la misma línea de código, el valor que <em>fork()</em> retorna a cada uno
        es distinto. Ese valor es el que permite distinguir quién es el padre y quién el hijo dentro del mismo programa.
      </P>

      <ForkTree />

      <H3>Valores de retorno de fork()</H3>
      <List>
        <li><strong>En el hijo:</strong> el valor devuelto es <em>0</em>. El hijo se reconoce por ese cero.</li>
        <li><strong>En el padre:</strong> el valor devuelto es un entero positivo: el <strong>PID</strong> (Process Identifier) del hijo recién creado.</li>
        <li><strong>En caso de error:</strong> <em>fork()</em> devuelve <em>-1</em>, no se crea ningún hijo, y el código <em>errno</em> indica la causa (sin memoria, demasiados procesos, etc.).</li>
      </List>

      <Callout tone="warn" title="Siempre revisa el retorno">
        Tres ramas posibles, tres caminos distintos. Si tu programa no contempla el caso <em>-1</em>, un fallo del kernel
        terminará silenciosamente en comportamiento incorrecto. Siempre escribe <em>if (pid &lt; 0) ... else if (pid == 0) ... else ...</em>.
      </Callout>

      <H3>Sobre los PID</H3>
      <P>
        En sistemas UNIX, los PID se asignan de forma <strong>incremental</strong>. Cuando se alcanza el valor máximo definido por el sistema,
        el kernel recicla identificadores de procesos ya terminados. En Linux puedes consultar (y configurar) este límite con:
      </P>
      <Code title="terminal">{`cat /proc/sys/kernel/pid_max`}</Code>
      <P>
        En arquitecturas de 64 bits el valor típico es <em>4,194,303</em>, lo que permite millones de procesos simultáneos
        sin colisiones de identificadores.
      </P>

      <H2>Ejemplo 1: el mismo código, dos procesos</H2>
      <P>
        Antes de usar el valor de retorno de <em>fork()</em>, conviene ver qué pasa si lo ignoras. En el siguiente fragmento,
        tanto el padre como el hijo ejecutan la misma línea de asignación <em>x = 1</em> después del fork. Aparentemente no
        sirve de mucho, pero ilustra la idea esencial: <strong>el kernel duplica la ejecución</strong>.
      </P>

      <CodeExplain
        title="ejemplo1.c"
        lines={[
          { code: '#include <sys/types.h>', note: 'Tipos básicos del sistema, incluido pid_t (el tipo entero usado para PIDs).' },
          { code: '#include <stdlib.h>', note: 'Define EXIT_SUCCESS y EXIT_FAILURE para códigos de salida.' },
          { code: '#include <unistd.h>', note: 'Cabecera estándar POSIX. Aquí vive la declaración de fork().' },
          { code: 'int main(void) {' },
          { code: '    int x = 0;', note: 'Variable local en el espacio de direcciones del padre. Por ahora solo existe una.' },
          { code: '    fork();', note: 'Punto de bifurcación. El kernel duplica el proceso. A partir de aquí hay DOS procesos ejecutándose, cada uno con su propia copia de x.' },
          { code: '    x = 1;', note: 'Ambos procesos ejecutan esta línea. El x del padre y el x del hijo viven en espacios de memoria distintos: cambiar uno NO afecta al otro.' },
          { code: '    return EXIT_SUCCESS;', note: 'Cada proceso termina por separado y entra en EXIT_ZOMBIE hasta que su padre lo recoja.' },
          { code: '}' },
        ]}
      />

      <P>
        El código es idéntico, pero cada proceso tiene su propio espacio de direcciones. La x en el padre y la x
        en el hijo son <strong>variables diferentes</strong>, almacenadas en páginas físicas distintas (o en la misma página
        compartida hasta que alguien escribe, gracias a COW).
      </P>

      <H2>Lo que el hijo hereda (y lo que no)</H2>
      <P>
        El hijo no es una copia ciega del padre. Hereda muchas cosas útiles, pero el kernel <strong>reinicia</strong> algunas
        para evitar conflictos. Conocer esta lista es vital para programar correctamente.
      </P>

      <H3>Hereda del padre:</H3>
      <List>
        <li><strong>El entorno de ejecución:</strong> variables de entorno (<em>environ</em>), directorio de trabajo, máscara <em>umask</em>.</li>
        <li><strong>Privilegios y credenciales:</strong> UID, GID, grupos suplementarios.</li>
        <li><strong>Descriptores de archivos abiertos:</strong> el hijo puede leer/escribir en los mismos archivos que el padre. Comparten <em>offset</em>.</li>
        <li><strong>Prioridad y política de planificación:</strong> arranca con el mismo <em>nice</em> y la misma clase de scheduler.</li>
      </List>

      <H3>NO hereda (se reinicia):</H3>
      <List>
        <li><strong>El PID:</strong> el hijo recibe un identificador nuevo. Imposible que coincida con el del padre.</li>
        <li><strong>Tiempos de CPU acumulados:</strong> el hijo arranca con contador en cero, aunque el padre lleve horas corriendo.</li>
        <li><strong>Bloqueos (locks) sobre archivos:</strong> el hijo no hereda los locks del padre.</li>
        <li><strong>Alarmas pendientes:</strong> un <em>alarm()</em> programado por el padre no le llegará al hijo.</li>
        <li><strong>Señales pendientes:</strong> si el padre tenía señales sin entregar al momento del fork, el hijo arranca limpio.</li>
      </List>

      <Callout tone="info" title="Competencia por CPU">
        El hijo no hereda prioridad de ejecución privilegiada. Compite por el CPU contra todos los procesos del sistema,
        incluido su propio padre, bajo las reglas del planificador.
      </Callout>

      <H2>Ejemplo 2: distinguir padre e hijo con el valor de retorno</H2>
      <P>
        Aquí está el patrón canónico. Usamos el retorno de <em>fork()</em> para que cada proceso ejecute código distinto.
        Además, al modificar <em>x</em> con valores diferentes en cada rama, forzamos al kernel a <strong>materializar la copia
        física</strong> de la página de memoria que contiene a <em>x</em>: ahí entra en acción el copy-on-write real.
      </P>

      <CodeExplain
        title="ejemplo2.c"
        lines={[
          { code: '#include <stdio.h>', note: 'Para el uso de printf' },
          { code: '#include <stdlib.h>', note: 'EXIT_SUCCESS.' },
          { code: '#include <sys/types.h>', note: 'pid_t.' },
          { code: '#include <unistd.h>', note: 'fork() y getpid().' },
          { code: 'int main(void) {' },
          { code: '    int x = 0;', note: 'Estado inicial común. La página que contiene x es compartida (COW) entre padre e hijo justo después del fork.' },
          { code: '    pid_t pid;', note: 'Aquí guardaremos el valor de retorno de fork(). Su valor es DISTINTO en cada proceso.' },
          { code: '    pid = fork();', note: 'Punto de bifurcación. A partir de esta línea hay dos procesos. El siguiente if se evalúa en cada uno con un pid distinto.' },
          { code: '    if (pid == 0) {', note: 'CAMINO DEL HIJO. fork() devolvió 0 solo aquí.' },
          { code: '        /* Código del hijo */' },
          { code: '        x = 5;', note: 'El hijo escribe. El kernel detecta la escritura en página compartida y dispara COW: ahora el hijo tiene su propia copia física de x.' },
          { code: '        printf("Hijo: PID=%ld, x=%d\\n", (long)getpid(), x);', note: 'getpid() devuelve el PID del proceso actual. Aquí imprime el PID del hijo y su x = 5.' },
          { code: '    } else {', note: 'CAMINO DEL PADRE. fork() devolvió un PID positivo (el del hijo).' },
          { code: '        /* Código del padre */' },
          { code: '        x = 10;', note: 'El padre también escribe. COW se dispara también para él (o ya se disparó al modificar el hijo). Ahora cada proceso tiene su propia página.' },
          { code: '        printf("Padre: PID=%ld, x=%d\\n", (long)getpid(), x);', note: 'El padre imprime SU PID (distinto al del hijo) y x = 10.' },
          { code: '    return EXIT_SUCCESS;', note: 'Ambos procesos llegan aquí por su cuenta y terminan independientemente.' },
          { code: '}' },
        ]}
      />

      <P>
        Si compilas y ejecutas, verás dos líneas en la terminal — una por cada proceso — con PIDs distintos y valores de
        <em> x </em> distintos. La salida puede aparecer en cualquier orden, porque el planificador decide quién corre primero.
        Ese desorden es tu primera pista visual de que <strong>hay concurrencia</strong> en juego.
      </P>

      <Callout tone="success" title="Lo que acabas de ver">
        <em>fork()</em> es eficiente: no copia memoria de inmediato, gracias al copy-on-write. Solo se duplica lo que se modifica.
        Por eso es viable crear procesos rápidamente en Linux, incluso cuando el padre maneja un espacio de direcciones enorme.
        Este mecanismo es lo que hace que servidores como nginx, postgres o shells interactivas puedan crear cientos de hijos
        sin colapsar el sistema.
      </Callout>

      <H2>Resumen mental</H2>
      <List>
        <li><strong>fork()</strong> duplica el proceso actual.</li>
        <li>Retorna <strong>0</strong> en el hijo, <strong>PID del hijo</strong> en el padre, <strong>-1</strong> en error.</li>
        <li>Padre e hijo comparten páginas hasta que alguno <strong>escribe</strong> (COW).</li>
        <li>El hijo hereda casi todo, pero el kernel <strong>reinicia</strong> PID, tiempos, locks, alarmas y señales pendientes.</li>
        <li>Si el padre no recoge al hijo terminado, este queda como <strong>EXIT_ZOMBIE</strong>.</li>
      </List>
    </>
  );
}
