import { P, H2, Code, Callout, CodeExplain, ZombieFlow } from '../../components/ui/Prose';

export default function Zombies() {
  return (
    <>
      <P>
        El estado zombi suena más dramático de lo que es. Se trata de un proceso que ya hizo
        su trabajo y terminó, pero que sigue apareciendo en la lista del sistema porque su
        padre todavía no lo recogió. Es un estado intermedio: ni vivo, ni del todo borrado.
      </P>

      <H2>Qué es un zombi en realidad</H2>
      <P>
        Cuando un proceso llama a <em>exit</em>, el kernel libera casi todo lo que tenía: su
        memoria, sus archivos abiertos, sus descriptores. Lo que no libera de inmediato es la
        pequeña entrada que guarda en la tabla de procesos. Esa entrada contiene el PID, el
        código de salida y un poco de información estadística. Se queda ahí porque el padre
        del proceso podría querer leer ese código con <em>wait</em> o <em>waitpid</em>.
      </P>
      <P>
        Mientras esa entrada exista y el padre no haya recogido al hijo, el proceso se llama
        zombi. No consume CPU, no consume memoria de usuario, no hace nada. Solo ocupa una
        línea en la tabla del kernel. Pero esa línea no se borra hasta que alguien la pida.
      </P>

      <Callout tone="info" title="Cómo verlo en la práctica">
        Desde otra terminal podemos ejecutar <em>ps -el</em> y filtrar por la letra Z, así:
        <strong> ps -el | grep Z</strong>. Si tenemos un zombi, aparecerá listado con esa
        marca. Esa Z es justo el estado <em>EXIT_ZOMBIE</em> dentro del kernel.
      </Callout>

      <H2>Por qué importa</H2>
      <P>
        Un zombi suelto no es peligroso. El problema empieza cuando un programa olvida llamar
        a <em>wait</em> y crea muchos hijos sin recogerlos. Cada uno deja su entrada zombi en
        la tabla. La tabla tiene un tamaño finito, y cuando se llena, el sistema ya no puede
        crear procesos nuevos. Por eso es buena costumbre tratar el <em>fork</em> y el
        <em> wait</em> como una pareja: si creamos un hijo, tarde o temprano tenemos que
        recogerlo.
      </P>

      <H2>Animación. Dos escenarios lado a lado</H2>
      <P>
        En la siguiente animación podemos comparar los dos casos típicos. En el primero el
        padre no llama a <em>wait</em> y deja un zombi. En el segundo el padre sí llama y la
        tabla queda limpia. Cambia entre los casos con los botones y avanza paso a paso para
        ver qué hace cada uno.
      </P>

      <ZombieFlow />

      <H2>Caso 1. Proceso zombi sin wait</H2>
      <P>
        Este programa crea un hijo que termina enseguida, pero el padre se duerme treinta
        segundos sin recogerlo. Durante esos treinta segundos el hijo está en estado zombi y
        podemos verlo con <em>ps</em> desde otra terminal.
      </P>

      <CodeExplain
        title="zombi_sin_wait.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <unistd.h>' },
          { code: 'int main(void) {' },
          { code: '    pid_t pid;' },
          { code: '    pid = fork();', note: 'A partir de aquí hay dos procesos vivos.' },
          { code: '    if (pid == 0) {', note: 'Camino del hijo.' },
          { code: '        printf("Hijo terminado. PID=%ld\\n",' },
          { code: '               (long) getpid());' },
          { code: '        exit(EXIT_SUCCESS);', note: 'El hijo termina y deja su entrada en la tabla esperando ser recogida.' },
          { code: '    } else {', note: 'Camino del padre.' },
          { code: '        printf("Padre en ejecucion. PID=%ld\\n",' },
          { code: '               (long) getpid());' },
          { code: '        sleep(30);', note: 'Treinta segundos sin llamar a wait. El hijo se queda como zombi.' },
          { code: '    }' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <P>
        Para confirmarlo, en otra terminal mientras el padre todavía duerme escribimos:
      </P>

      <Code title="terminal">{`ps -el | grep Z`}</Code>

      <P>
        El hijo aparece con la letra Z, lo que indica que está en estado zombi. Si esperamos
        a que el padre termine, la entrada se limpia, porque init adopta al hijo y le hace
        <em> wait</em> por nosotros.
      </P>

      <H2>Caso 2. Sin zombi, gracias a wait</H2>
      <P>
        Ahora el padre sí recoge al hijo. El cambio es pequeño en el código, una sola línea
        nueva, pero la diferencia en el sistema es total: ningún proceso queda flotando.
      </P>

      <CodeExplain
        title="zombi_con_wait.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <sys/wait.h>' },
          { code: '#include <unistd.h>' },
          { code: 'int main(void) {' },
          { code: '    pid_t pid;' },
          { code: '    int status;' },
          { code: '    pid = fork();' },
          { code: '    if (pid == 0) {', note: 'Camino del hijo.' },
          { code: '        printf("Hijo terminado. PID=%ld\\n",' },
          { code: '               (long) getpid());' },
          { code: '        exit(EXIT_SUCCESS);' },
          { code: '    } else {', note: 'Camino del padre.' },
          { code: '        wait(&status);', note: 'Esta es la diferencia clave. Bloquea al padre hasta que el hijo termine y entrega su código.' },
          { code: '        printf("Padre: hijo recolectado\\n");' },
          { code: '    }' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <P>
        Si corremos <em>ps</em> después de que el padre haya hecho <em>wait</em>, el hijo ya
        no aparece. El sistema lo limpió por completo.
      </P>

      <H2>Y si el padre termina antes</H2>
      <P>
        Existe un caso especial: el padre se muere antes que el hijo. En esa situación el
        hijo se queda sin alguien que lo espere. Linux resuelve el problema reasignando al
        hijo al proceso con PID 1, que en sistemas modernos es init o systemd. PID 1 llama
        a <em>wait</em> automáticamente cada vez que recibe la noticia de que un hijo
        adoptado terminó. El resultado es que tampoco queda zombi, aunque el padre original
        haya sido descuidado.
      </P>

      <H2>Qué aprendimos en esta nota</H2>
      <P>
        Pensemos en el estado zombi como ese envío que termina en la oficina de paquetería
        esperando a que alguien lo recoja. El paquete ya llegó, el repartidor ya hizo su
        trabajo, pero hasta que el destinatario no firme y se lo lleve, ocupa un casillero.
        Esos casilleros son una entrada en la tabla del kernel. Tienen un PID, un código de
        salida y un poco de estadística. No consumen luz, no consumen calefacción, pero sí
        un espacio físico que la oficina no puede reusar para nadie más.
      </P>
      <P>
        Entendimos que el zombi no es un error sino un acuerdo. Es la forma que tiene el
        kernel de guardarle al padre la información de cómo terminó su hijo. En el momento
        en que el padre llama a <em>wait</em> o <em>waitpid</em>, recibe el contenido del
        casillero y el sistema lo destruye. Si el padre nunca llega a recoger, el casillero
        se queda ocupado. Si esto pasa con muchos hijos, la oficina termina con todos los
        casilleros llenos y ya no puede recibir más envíos: el sistema deja de poder crear
        procesos.
      </P>
      <P>
        Aprendimos también que existe una red de seguridad. Si el padre se va antes de
        recoger, el sistema reasigna el zombi al proceso con PID 1, que es init o systemd
        en distribuciones modernas. Ese proceso especial siempre está atento, recoge a los
        huérfanos automáticamente y limpia los casilleros. La existencia de init no es
        excusa para olvidar el <em>wait</em>: depender de la limpieza ajena es código
        frágil. La regla práctica para llevarse a casa es sencilla: por cada
        <em> fork</em> que escribimos, en algún lugar del código debe haber un
        <em> wait</em> que recoja al hijo y mantenga la oficina del kernel ordenada.
      </P>
    </>
  );
}
