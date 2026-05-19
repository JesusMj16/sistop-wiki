import { P, H2, H3, List, Code, Callout, CodeExplain, FifoBlockingFlow } from '../../components/ui/Prose';

export default function Fifos() {
  return (
    <>
      <P>
        Antes de hablar de FIFOs, una imagen mental rápida. Imagina un <strong>tubo de plástico</strong> tirado
        en el suelo entre dos personas: uno por un lado mete pelotitas de papel; el otro las saca por el otro
        extremo en el mismo orden en que entraron. Eso es una <em>tubería</em>: un canal de un solo sentido
        donde lo primero que entra es lo primero que sale. La pipe anónima que vimos antes funciona así,
        pero el tubo es <em>invisible</em>: solo lo ven los procesos que comparten un mismo papá (porque
        heredan los descriptores tras un <em>fork()</em>).
      </P>

      <P>
        El problema empieza cuando los dos procesos que quieren hablar <strong>no son familia</strong>. Por
        ejemplo: un script que corres en tu terminal y un servidor que ya estaba corriendo de antes. No
        comparten ancestro, así que no hay manera de pasarles descriptores heredados. Necesitas un tubo
        que <strong>cualquiera pueda encontrar por su cuenta</strong>, y la forma natural de hacerlo en Unix
        es darle un <em>nombre</em>: ponerlo en el sistema de archivos como si fuera un archivo más. Eso es
        una <strong>FIFO</strong> (también llamada <em>named pipe</em>, tubería con nombre).
      </P>

      <Callout tone="info" title="Analogía: el buzón del edificio">
        Piensa en una pipe anónima como pasarle un sobre directamente a tu hermano en la cocina: solo
        funciona porque los dos están en la misma casa. La FIFO, en cambio, es un <strong>buzón del edificio</strong>
        con tu apellido escrito: cualquier vecino o cartero que conozca tu apellido puede dejar correo ahí,
        y cualquier persona con la llave puede recogerlo. No hace falta ser de la familia: basta con saber
        cómo se llama el buzón (su ruta) y tener permisos.
      </Callout>

      <H2>El archivo especial de tipo "p"</H2>
      <P>
        Cuando creas una FIFO, el kernel mete una entrada en el sistema de archivos que <strong>no es un
        archivo regular</strong>: no guarda contenido en disco, no tiene tamaño en bytes propio. Es solo
        un <em>punto de conexión</em>. Si haces <em>ls -l /tmp/namepipe</em>, el primer caracter de los
        permisos no es un guión (archivo) ni una <em>d</em> (directorio): es una <strong>p</strong> de pipe.
        Esa <em>p</em> es la pista visual de que ese "archivo" en realidad es la boca de un tubo viviendo
        en la RAM del kernel.
      </P>

      <Callout tone="info" title="Por qué no ocupa espacio en disco">
        El archivo FIFO existe solo como <em>inodo</em>: una entrada en el catálogo del sistema de archivos
        que apunta a una estructura interna del kernel (un buffer en RAM, típicamente de 64 KB en Linux).
        Si escribes 10 MB en una FIFO, esos 10 MB nunca tocan el disco: viajan por memoria del proceso
        escritor al buffer del kernel, y de ahí al proceso lector. El nombre en el FS es solo la dirección
        del buzón, no su contenido.
      </Callout>

      <H2>Cómo se crea: mkfifo()</H2>
      <P>
        La forma de crear el archivo especial es con la llamada al sistema <em>mkfifo()</em>. Importante:
        <em> mkfifo()</em> solo <strong>crea el archivo</strong>, no te devuelve ningún canal abierto. Es
        como construir el buzón: lo plantas en la entrada, pero todavía nadie está esperando correo ahí.
        Después, los procesos que quieran usarlo lo abren con <em>open()</em>, igual que abrirían cualquier
        archivo regular.
      </P>

      <Code title="mkfifo.h">{`#include <sys/types.h>
#include <sys/stat.h>

int mkfifo(const char *pathname, mode_t mode);`}</Code>

      <List>
        <li><strong>pathname</strong>: dónde quieres el buzón. Ejemplo: <em>"/tmp/buzon"</em> o <em>"./namepipe"</em>. Cualquier ruta válida en el sistema de archivos.</li>
        <li><strong>mode</strong>: los permisos del archivo en octal, igual que <em>chmod</em>. <em>0666</em> significa "lectura y escritura para todo el mundo" (filtrado por la <em>umask</em> del proceso).</li>
      </List>

      <P>
        Devuelve <strong>0</strong> si todo salió bien, o <strong>-1</strong> si algo falló. Cuando falla,
        la variable global <em>errno</em> guarda la razón. Los dos errores más comunes que vas a ver mientras
        aprendes son <em>EEXIST</em> (ya había un archivo con ese nombre — la llamada anterior lo dejó ahí
        y olvidaste borrarlo) y <em>EACCES</em> (no tienes permisos para escribir en ese directorio).
      </P>

      <H2>El comportamiento bloqueante de la apertura</H2>
      <P>
        Aquí viene la parte que más confunde al principio. Cuando un proceso abre una FIFO con <em>open()</em>,
        el kernel no le devuelve el descriptor inmediatamente: lo <strong>duerme</strong> hasta que aparezca
        alguien del otro lado. Es decir, abrir una FIFO no es una operación instantánea como abrir un
        archivo normal — es una <em>cita ciega</em>.
      </P>

      <Callout tone="info" title="Analogía: el walkie-talkie">
        Cuando enciendes un walkie-talkie y aprietas el botón de hablar, no transmites al vacío: el aparato
        espera a que <strong>alguien en el otro extremo</strong> también encienda el suyo y se ponga en
        la misma frecuencia. Si nadie escucha, tú te quedas con el botón apretado esperando. Eso es
        exactamente lo que hace el kernel con tu <em>open()</em> sobre la FIFO: te deja con el botón
        apretado hasta que aparezca tu interlocutor.
      </Callout>

      <P>
        La regla es simétrica:
      </P>

      <List>
        <li>Si abres la FIFO para <strong>escritura</strong> (<em>O_WRONLY</em>), <em>open()</em> bloquea hasta que <strong>otro proceso</strong> la abra para <strong>lectura</strong>.</li>
        <li>Si abres la FIFO para <strong>lectura</strong> (<em>O_RDONLY</em>), <em>open()</em> bloquea hasta que <strong>otro proceso</strong> la abra para <strong>escritura</strong>.</li>
      </List>

      <P>
        En el momento en que aparece el segundo extremo, <strong>los dos open() despiertan al mismo tiempo</strong>
        y devuelven descriptores válidos. A ese instante de sincronización se le llama <em>rendezvous</em>
        (palabra francesa para "cita acordada"), y es la pieza más importante de la mecánica de las FIFOs.
      </P>

      <Callout tone="warn" title="Por qué el kernel impone esta regla">
        Si el kernel dejara escribir sin lector, los bytes se acumularían en un buffer que nadie va a vaciar
        nunca; eventualmente se llenaría y el escritor se quedaría atascado en su <em>write()</em> sin
        explicación. Y si dejara leer sin escritor, el lector recibiría EOF al instante (cero bytes), lo
        cual normalmente lo haría salir creyendo que terminó el trabajo. Bloquear en <em>open()</em>
        evita ambos escenarios garantizando que cuando haya descriptor abierto, el canal completo esté
        listo.
      </Callout>

      <Callout tone="info" title="La escotilla de emergencia: O_NONBLOCK">
        Si no quieres que tu programa se duerma en <em>open()</em>, puedes añadir la bandera <em>O_NONBLOCK</em>:
        <em>open("buzon", O_RDONLY | O_NONBLOCK)</em>. La llamada retorna de inmediato. Si abriste para lectura
        sin escritor, te devuelve un descriptor válido pero las lecturas darán EOF hasta que alguien escriba.
        Si abriste para escritura sin lector, <em>open()</em> falla con <em>ENXIO</em>. Útil cuando tu programa
        no puede darse el lujo de quedarse dormido (por ejemplo, una GUI).
      </Callout>

      <H3>Mira el rendezvous en cámara lenta</H3>
      <P>
        La animación de abajo descompone toda esta mecánica paso a paso. Usa el botón <strong>AUTO</strong>
        para verlo solo, o los puntos / flechas para avanzar manualmente. Pon atención a tres elementos
        visuales:
      </P>

      <List>
        <li>Las dos <strong>barras horizontales</strong> arriba y abajo son los procesos (escritor y lector). Cuando están <em>rayadas amarillas</em> significa que están bloqueados en <em>open()</em>; cuando están <em>verdes</em> el <em>open()</em> ya retornó.</li>
        <li>El <strong>tubo central</strong> con la etiqueta KERNEL es el buffer interno donde viven los bytes mientras viajan. Está vacío cuando nadie ha escrito todavía.</li>
        <li>Los <strong>cuadros con letras</strong> que aparecen dentro del tubo son los bytes individuales. Cuando ves la <em>flecha verde parpadeando</em> a la derecha, significa que <em>read()</em> está drenando esos bytes hacia el lector.</li>
      </List>

      <FifoBlockingFlow />

      <H2>Ejemplo completo: FIFO entre padre e hijo</H2>
      <P>
        Las FIFOs brillan cuando comunican procesos sin parentesco, pero para aprender la API conviene
        empezar con un ejemplo donde ambos lados están en el mismo programa. Así puedes ver el ciclo
        completo: crear el archivo, hacer <em>fork()</em>, que cada rama abra <em>su</em> extremo, mover
        datos y limpiar. Piensa en este programa como en un <strong>drive-thru de hamburguesas</strong>:
        un mismo edificio tiene una ventanilla de pedido (escritor) y una ventanilla de entrega (lector);
        el coche del cliente es el byte que viaja por el carril (la FIFO).
      </P>

      <CodeExplain
        title="fifo_basico.c"
        lines={[
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: '#include <sys/types.h>' },
          { code: '#include <sys/stat.h>', note: 'Aquí vive mkfifo() y los macros de permisos.' },
          { code: '#include <fcntl.h>', note: 'Banderas para open(): O_RDONLY (solo lectura), O_WRONLY (solo escritura), O_NONBLOCK, etc.' },
          { code: '#include <unistd.h>' },
          { code: 'int main(void) {' },
          { code: '    pid_t hijo;' },
          { code: '    int file;', note: 'Aquí guardamos el descriptor (número entero) que open() nos devuelva. Es el "ticket" para usar la FIFO.' },
          { code: '    char mensaje[20];' },
          { code: '    unlink("namepipe");', note: 'Borramos el archivo por si una corrida anterior lo dejó. Sin esto, mkfifo() fallaría con EEXIST y el programa abortaría.' },
          { code: '    umask(~0666);', note: 'La umask es un filtro que recorta permisos al crear archivos. La invertimos para que los 0666 que pedimos no se vean recortados.' },
          { code: '    if (mkfifo("namepipe", 0666) == -1) {', note: 'Creamos el archivo FIFO en el directorio actual, con permisos rw para todos. Aún no hay procesos conectados.' },
          { code: '        perror("error en mkfifo");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    if ((hijo = fork()) == 0) {', note: 'fork() duplica el proceso. La rama del hijo (retorno = 0) va a ser el ESCRITOR.' },
          { code: '        fprintf(stdout, "soy el hijo, ID=%ld\\n", (long)getpid());' },
          { code: '        if ((file = open("namepipe", O_WRONLY)) == -1) {', note: 'El hijo abre el FIFO para escribir. AQUÍ SE DUERME hasta que el padre lo abra para leer.' },
          { code: '            perror("error en mkfifo");' },
          { code: '            exit(EXIT_FAILURE);' },
          { code: '        }' },
          { code: '        write(file, "soy el hijo,ID...\\n", 20);', note: 'Una vez ambos extremos abiertos, write() copia los 20 bytes al buffer del kernel.' },
          { code: '        close(file);' },
          { code: '        getchar();', note: 'Pausa para que el archivo FIFO siga visible en el FS mientras lo inspeccionas con ls -l en otra terminal.' },
          { code: '        exit(EXIT_SUCCESS);' },
          { code: '    }' },
          { code: '    if (hijo > 0) {', note: 'Rama del padre (retorno = PID del hijo). Va a ser el LECTOR.' },
          { code: '        fprintf(stdout, "soy el padre, ID = %ld\\n", (long)getpid());' },
          { code: '        if ((file = open("namepipe", O_RDONLY)) == -1) {', note: 'El padre abre para leer. También se duerme; en este instante ambos open() (padre e hijo) despiertan a la vez. Esto es el rendezvous.' },
          { code: '            perror("error en open O_RDONLY");' },
          { code: '            exit(EXIT_FAILURE);' },
          { code: '        }' },
          { code: '        read(file, mensaje, 20);', note: 'read() saca los bytes del buffer del kernel en el orden en que entraron. Si el buffer estuviera vacío, bloquearía esperando.' },
          { code: '        fprintf(stdout, "%s\\n", mensaje);' },
          { code: '        close(file);' },
          { code: '    }' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <Callout tone="success" title="Por qué este ejemplo es seguro">
        Aunque escribimos 20 bytes en una sola operación, POSIX garantiza que las escrituras de hasta
        <em> PIPE_BUF</em> bytes (4096 en Linux) son <strong>atómicas</strong>: nunca se entremezclan con
        las de otro escritor. Esto importa cuando tienes varios procesos escribiendo en la misma FIFO:
        mientras cada uno mande mensajes ≤ PIPE_BUF, no vas a tener líneas mezcladas. Más allá de ese
        tamaño, el kernel puede entrelazar los datos.
      </Callout>

      <H2>FIFO vs pipe anónima: tabla rápida</H2>
      <P>
        Las dos sirven para mover bytes en un solo sentido. Pero las diferencias de uso son significativas:
      </P>

      <List>
        <li><strong>Visibilidad:</strong> la pipe anónima solo existe como descriptores en memoria; la FIFO aparece como archivo (visible con <em>ls -l</em>, borrable con <em>rm</em>).</li>
        <li><strong>Quién puede conectarse:</strong> la pipe necesita ancestro común (vía <em>fork()</em>); la FIFO necesita solo conocer la ruta y tener permisos.</li>
        <li><strong>Persistencia:</strong> la pipe muere cuando cierran todos sus descriptores; la FIFO sobrevive entre ejecuciones (hasta que la borres con <em>unlink()</em> o <em>rm</em>).</li>
        <li><strong>Acto de abrir:</strong> la pipe se abre instantáneo (es solo asignar memoria); la FIFO impone el rendezvous bloqueante.</li>
        <li><strong>Dentro del canal:</strong> idénticas — bytes en orden, FIFO puro, mismas garantías de atomicidad hasta PIPE_BUF.</li>
      </List>

      <Callout tone="success" title="Cuándo elegir una FIFO en la vida real">
        Buenos casos: un demonio de logs al que varios programas le mandan mensajes, un script que quiere
        recibir comandos de otros scripts sin abrir un puerto de red, una herramienta CLI que acepta
        órdenes interactivas desde otra terminal. Si tus procesos están en la misma máquina, no necesitas
        más de un emisor / receptor por extremo y los datos son texto o binario simple, la FIFO suele ser
        más liviana que un socket Unix y más simple que memoria compartida.
      </Callout>

      <H2>Qué entendimos</H2>
      <P>
        Si tuvieras que explicarle FIFOs a alguien en treinta segundos, este sería el mapa mental que
        deberías poder recitar:
      </P>

      <List>
        <li>Una <strong>FIFO</strong> es una tubería igual que la anónima, pero con un <strong>nombre en el sistema de archivos</strong>: aparece como un archivo de tipo <em>p</em> que cualquiera con permisos puede abrir.</li>
        <li>El archivo se crea con <em>mkfifo(ruta, permisos)</em>. <strong>Solo crea el archivo</strong>; no devuelve descriptores ni abre nada.</li>
        <li>Para usarla, cada proceso hace <em>open()</em> sobre la ruta, eligiendo su extremo (<em>O_RDONLY</em> o <em>O_WRONLY</em>).</li>
        <li><em>open()</em> <strong>bloquea</strong> hasta que aparezca el otro extremo. Cuando llega el segundo proceso, los dos <em>open()</em> despiertan a la vez: a esto se le llama <strong>rendezvous</strong>.</li>
        <li>El kernel impone el rendezvous para evitar escritores escribiendo al vacío o lectores leyendo EOF prematuro.</li>
        <li>Una vez abierta, leer y escribir funciona <strong>igual que una pipe</strong>: bytes en el orden en que se escribieron, escrituras ≤ <em>PIPE_BUF</em> son atómicas.</li>
        <li>Si no quieres bloquear, usa <em>O_NONBLOCK</em> y maneja tú el caso de que el otro lado no esté listo (errno = <em>ENXIO</em> en escritor sin lector).</li>
        <li>Cuando todos los descriptores se cierran, los datos en el buffer se descartan. El archivo sigue ahí en el FS hasta que llames <em>unlink()</em> o <em>rm</em>.</li>
        <li>Sirve para conectar <strong>procesos sin parentesco</strong> en la misma máquina — su gran ventaja sobre la pipe anónima.</li>
      </List>
    </>
  );
}
