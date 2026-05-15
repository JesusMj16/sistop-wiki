import { P, H2, H3, List, Code, Callout, CodeExplain } from '../../components/ui/Prose';

export default function Pipes() {
  return (
    <>
      <P>
        Las <strong>tuberías sin nombre</strong>, también llamadas <em>pipes</em>, son una de las formas más
        antiguas de IPC y están presentes en todos los sistemas UNIX y derivados. Su gran virtud es la
        simplicidad: un canal de bytes entre dos procesos, con un extremo para escribir y otro para leer.
        Pero esa simplicidad tiene un precio en forma de <em>dos limitaciones</em> que conviene tener muy claras
        antes de empezar a programar con ellas.
      </P>

      <List>
        <li><strong>Son unidireccionales:</strong> los datos fluyen en una sola dirección. Si necesitas comunicación en ambos sentidos, hay que crear dos pipes.</li>
        <li><strong>Solo entre procesos con un ancestro común:</strong> normalmente se crean en un proceso y luego se heredan al hijo vía <em>fork()</em>. Dos procesos sin relación no pueden compartir una pipe anónima.</li>
      </List>

      <Callout tone="info" title="El patrón típico">
        El uso clásico es: el padre crea la pipe con <em>pipe()</em>, hace <em>fork()</em> y a partir de
        ese momento padre e hijo comparten los dos descriptores. Cada uno cierra el extremo que no va a
        usar y se comunican por el que les quedó abierto.
      </Callout>

      <H2>Prototipos de las funciones</H2>
      <P>
        Una tubería sin nombre se crea llamando a la función <em>pipe()</em> o, en GNU/Linux a partir de
        la versión 2.6.27 (con glibc 2.9), también a la función <em>pipe2()</em>, que añade un parámetro
        de banderas. Sus prototipos son:
      </P>

      <Code title="pipe.h">{`#include <unistd.h>

int pipe(int filedes[2]);
int pipe2(int filedes[2], int flags);`}</Code>

      <P>
        El valor retornado es <strong>0</strong> si todo está correcto y <strong>-1</strong> si existe un error.
        Los dos descriptores se devuelven a través del argumento <em>filedes</em>, donde:
      </P>
      <List>
        <li><strong>filedes[0]</strong>: extremo de <em>lectura</em>. Se usa con <em>read()</em>.</li>
        <li><strong>filedes[1]</strong>: extremo de <em>escritura</em>. Se usa con <em>write()</em>.</li>
      </List>
      <P>
        Normalmente, la salida de <em>filedes[1]</em> es la entrada para <em>filedes[0]</em>: lo que un
        proceso escribe en el extremo de escritura, el otro proceso lo lee del extremo de lectura.
      </P>

      <H2>Las banderas de pipe2()</H2>
      <P>
        En la función <em>pipe2()</em>, si <em>flags</em> vale <strong>0</strong>, su comportamiento es
        semejante al de <em>pipe()</em>. Mediante operaciones OR bit a bit sobre <em>flags</em> se pueden
        combinar las siguientes opciones:
      </P>

      <List>
        <li><strong>O_CLOEXEC</strong>: establece el indicador de <em>cierre al ejecutar</em> (FD_CLOEXEC) en los dos nuevos descriptores. Si después llamas <em>exec()</em>, los descriptores se cerrarán automáticamente. Útil para no filtrar pipes a un nuevo programa.</li>
        <li><strong>O_DIRECT</strong> (a partir de GNU/Linux 3.4): crea una tubería que realiza E/S en modo <em>paquete</em>. Cada <em>write()</em> se procesa como un paquete independiente y cada <em>read()</em> lee un paquete a la vez.</li>
        <li><strong>O_NONBLOCK</strong>: establece el indicador de estado de archivo no-bloqueante. Las lecturas y escrituras retornan inmediatamente con error si no pueden completarse, en vez de bloquearse.</li>
      </List>

      <Callout tone="warn" title="Detalles de O_DIRECT">
        El modo paquete tiene reglas finas que conviene memorizar:
        <List>
          <li>Las escrituras de más de <em>PIPE_BUF</em> bytes (definido en <em>&lt;limits.h&gt;</em>) se dividen en varios paquetes.</li>
          <li>Si una lectura especifica un buffer menor al siguiente paquete, se leen los bytes pedidos y los sobrantes del paquete se <em>descartan</em>.</li>
          <li>No se admiten paquetes de longitud cero: un <em>read()</em> con tamaño 0 no es operativo y devuelve 0.</li>
          <li>Los kernels antiguos que no soportan O_DIRECT devolverán <em>EINVAL</em>.</li>
        </List>
      </Callout>

      <H2>Ejemplo. Tubería heredada del padre al hijo</H2>
      <P>
        El siguiente programa crea una tubería en el padre, hace <em>fork()</em>, y los dos procesos se
        comunican a través de ella: el padre escribe un mensaje y el hijo lo lee y lo imprime por la
        salida estándar.
      </P>

      <CodeExplain
        title="pipe_basico.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <unistd.h>', note: 'Aquí viven pipe(), fork(), read(), write() y close().' },
          { code: '#include <sys/wait.h>' },
          { code: '#define MAXLINEA 80' },
          { code: 'int main() {' },
          { code: '    int n, fd[2];', note: 'fd[0] sera el extremo de lectura; fd[1] el de escritura.' },
          { code: '    pid_t hijo;' },
          { code: '    char linea[MAXLINEA];' },
          { code: '    if (pipe(fd) < 0) {', note: 'Crear la tuberia ANTES de fork() es obligatorio: solo asi el hijo hereda los descriptores.' },
          { code: '        fprintf(stderr, "error de pipe");' },
          { code: '        exit(0);' },
          { code: '    }' },
          { code: '    if ((hijo = fork()) < 0) {' },
          { code: '        fprintf(stderr, "error de fork");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    } else if (hijo > 0) {', note: 'Camino del PADRE. fork() devolvio el PID del hijo (>0).' },
          { code: '        close(fd[0]);', note: 'El padre no va a leer, cierra el extremo de lectura. Mantener descriptores abiertos sin usar puede causar bloqueos.' },
          { code: '        write(fd[1], "hola mundo\\n", 12);', note: 'Escribe en el extremo de escritura. El hijo lo recibira por su extremo de lectura.' },
          { code: '    } else {', note: 'Camino del HIJO. fork() devolvio 0.' },
          { code: '        close(fd[1]);', note: 'El hijo no va a escribir, cierra el extremo de escritura.' },
          { code: '        n = read(fd[0], linea, MAXLINEA);', note: 'Bloquea hasta que haya datos. Devuelve el numero de bytes leidos.' },
          { code: '        write(STDOUT_FILENO, linea, n);', note: 'Vuelca lo recibido a la salida estandar.' },
          { code: '    }' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <H3>Cuidado con el orden de ejecución</H3>
      <P>
        En ocasiones el <strong>padre se ejecuta más rápido que el hijo</strong> y el resultado por pantalla
        no coincide con lo esperado. El planificador no garantiza un orden particular. Una solución común es
        invertir los caminos en el <em>if</em>: que el hijo sea quien escriba y el padre quien lea,
        agregando además un contador del número de bytes recibidos.
      </P>

      <CodeExplain
        title="pipe_intercambiado.c"
        lines={[
          { code: '#include <unistd.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <sys/wait.h>' },
          { code: '#include <stdio.h>' },
          { code: '#define MAXLINE 80' },
          { code: 'int main() {' },
          { code: '    int n, fd[2];' },
          { code: '    pid_t hijo;' },
          { code: '    char linea[MAXLINE];' },
          { code: '    int estado;' },
          { code: '    if (pipe(fd) < 0) { fprintf(stderr, "error de tuberia"); exit(EXIT_FAILURE); }' },
          { code: '    if ((hijo = fork()) == 0) {', note: 'Ahora el HIJO entra primero al if: el escribe.' },
          { code: '        close(fd[0]);' },
          { code: '        write(fd[1], "hola mundo \\n", 12);' },
          { code: '    } else {', note: 'El PADRE lee. Si el hijo aun no escribio, read() bloquea hasta que haya datos.' },
          { code: '        close(fd[1]);' },
          { code: '        n = read(fd[0], linea, MAXLINE);' },
          { code: '        write(STDOUT_FILENO, linea, n);' },
          { code: '        printf("numero de lineas %d \\n", n);' },
          { code: '    }' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <Callout tone="success" title="Regla práctica">
        Por cada pipe que uses, cierra siempre el extremo que NO vas a usar en cada proceso. Si dejas un
        extremo de escritura abierto en un proceso lector, este nunca verá EOF y se quedará bloqueado en
        <em> read()</em> esperando datos que jamás llegarán.
      </Callout>

      <H2>Resumen mental</H2>
      <List>
        <li><em>pipe()</em> devuelve dos descriptores: <strong>fd[0]</strong> lectura, <strong>fd[1]</strong> escritura.</li>
        <li>Es <strong>unidireccional</strong>: para comunicación bidireccional se necesitan dos pipes.</li>
        <li>Solo funciona entre procesos con un <strong>ancestro común</strong>, normalmente padre e hijo tras <em>fork()</em>.</li>
        <li>Cada proceso debe cerrar el extremo que no usa para evitar bloqueos.</li>
        <li><em>pipe2()</em> añade banderas como <strong>O_CLOEXEC</strong>, <strong>O_DIRECT</strong> y <strong>O_NONBLOCK</strong>.</li>
      </List>
    </>
  );
}
