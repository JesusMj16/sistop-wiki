import { P, H2, H3, List, Code, Callout, Table } from '../../components/ui/Prose';

export default function IntroIPC() {
  return (
    <>
      <P>
        Hasta ahora hemos tratado a los procesos como si vivieran cada uno en su propia burbuja: tienen su PID,
        su espacio de memoria, sus descriptores y siguen su vida sin meterse con el vecino. Esa aislación es,
        en realidad, una de las grandes virtudes del sistema operativo. Pero en cuanto queremos construir
        algo serio, surge una pregunta inevitable: <strong>¿cómo hacemos para que dos procesos colaboren?</strong>
        Ahí es donde entra <em>IPC</em> (Inter-Process Communication), un conjunto de mecanismos que el kernel
        ofrece para que los procesos puedan intercambiar datos y sincronizarse sin romper su aislamiento.
      </P>

      <H2>Procesos independientes vs procesos cooperativos</H2>
      <P>
        El sistema operativo distingue dos grandes familias de procesos según su relación con los demás.
        Un proceso es <strong>independiente</strong> si no afecta ni es afectado por otros: corre solo, su ejecución
        no depende de nadie. Un proceso es <strong>cooperativo</strong> si comparte datos, sincroniza pasos o
        delega trabajo a otros procesos para alcanzar un objetivo común.
      </P>
      <List>
        <li><strong>Independiente:</strong> ejemplo típico es una calculadora local, un comando <em>ls</em>, una utilidad que abre, hace su trabajo y termina.</li>
        <li><strong>Cooperativo:</strong> un navegador web con sus procesos por pestaña, un servidor que delega cada conexión en un hijo, una shell que canaliza la salida de un comando hacia otro con <em>|</em>.</li>
      </List>

      <H2>¿Por qué los procesos necesitan cooperar?</H2>
      <P>
        Hacer que los procesos cooperen no es un capricho. Hay razones muy concretas por las que el diseño
        moderno de software depende de IPC casi en todos lados:
      </P>
      <List>
        <li><strong>Compartir información:</strong> varios procesos pueden necesitar el mismo recurso a la vez, como un archivo de configuración, un buffer de logs o una caché común.</li>
        <li><strong>Acelerar el cómputo:</strong> dividir una tarea en piezas que distintos procesos resuelven en paralelo permite aprovechar varios núcleos del CPU.</li>
        <li><strong>Modularidad:</strong> separar un sistema grande en procesos pequeños, cada uno con una responsabilidad clara, hace el software más mantenible y resistente a fallos.</li>
        <li><strong>Conveniencia:</strong> el mismo usuario suele tener varias tareas en paralelo (editor, compilador, navegador, terminal) que ocasionalmente deben intercambiar datos.</li>
      </List>

      <Callout tone="info" title="La paradoja del aislamiento">
        El sistema operativo se esfuerza por <strong>aislar</strong> los procesos para protegerlos entre sí, pero
        al mismo tiempo debe ofrecerles canales <strong>controlados</strong> para comunicarse. IPC es ese punto medio:
        comunicar sin romper la protección.
      </Callout>

      <H2>Los dos grandes modelos de IPC</H2>
      <P>
        Aunque existen muchos mecanismos concretos, todos se reducen a uno de dos enfoques fundamentales.
        Entender la diferencia es clave porque marca qué primitivas vas a usar y qué problemas vas a tener
        que resolver.
      </P>

      <H3>1. Memoria compartida</H3>
      <P>
        El kernel reserva una región de memoria a la que <strong>varios procesos</strong> pueden acceder como
        si fuera parte de su propio espacio de direcciones. Escribir o leer en esa región es tan rápido como
        un acceso a memoria normal, sin pasar por llamadas al sistema en cada operación. Es el modelo <em>más rápido</em>,
        pero también el más peligroso: el programador queda a cargo de coordinar los accesos para evitar
        condiciones de carrera.
      </P>

      <H3>2. Paso de mensajes</H3>
      <P>
        Los procesos no comparten memoria. En su lugar, intercambian mensajes a través del kernel mediante
        primitivas como <em>send()</em> y <em>receive()</em>. Es más lento porque cada operación implica una
        llamada al sistema y copias de datos, pero es <em>más seguro</em>: el propio mecanismo se encarga de
        sincronizar emisor y receptor.
      </P>

      <Table
        headers={['Aspecto', 'Memoria compartida', 'Paso de mensajes']}
        rows={[
          ['Velocidad', 'Muy rápida (acceso directo)', 'Más lenta (pasa por el kernel)'],
          ['Sincronización', 'A cargo del programador', 'Implícita en send/receive'],
          ['Riesgo de errores', 'Alto (condiciones de carrera)', 'Bajo'],
          ['Uso típico', 'Grandes volúmenes de datos', 'Coordinación entre procesos'],
        ]}
      />

      <H2>Mecanismos concretos en UNIX/Linux</H2>
      <P>
        El kernel de Linux ofrece varias implementaciones de IPC. Cada una tiene su nicho: unas son
        rápidas pero limitadas a procesos relacionados, otras funcionan entre máquinas distintas a costa
        de overhead adicional. Vamos a enumerar las más importantes para ubicarte antes de profundizar
        en cada una.
      </P>

      <List>
        <li><strong>Pipes (tuberías anónimas):</strong> un canal unidireccional entre un proceso y su descendiente. Es lo que pasa por debajo cuando escribes <em>ls | wc -l</em> en la shell.</li>
        <li><strong>FIFOs (tuberías con nombre):</strong> como las pipes, pero con un nombre en el sistema de archivos, lo que permite que procesos sin relación de parentesco se comuniquen.</li>
        <li><strong>Colas de mensajes:</strong> el kernel mantiene una cola en la que los procesos depositan o extraen mensajes con prioridad y tipo.</li>
        <li><strong>Memoria compartida:</strong> el mecanismo más rápido. Una región de memoria visible para varios procesos a la vez.</li>
        <li><strong>Semáforos:</strong> contadores enteros que el kernel administra para sincronizar accesos a recursos compartidos. Casi siempre acompañan a la memoria compartida.</li>
        <li><strong>Señales:</strong> notificaciones asíncronas de un evento (SIGINT, SIGCHLD, SIGTERM...). Sirven para alertar, no para transportar datos.</li>
        <li><strong>Sockets:</strong> el más versátil. Comunican procesos en la misma máquina o en máquinas distintas a través de la red.</li>
      </List>

      <Callout tone="warn" title="No todos sirven para lo mismo">
        Elegir el mecanismo equivocado es una fuente común de problemas. Por ejemplo, usar señales para
        transportar datos termina mal: las señales pueden perderse o llegar fuera de orden. Usar memoria
        compartida sin semáforos garantiza condiciones de carrera. La regla práctica es: <em>identifica
        primero si necesitas transportar datos, sincronizar, o ambos</em>, y luego elige.
      </Callout>

      <H2>Un primer vistazo: pipe en C</H2>
      <P>
        Para que veas lo cercano que está esto al código que ya conoces, aquí va el ejemplo mínimo de una
        pipe entre padre e hijo. No profundizaremos aún, solo es para que tengas una referencia visual del
        tipo de API con el que vamos a trabajar.
      </P>

      <Code title="pipe_minimal.c">{`#include <stdio.h>
#include <unistd.h>
#include <string.h>

int main(void) {
    int fd[2];
    char buf[64];

    pipe(fd);

    if (fork() == 0) {
        close(fd[0]);
        write(fd[1], "hola padre", 11);
        return 0;
    }

    close(fd[1]);
    read(fd[0], buf, sizeof(buf));
    printf("Padre recibio: %s\\n", buf);
    return 0;
}`}</Code>

      <P>
        El padre crea una pipe con <em>pipe()</em>, hace <em>fork()</em>, y a partir de ahí el hijo escribe
        en un extremo mientras el padre lee del otro. Es el mismo patrón <em>fork + canal</em> que veremos
        repetido, con variaciones, en los demás mecanismos.
      </P>

      <H2>Lo que vamos a estudiar a continuación</H2>
      <P>
        Cada uno de los mecanismos anteriores merece su propia nota. En las siguientes secciones iremos
        viendo, con código y diagramas, cómo se usan en la práctica, qué problemas resuelven y qué errores
        evitar. La idea es que al final puedas mirar un programa concurrente real y reconocer al instante
        qué primitiva de IPC tiene sentido en cada punto.
      </P>

      <Callout tone="success" title="Idea para llevarte">
        IPC no es un tema aislado: es el pegamento que permite que el resto de lo que hemos visto (procesos,
        forks, waits) se convierta en software útil. Sin IPC, los procesos son islas; con IPC, son piezas
        de un sistema mayor.
      </Callout>
    </>
  );
}
