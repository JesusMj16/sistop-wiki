import { P, H2, H3, Code, Callout, Table, SignalCatalog } from '../../components/ui/Prose';

export default function TiposSenales() {
  return (
    <>
      <H2>7.5.1 Tipos de señales</H2>

      <P>
        Cada señal tiene asociado un número entero positivo y a su vez un nombre simbólico que es
        el que los procesos intercambian. UNIX System V define <strong>19 señales</strong>. 4.3BSD
        amplía a 30. Linux moderno llega más allá agregando señales de tiempo real. La regla común
        sigue siendo la misma. Número, nombre que empieza con SIG, y una acción por defecto que el
        kernel ejecuta si nadie instala un handler propio.
      </P>

      <H3>Las seis categorías lógicas</H3>

      <P>
        Aunque las señales se enumeran como una lista plana en los headers, conceptualmente caen
        en seis grupos lógicos según su origen. Saber a qué grupo pertenece cada una ayuda a
        recordar qué hacen y cuándo aparecen.
      </P>

      <P>
        <strong>Terminación de procesos.</strong> Señales cuyo propósito explícito es acabar con
        un proceso. SIGTERM negociable. SIGKILL absoluta.
      </P>

      <P>
        <strong>Excepciones inducidas por procesos.</strong> Errores que el hardware detecta y
        convierte en señal. Intento de acceder fuera del espacio de direcciones virtuales. Errores
        en coma flotante. Instrucciones ilegales.
      </P>

      <P>
        <strong>Errores irrecuperables durante syscalls.</strong> Originadas cuando algo serio
        falla dentro de una llamada al sistema, no en código del usuario.
      </P>

      <P>
        <strong>Originadas desde modo usuario.</strong> Un proceso envía señal a otro vía
        <em> kill</em>. Un proceso activa un temporizador y espera la alarma. La muerte de un
        hijo notificada al padre.
      </P>

      <P>
        <strong>Interacción con la terminal.</strong> Generadas por el shell o la propia tty
        cuando el usuario teclea Ctrl C, Ctrl Backslash, cierra la ventana o pierde conexión SSH.
      </P>

      <P>
        <strong>Ejecución paso a paso.</strong> Usadas por debuggers para detener un programa
        después de cada instrucción o al alcanzar un breakpoint.
      </P>

      <H3>Mira el catálogo completo agrupado</H3>

      <P>
        La animación que viene a continuación muestra las 19 señales del catálogo System V en una
        cuadrícula. Cada celda lleva su número, su nombre, una descripción corta y etiquetas con
        la acción por defecto. core indica que genera archivo core para depurar. term indica que
        termina el proceso. ignore indica que se ignora si no hay handler. Pasos consecutivos
        iluminan una categoría a la vez para que veas cómo se distribuyen.
      </P>

      <SignalCatalog />

      <H2>Las 19 señales una por una</H2>

      <P>
        Aquí están las definiciones detalladas tal como aparecen en <em>signal.h</em> del System V.
        Léelas con atención. Conocer estas señales por nombre es vocabulario básico de cualquier
        programador de sistemas.
      </P>

      <P>
        <strong>SIGHUP (1) Hangup.</strong> Es enviada cuando una terminal se desconecta de todo
        proceso del que es terminal de control. También se envía a todos los procesos de un grupo
        cuando el líder del grupo termina su ejecución. Acción por defecto. Terminar el proceso.
      </P>

      <P>
        <strong>SIGINT (2) Interrupción.</strong> Se envía a todo proceso asociado a una terminal
        de control cuando se pulsa la tecla de interrupción, típicamente Ctrl C. Acción por
        defecto. Terminar el proceso.
      </P>

      <P>
        <strong>SIGQUIT (3) Salir.</strong> Similar a SIGINT pero generada al pulsar la tecla de
        salida, Ctrl Backslash. Acción por defecto. Generar archivo core y terminar el proceso.
      </P>

      <P>
        <strong>SIGILL (4) Instrucción ilegal.</strong> Enviada cuando el hardware detecta una
        instrucción ilegal. Los programas que manejan apuntadores a funciones que no han sido
        correctamente inicializados producen este error. Acción por defecto. Generar core y
        terminar.
      </P>

      <P>
        <strong>SIGTRAP (5) Trace trap.</strong> Enviada después de ejecutar cada instrucción
        cuando el proceso se está ejecutando paso a paso bajo un debugger. Acción por defecto.
        Generar core y terminar.
      </P>

      <P>
        <strong>SIGIOT (6) I/O trap instruction.</strong> Se envía cuando se da un fallo de
        hardware. La naturaleza depende de la máquina. También genera core.
      </P>

      <P>
        <strong>SIGEMT (7) Emulator trap instruction.</strong> Indica un fallo de hardware. Rara
        vez se utiliza en sistemas modernos. Acción por defecto. Generar core y terminar.
      </P>

      <P>
        <strong>SIGFPE (8) Error en coma flotante.</strong> Enviada por el hardware cuando detecta
        un error en operaciones de coma flotante. Uso de números con formato desconocido,
        overflow, underflow, división por cero. Acción por defecto. Generar core y terminar.
      </P>

      <P>
        <strong>SIGKILL (9) Kill.</strong> Provoca irremediablemente la terminación del proceso.
        No se puede ignorar ni atrapar con un handler propio. La única manera infalible de matar
        un proceso desde fuera. Genera core y termina.
      </P>

      <P>
        <strong>SIGBUS (10) Bus error.</strong> Se produce cuando se da un error de acceso a
        memoria. Las dos situaciones típicas son intentar acceder a una dirección que físicamente
        no existe o intentar acceder a una dirección impar en arquitecturas que requieren
        alineación. Acción por defecto. Generar core y terminar.
      </P>

      <P>
        <strong>SIGSEGV (11) Violación de segmento.</strong> Enviada a un proceso cuando intenta
        acceder a datos que se encuentran fuera de su segmento de datos. El error favorito de
        programadores C. Acción por defecto. Generar core y terminar.
      </P>

      <P>
        <strong>SIGSYS (12) Argumento erróneo en una llamada al sistema.</strong> No se usa
        prácticamente. La mayoría de errores de syscall se reportan vía errno en lugar de señal.
      </P>

      <P>
        <strong>SIGPIPE (13) Pipe rota.</strong> Intento de escritura en una tubería en la que no
        hay nadie leyendo. Esto suele ocurrir cuando el proceso lector termina anormalmente. Si no
        instalas handler, tu proceso muere silenciosamente al escribir en un pipe muerto. Acción
        por defecto. Terminar.
      </P>

      <P>
        <strong>SIGALRM (14) Alarma de reloj.</strong> Enviada a un proceso cuando alguno de sus
        temporizadores descendentes llega a cero. Configurada previamente con <em>alarm</em> o
        <em> setitimer</em>. Acción por defecto. Terminar.
      </P>

      <P>
        <strong>SIGTERM (15) Finalización de software.</strong> La señal estándar para indicarle
        a un proceso que debe terminar su ejecución. No es tajante como SIGKILL y puede ser
        ignorada o atrapada para hacer limpieza antes de salir. Esta señal es la que envía el
        comando <em>shutdown</em> a todos los procesos durante el apagado del sistema. Acción por
        defecto. Terminar.
      </P>

      <P>
        <strong>SIGUSR1 (16) Señal de usuario 1.</strong> Reservada explícitamente para uso del
        programador. El kernel nunca la dispara por sí mismo. Tú decides qué significa en tu
        programa. Acción por defecto. Terminar.
      </P>

      <P>
        <strong>SIGUSR2 (17) Señal de usuario 2.</strong> Idéntica a SIGUSR1, segunda señal libre
        para uso propio.
      </P>

      <P>
        <strong>SIGCLD (18) Muerte del proceso hijo.</strong> Enviada al proceso padre cuando uno
        de sus procesos hijos termina. En Linux moderno se llama SIGCHLD. Esta señal se ignora por
        defecto. Si quieres reaccionar a la muerte de tus hijos, instala un handler que llame a
        <em> wait</em>.
      </P>

      <P>
        <strong>SIGPWR (19) Fallo de alimentación.</strong> Enviada por el kernel cuando el
        sistema UPS detecta corte de luz inminente. Permite a los procesos críticos guardar estado
        antes del apagado físico.
      </P>

      <H3>Tabla resumen de acciones por defecto</H3>

      <Table
        headers={['Nombre', 'Número', 'Genera core', 'Termina', 'Ignora']}
        rows={[
          ['SIGHUP',   '01', '',  '✓', ''],
          ['SIGINT',   '02', '',  '✓', ''],
          ['SIGQUIT',  '03', '✓', '✓', ''],
          ['SIGILL',   '04', '✓', '✓', ''],
          ['SIGTRAP',  '05', '✓', '✓', ''],
          ['SIGIOT',   '06', '✓', '✓', ''],
          ['SIGEMT',   '07', '✓', '✓', ''],
          ['SIGFPE',   '08', '✓', '✓', ''],
          ['SIGKILL',  '09', '',  '✓', ''],
          ['SIGBUS',   '10', '✓', '✓', ''],
          ['SIGSEGV',  '11', '✓', '✓', ''],
          ['SIGSYS',   '12', '✓', '✓', ''],
          ['SIGPIPE',  '13', '',  '✓', ''],
          ['SIGALRM',  '14', '',  '✓', ''],
          ['SIGTERM',  '15', '',  '✓', ''],
          ['SIGUSR1',  '16', '',  '✓', ''],
          ['SIGUSR2',  '17', '',  '✓', ''],
          ['SIGCLD',   '18', '',  '',  '✓'],
          ['SIGPWR',   '19', '',  '',  '✓'],
        ]}
      />

      <H2>Señales en Linux</H2>

      <P>
        En Linux las señales están definidas en el archivo
        <em> /usr/include/asm-generic/signal.h</em>. La numeración cambia ligeramente respecto a
        System V porque Linux reorganizó algunas señales y añadió otras nuevas. La siguiente tabla
        muestra la lista completa tal como aparece en Linux moderno.
      </P>

      <Table
        headers={['Nombre', 'Número', 'Descripción']}
        rows={[
          ['SIGHUP',      '01', 'Termina el proceso líder de sesión'],
          ['SIGINT',      '02', 'Ctrl+C pulsada'],
          ['SIGQUIT',     '03', 'Ctrl+\\ termina terminal'],
          ['SIGILL',      '04', 'Instrucción ilegal'],
          ['SIGTRAP',     '05', 'Trazado de programas'],
          ['SIGABRT / SIGIOT', '06', 'Terminación anormal'],
          ['SIGBUS',      '07', 'Error de bus'],
          ['SIGFPE',      '08', 'Error aritmético en coma flotante'],
          ['SIGKILL',     '09', 'Elimina procesos incondicionalmente'],
          ['SIGUSR1',     '10', 'Señal definida por el usuario'],
          ['SIGSEGV',     '11', 'Violación de segmento'],
          ['SIGUSR2',     '12', 'Señal definida por el usuario'],
          ['SIGPIPE',     '13', 'Escritura en pipe sin lectores'],
          ['SIGALRM',     '14', 'Fin del reloj ITIMER_REAL'],
          ['SIGTERM',     '15', 'Terminación del software'],
          ['SIGTKFLT',    '16', 'Desbordamiento de coprocesador matemático'],
          ['SIGCHLD',     '17', 'Hijo terminó con exit, notifica al padre que hizo wait'],
          ['SIGCONT',     '18', 'Proceso pasa a segundo o primer plano'],
          ['SIGSTOP',     '19', 'Suspensión de un proceso (no atrapable)'],
          ['SIGTSTP',     '20', 'Suspensión por Ctrl+Z'],
          ['SIGTTIN',     '21', 'Background trata de leer terminal'],
          ['SIGTTOU',     '22', 'Background trata de escribir terminal'],
          ['SIGURG',      '23', 'Datos urgentes en socket'],
          ['SIGXCPU',     '24', 'Pasó el límite de tiempo CPU'],
          ['SIGXFSZ',     '25', 'Pasó el tamaño máximo de archivo'],
          ['SIGVTALARM',  '26', 'Fin de ITIMER_VIRTUAL'],
          ['SIGPROF',     '27', 'Fin de ITIMER_PROF'],
          ['SIGWICH',     '28', 'Cambio de tamaño de ventana, X11'],
          ['SIGIO',       '29', 'Datos disponibles para E/S'],
          ['SIGPWR',      '30', 'Fallo de alimentación'],
          ['SIGSYS / SIGUNUSED', '31', 'Error de argumento en llamada'],
          ['SIGRTMIN',    '32', 'Límite de señales en tiempo real'],
        ]}
      />

      <Callout tone="info" title="Diferencia importante. System V vs Linux">
        Observa que en System V SIGBUS es número 10 y SIGUSR1 es 16. En Linux SIGBUS es 7 y
        SIGUSR1 es 10. Si escribes código portable nunca uses los números enteros directamente.
        Siempre usa los nombres simbólicos del header. El compilador resuelve el número correcto
        para tu plataforma.
      </Callout>

      <H2>Enviar señales desde C. La función kill</H2>

      <P>
        Para enviar una señal desde un proceso a otro o a un grupo de procesos se emplea la
        llamada al sistema <em>kill</em>. El nombre engaña. No solo sirve para matar, sirve para
        enviar cualquier señal.
      </P>

      <Code title="kill">{`#include <sys/types.h>
#include <signal.h>

int kill(pid_t pid, int sig);`}</Code>

      <P>
        El primer parámetro <em>pid</em> identifica al destinatario de la señal. Es un entero que
        puede tomar cuatro formas distintas según su valor. Cada forma cambia completamente a
        quién va dirigida la señal. Esta es la parte que más confunde.
      </P>

      <P>
        <strong>pid mayor que 0.</strong> Es el PID del proceso específico al que se le envía la
        señal. Caso típico. Sabes a quién quieres mandar la señal y conoces su PID.
      </P>

      <P>
        <strong>pid igual a 0.</strong> La señal se envía a todos los procesos que pertenecen al
        mismo grupo que el proceso emisor. Útil para que un proceso señalice a sus hermanos en el
        mismo grupo de control de jobs del shell.
      </P>

      <P>
        <strong>pid igual a -1.</strong> La señal se envía a todos los procesos cuyo ID real es
        igual al ID efectivo del emisor, excepto al proceso 1 que es <em>init</em>. Es la versión
        broadcast a tus propios procesos. <em>init</em> queda excluido por seguridad.
      </P>

      <P>
        <strong>pid menor que -1.</strong> La señal se envía a todos los procesos cuyo ID de grupo
        coincide con el valor absoluto de pid. Permite señalizar a todo un grupo de procesos
        ajeno por su GID.
      </P>

      <P>
        En todos los casos, si el ID efectivo del proceso emisor no es el del superusuario o si no
        tiene privilegios sobre el proceso destino, la llamada falla. El segundo parámetro
        <em> sig</em> es el número de la señal a enviar, idealmente expresado con el nombre
        simbólico. Si el envío tiene éxito devuelve 0. Si falla devuelve -1 y deja el error en
        <em> errno</em>.
      </P>

      <H2>Enviarse una señal a uno mismo. La función raise</H2>

      <P>
        El proceso también puede enviarse señales a sí mismo mediante la función <em>raise</em>.
        Útil para probar handlers o para forzar terminación controlada desde dentro.
      </P>

      <Code title="raise">{`#include <signal.h>

int raise(int sig);`}</Code>

      <P>
        La función retorna 0 en caso de éxito y un número distinto de cero en caso de fallo.
        Internamente equivale a <em>kill(getpid(), sig)</em> pero es más conciso y portable.
      </P>

      <Callout tone="success" title="Qué entendimos en esta página">
        System V define 19 señales numeradas con nombres SIG. Caen en seis grupos según origen.
        Terminación, excepciones del hardware, errores de syscall, modo usuario, terminal, debug.
        Cada señal tiene una acción por defecto que el kernel ejecuta si no hay handler.
        Generalmente terminar, opcionalmente con core dump para depurar. SIGKILL y SIGSTOP nunca
        se pueden ignorar ni atrapar. Linux cambia algunos números respecto a System V por lo que
        siempre conviene usar los nombres simbólicos del header signal.h en lugar de números. La
        syscall kill envía una señal a un PID, a un grupo o a múltiples procesos según el signo
        y valor del primer argumento. raise es atajo para enviarse señales a uno mismo. Conocer
        las 19 señales canónicas y su acción por defecto es el alfabeto del programador de
        sistemas UNIX.
      </Callout>
    </>
  );
}
