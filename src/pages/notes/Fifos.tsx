import { P, H2, H3, List, Code, Callout, CodeExplain } from '../../components/ui/Prose';

export default function Fifos() {
  return (
    <>
      <P>
        Las pipes anónimas que vimos en la nota anterior son útiles, pero arrastran una limitación
        importante: solo sirven para procesos con un <strong>ancestro común</strong>. Si quieres que dos
        procesos sin relación de parentesco se comuniquen, las pipes se quedan cortas. Para resolver
        eso existen las <strong>tuberías con nombre</strong>, también conocidas como <em>FIFO</em>
        (First-In, First-Out), que son tuberías a las que el sistema operativo les pone <em>nombre</em>
        y <em>ruta</em> dentro del sistema de archivos.
      </P>

      <Callout tone="info" title="El nombre lo cambia todo">
        Una pipe anónima solo existe en memoria, asociada a los descriptores que el kernel entrega tras
        <em> pipe()</em>. Una FIFO, en cambio, aparece en el sistema de archivos como un archivo especial
        (puedes verlo con <em>ls -l</em>: empieza con <strong>p</strong>). Cualquier proceso con permisos
        suficientes puede abrirlo, independientemente de quién lo creó.
      </Callout>

      <H2>La función mkfifo()</H2>
      <P>
        El sistema de llamado <em>mkfifo()</em> permite crear un archivo especial de tipo FIFO. A
        diferencia de <em>pipe()</em>, no devuelve descriptores: solo crea el archivo. Para usarlo, los
        procesos deben abrirlo con <em>open()</em> como cualquier otro archivo.
      </P>

      <Code title="mkfifo.h">{`#include <sys/types.h>
#include <sys/stat.h>

int mkfifo(const char *pathname, mode_t mode);`}</Code>

      <List>
        <li><strong>pathname</strong>: nombre y ruta donde se creará el archivo FIFO.</li>
        <li><strong>mode</strong>: permisos (atributos) del archivo, igual que para un archivo regular. Típicamente un valor en octal como <em>0666</em>.</li>
      </List>

      <P>
        La función retorna <strong>0</strong> en caso de éxito y <strong>-1</strong> en caso de error. Si
        falla, la variable global <em>errno</em> indica el tipo de error: por ejemplo, <em>EEXIST</em> si
        el archivo ya existía, o <em>EACCES</em> si no tienes permiso para crearlo en esa ruta.
      </P>

      <H2>El comportamiento bloqueante de la apertura</H2>
      <P>
        Una vez creado un archivo FIFO, cualquier proceso puede abrirlo para lectura o escritura, como
        un archivo ordinario. Pero hay un detalle importante: <strong>debe estar abierto en ambos
        extremos simultáneamente</strong> antes de que pueda realizarse cualquier operación de E/S.
      </P>
      <List>
        <li>Abrir un FIFO para <strong>lectura</strong> bloquea hasta que <em>otro</em> proceso lo abra para escritura.</li>
        <li>Abrir un FIFO para <strong>escritura</strong> bloquea hasta que <em>otro</em> proceso lo abra para lectura.</li>
      </List>

      <Callout tone="warn" title="Por qué bloquea al abrir">
        Este comportamiento puede parecer raro al principio, pero tiene sentido: el kernel no quiere
        transportar datos hacia un destino que no existe ni aceptar lecturas de una tubería que nadie
        va a alimentar. Si quieres evitar este bloqueo, puedes abrir con la bandera <em>O_NONBLOCK</em>:
        <em> open()</em> retorna de inmediato, pero entonces tendrás que manejar el caso de que el otro
        extremo aún no esté listo.
      </Callout>

      <H2>Ejemplo. FIFO entre padre e hijo</H2>
      <P>
        Aunque las FIFOs brillan cuando comunican procesos sin parentesco, el ejemplo más simple sigue
        siendo padre e hijo, porque permite ver el ciclo completo: crear el archivo, hacer <em>fork()</em>,
        que cada proceso lo abra por su extremo, transferir datos y limpiar.
      </P>

      <CodeExplain
        title="fifo_basico.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <sys/stat.h>', note: 'Aquí vive mkfifo() y los macros de permisos.' },
          { code: '#include <fcntl.h>', note: 'Banderas para open(): O_RDONLY, O_WRONLY, etc.' },
          { code: '#include <unistd.h>' },
          { code: 'int main(void) {' },
          { code: '    pid_t hijo;' },
          { code: '    int file;', note: 'Descriptor de archivo que devolvera open() al abrir el FIFO.' },
          { code: '    char mensaje[20];' },
          { code: '    unlink("namepipe");', note: 'Borra el archivo si existia de una ejecucion anterior. Sin esto, mkfifo() fallaria con EEXIST.' },
          { code: '    umask(~0666);', note: 'Ajusta la mascara de permisos para que los 0666 de mkfifo se respeten tal cual.' },
          { code: '    if (mkfifo("namepipe", 0666) == -1) {', note: 'Crea el archivo FIFO en el directorio actual con permisos rw-rw-rw-.' },
          { code: '        perror("error en mkfifo");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    if ((hijo = fork()) == 0) {', note: 'Camino del HIJO. Sera el escritor.' },
          { code: '        fprintf(stdout, "soy el hijo, ID=%ld\\n", (long)getpid());' },
          { code: '        if ((file = open("namepipe", O_WRONLY)) == -1) {', note: 'Abre el FIFO en modo escritura. BLOQUEA hasta que el padre lo abra para lectura.' },
          { code: '            perror("error en mkfifo");' },
          { code: '            exit(EXIT_FAILURE);' },
          { code: '        }' },
          { code: '        write(file, "soy el hijo,ID...\\n", 20);', note: 'Envia el mensaje al padre a traves del FIFO.' },
          { code: '        close(file);' },
          { code: '        getchar();', note: 'Pausa el hijo para que el archivo no se borre antes de que termines de observarlo en el sistema.' },
          { code: '        exit(EXIT_SUCCESS);' },
          { code: '    }' },
          { code: '    if (hijo > 0) {', note: 'Camino del PADRE. Sera el lector.' },
          { code: '        fprintf(stdout, "soy el padre, ID = %ld\\n", (long)getpid());' },
          { code: '        if ((file = open("namepipe", O_RDONLY)) == -1) {', note: 'Abre el FIFO en modo lectura. Tambien bloquea hasta que el otro extremo este abierto.' },
          { code: '            perror("error en open O_RDONLY");' },
          { code: '            exit(EXIT_FAILURE);' },
          { code: '        }' },
          { code: '        read(file, mensaje, 20);', note: 'Lee del FIFO. Cuando ambos extremos esten abiertos, los datos fluyen como en una pipe normal.' },
          { code: '        fprintf(stdout, "%s\\n", mensaje);' },
          { code: '        close(file);' },
          { code: '    }' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <H3>Diferencias prácticas con una pipe anónima</H3>
      <List>
        <li>La FIFO <strong>existe en el sistema de archivos</strong>: la puedes ver con <em>ls -l</em>, borrar con <em>rm</em> o <em>unlink()</em>, y reutilizar entre ejecuciones.</li>
        <li>Procesos <strong>sin parentesco</strong> pueden conectarse: basta con que ambos conozcan la ruta y tengan permisos.</li>
        <li>El acto de <em>abrir</em> tiene semántica de <strong>rendezvous</strong>: lector y escritor deben coincidir para que la apertura desbloquee.</li>
        <li>Una vez abierta, la lectura y escritura funcionan <strong>igual</strong> que en una pipe: bytes en orden, FIFO puro.</li>
      </List>

      <Callout tone="success" title="Cuándo elegir una FIFO">
        Las FIFOs son ideales cuando dos programas independientes necesitan intercambiar datos puntuales en
        la misma máquina, sin montar una arquitectura de sockets ni compartir memoria. Son el equivalente
        a dejar un buzón con nombre en el sistema de archivos: cualquiera con la dirección puede dejar
        o recoger correo.
      </Callout>

      <H2>Resumen mental</H2>
      <List>
        <li><em>mkfifo()</em> crea un archivo especial de tipo FIFO con una ruta y permisos dados.</li>
        <li>Cualquier proceso con permisos puede <em>open()</em> ese archivo para leer o escribir.</li>
        <li>La apertura <strong>bloquea</strong> hasta que el otro extremo también esté abierto (salvo con <em>O_NONBLOCK</em>).</li>
        <li>Permite comunicar procesos <strong>sin relación de parentesco</strong>, a diferencia de las pipes anónimas.</li>
        <li>La transferencia de datos es <strong>FIFO puro</strong>: los bytes llegan en el orden en que se escribieron.</li>
      </List>
    </>
  );
}
