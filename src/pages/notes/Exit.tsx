import { P, H2, H3, Code, Callout, CodeExplain } from '../../components/ui/Prose';

export default function Exit() {
  return (
    <>
      <P>
        Todo proceso, tarde o temprano, tiene que morir. Lo ideal es que muera por su propia
        voluntad, ordenadamente, avisando que ya terminó lo que tenía que hacer. Eso es lo que
        intentan resolver dos llamadas hermanas muy parecidas en nombre pero distintas en
        modales: <em>_exit</em> y <em>exit</em>. La primera es directa y casi brutal: cierra el
        proceso de inmediato. La segunda hace antes una limpieza por nosotros, deja todo
        ordenado y luego, al final del recorrido, también termina llamando a la primera.
      </P>

      <H2>Cómo termina un proceso</H2>
      <P>
        Un proceso puede terminar de dos formas. Si todo salió bien, lo llamamos terminación
        normal. Si algo lo mató de fuera, por ejemplo una señal, hablamos de terminación
        anormal. En este apunte nos interesa la primera, la pacífica. Para irse por la puerta
        grande, el proceso debe pedirle al sistema operativo que cierre todo. Esa petición se
        hace con una llamada al sistema.
      </P>

      <H2>_exit, la salida directa</H2>
      <P>
        La forma más simple de terminar es invocando <em>_exit</em>. Esta función recibe un
        número entero llamado <em>status</em>, y ese número es la herencia que el proceso le
        deja a su padre cuando este pregunte por él usando <em>wait</em>. Aunque el argumento
        sea un entero completo, en realidad el padre solo verá los últimos 8 bits del valor.
        Por eso conviene usar números pequeños, entre 0 y 255.
      </P>
      <P>
        Existe una convención muy útil: si el proceso terminó bien, debe devolver 0. Cualquier
        otro número se entiende como “algo salió mal”. Esto le sirve al padre, a los scripts
        de shell y a programas como Make para decidir si continúan o si paran porque hubo un
        error.
      </P>

      <Code title="_exit.h">{`#include <unistd.h>

void _exit(int status);`}</Code>

      <H2>exit, la salida con buenos modales</H2>
      <P>
        En lugar de cerrar el proceso de un portazo, <em>exit</em> hace antes una serie de
        tareas que vale la pena entender. Primero libera los recursos que el proceso estaba
        usando, deja todo preparado para que el sistema lo elimine, lo retira de la cola del
        planificador y, finalmente, le avisa al padre con una señal llamada <em>SIGCHLD</em>.
        Justo después llama a <em>_exit</em> con el mismo <em>status</em> que recibió, así que
        el resultado final es el mismo: el proceso termina y deja un código de salida.
      </P>

      <Callout tone="info" title="El paso intermedio: zombie">
        Entre el momento en que el proceso termina y el momento en que el padre lo recoge con
        <em> wait</em>, el proceso queda en un estado especial llamado <strong>zombie</strong>.
        No está ejecutando nada, pero todavía aparece en la tabla de procesos porque guarda su
        código de salida. En cuanto el padre llama <em>wait</em>, el sistema le entrega ese
        código y el zombie desaparece para siempre.
      </Callout>

      <P>
        Hay un caso curioso: si el padre se murió antes que el hijo, el hijo se queda sin
        nadie que lo recoja. En Linux esto se resuelve fácil: el proceso <em>init</em>, que
        tiene PID 1, lo adopta. Así, cuando el hijo termine, init se encargará de hacer el
        <em> wait</em> y limpiarlo. Ningún proceso queda flotando sin padre.
      </P>

      <Code title="exit.h">{`#include <stdlib.h>

void exit(int status);`}</Code>

      <H2>Consultar el código desde la terminal</H2>
      <P>
        Cuando un programa termina, su código de salida no se pierde. Desde la shell de Linux
        podemos preguntar por el último valor usando la variable de entorno especial
        <em> ?</em>. Si escribimos <em>echo $?</em> justo después de ejecutar un programa,
        veremos qué número devolvió. Esa es una forma rápida de comprobar si una herramienta
        terminó correctamente o si reportó algún problema.
      </P>

      <H2>_exit y exit puestos lado a lado</H2>
      <P>
        Las dos terminan el proceso. La diferencia está en lo que hacen antes. <em>_exit</em>
        es como cerrar la puerta y salir corriendo. <em>exit</em> es apagar las luces,
        desconectar todo, cerrar la puerta y entonces irse. Para programas normales casi
        siempre conviene usar <em>exit</em>, porque la limpieza que hace evita que se queden
        cosas a medias, como archivos sin cerrar.
      </P>

      <H2>Ejemplo. wait y un solo hijo</H2>
      <P>
        El siguiente programa crea un proceso hijo y luego el padre lo espera con
        <em> wait</em>. Es el patrón base para entender cómo se conectan la terminación del
        hijo y la espera del padre.
      </P>

      <CodeExplain
        title="ejemplo_wait.c"
        lines={[
          { code: '#include <sys/types.h>' },
          { code: '#include <sys/wait.h>', note: 'Aquí vive la llamada wait.' },
          { code: '#include <unistd.h>', note: 'Aquí vive fork.' },
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>', note: 'Aquí vive exit y las constantes EXIT_SUCCESS y EXIT_FAILURE.' },
          { code: 'int main()' },
          { code: '{' },
          { code: '    pid_t hijo;', note: 'Aquí guardamos el PID que devuelve fork.' },
          { code: '    int estado;', note: 'Aquí guardará wait el código de terminación del hijo.' },
          { code: '    if ((hijo = fork()) == -1) {', note: 'Si fork falla, no hay hijo. Mejor avisar y salir con error.' },
          { code: '        perror("fallo el fork");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    else if (hijo == 0)', note: 'El hijo cae aquí porque fork le devuelve 0.' },
          { code: '        fprintf(stderr, "soy el hijo con pid = %ld\\n", (long) getpid());' },
          { code: '    else if (wait(&estado) != hijo)', note: 'El padre espera. Si lo que vuelve no coincide con el PID del hijo, algo lo interrumpió.' },
          { code: '        fprintf(stderr, "una senal debio interrumpir la espera\\n");' },
          { code: '    else', note: 'Camino feliz: el padre recogió a su hijo sin sobresaltos.' },
          { code: '        fprintf(stderr, "soy el padre %ld y el hijo %ld\\n",' },
          { code: '                (long) getpid(), (long) hijo);' },
          { code: '    exit(EXIT_SUCCESS);', note: 'Salida limpia, código 0. Buenos modales.' },
          { code: '}' },
        ]}
      />

      <H2>Ejemplo. waitpid con varios hijos</H2>
      <P>
        Cuando un programa lanza varios hijos al mismo tiempo, el padre necesita recogerlos
        uno por uno. La llamada <em>waitpid</em> es la versión flexible de <em>wait</em>: nos
        deja decidir a qué hijo esperar y con qué opciones. En este ejemplo el padre crea
        varios hijos, cada uno calcula un factorial, imprime el resultado y termina. Luego el
        padre los recoge en un bucle.
      </P>

      <CodeExplain
        title="ejemplo_waitpid.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <sys/wait.h>' },
          { code: '#include <unistd.h>' },
          { code: 'int main(int argc, char *argv[])' },
          { code: '{' },
          { code: '    pid_t hijo[5];', note: 'Guardamos los PIDs de los hijos para identificarlos al recogerlos.' },
          { code: '    int estado, i, j;' },
          { code: '    long factorial = 1;' },
          { code: '    for (j = 0; j < argc - 1; j++) {', note: 'Por cada argumento que llegó por línea de comandos, creamos un hijo.' },
          { code: '        if ((hijo[j] = fork()) == -1) {' },
          { code: '            perror("fallo el fork");' },
          { code: '            exit(EXIT_FAILURE);' },
          { code: '        }' },
          { code: '        else if (hijo[j] == 0) {', note: 'Camino del hijo.' },
          { code: '            fprintf(stdout, "soy el hijo con pid = %ld\\n", (long) getpid());' },
          { code: '            for (i = atol(argv[j + 1]); i > 0; i--)' },
          { code: '                factorial = factorial * i;', note: 'Cada hijo calcula su propio factorial.' },
          { code: '            fprintf(stdout, "El factorial es: %ld\\n", factorial);' },
          { code: '            sleep(2);' },
          { code: '            exit(EXIT_SUCCESS);', note: 'El hijo termina con buenos modales. Su código llegará al padre.' },
          { code: '        }' },
          { code: '    }' },
          { code: '    for (j = 0; j < argc - 1; j++) {', note: 'El padre recoge a sus hijos, uno por iteración.' },
          { code: '        if (waitpid(-1, &estado, 0) == -1)', note: 'El -1 significa esperar a cualquier hijo, sin filtros.' },
          { code: '            fprintf(stderr, "una senal debio interrumpir la espera\\n");' },
          { code: '        else' },
          { code: '            fprintf(stdout, "el hijo %d con pid %ld termino\\n",' },
          { code: '                    j, (long) hijo[j]);' },
          { code: '    }' },
          { code: '    exit(EXIT_SUCCESS);' },
          { code: '}' },
        ]}
      />

      <H2>Qué aprendimos en esta nota</H2>
      <P>
        Pensemos en un proceso como un visitante en una oficina. Cuando termina su trámite
        puede salir de dos maneras. Con <em>_exit</em> sale corriendo por la puerta sin
        avisar a nadie, sin recoger sus cosas, sin firmar la salida. Con <em>exit</em>
        antes de salir pasa por recepción, devuelve la credencial, apaga la luz de su
        cubículo y firma el libro de visitas. Las dos formas lo sacan de la oficina, pero
        solo la segunda deja todo en orden.
      </P>
      <P>
        Entendimos también que terminar no es desaparecer del todo. El proceso deja un
        recibo con un número, el código de salida, que el padre podrá leer más tarde con
        <em> wait</em>. Ese recibo es lo único que sobrevive durante un instante en la
        tabla del kernel. Por convención, el cero significa que todo salió bien y cualquier
        otro número significa que hubo algún problema. Esa convención es la que usan los
        scripts, los Makefile y las shells para decidir si continuar o detenerse cuando
        algo falla.
      </P>
      <P>
        Aprendimos que <em>exit</em> no solo termina al proceso, sino que también avisa al
        padre con la señal <em>SIGCHLD</em>, libera memoria, cierra archivos y deja al
        proceso preparado para ser recogido. Mientras espera ser recogido, vive un
        momento intermedio llamado zombi, que veremos a fondo en la siguiente nota. Si el
        padre se fue primero, no pasa nada: el proceso init, que tiene PID 1, adopta al
        huérfano y lo recoge en lugar del padre original. El sistema siempre encuentra la
        forma de cerrar el ciclo, pero como buenos programadores nos toca a nosotros
        terminar a tiempo y con buenos modales.
      </P>
    </>
  );
}
