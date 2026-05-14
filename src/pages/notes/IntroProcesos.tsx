import { P, List, H2, Code } from '../../components/ui/Prose';

export default function IntroProcesos() {
  return (
    <> <P> El proceso es aquel que es una entidad que se encuentra ejecutandose dentro del harware, el sistema operativo
        le da un identificador, permitendo que pueda ser gestionado y referenciado. Un proceso puede encontrarse ejecutandose en el procesador o fuera de el en espera, haciendo que tengamos dos estado:Ejecucion o No ejecucion </P>
        <P>Para su administracion el SO identifica, mantiene informacion, estado actual y ubicacion en memoria del proceso, donde se utiliza una estructura por lo regular colas donde esperan a ser atendido</P>
        <H2> Estados de los procesos</H2>
        <List>
          <li><strong>Nuevo:</strong> Proceso que recientemente fue creado, pero aun no lo admite el sistema de procesos</li>
          <li><strong>Listo:</strong> Procesos en espera para ejecutarse</li>
          <li><strong>Ejecucion:</strong> Proceso en ejecución por el CPU</li>
          <li><strong>Bloqueado:</strong> Proceso en espera de un evento como la finalizacion de una entrada y salida del dispositivo, podemos usar la funcion sleep, la cual recibe como parametro el tiempo que estara dormido el proceso.</li>
          <li><strong>Terminado:</strong> Proceso que finalizo su ejecucion por forma normal o fue abandonado. </li>
        </List>
        <Code title="sleep.c">{`#include <unistd.h>
#include <stdio.h>

int main(void) {
    printf("Proceso dormido 5s...\\n");
    sleep(5);
    printf("Despierto\\n");
    return 0;
}`}</Code>
        <P>En este ejemplo se incluye <strong>unistd.h</strong> para acceder a la funcion <strong>sleep</strong>, la cual pertenece a las llamadas al sistema POSIX. El proceso imprime un mensaje, se bloquea durante 5 segundos (pasando al estado <strong>Bloqueado</strong>) y, una vez transcurrido ese tiempo, el planificador lo regresa al estado <strong>Listo</strong> para continuar su ejecucion e imprimir el mensaje final. Es una forma simple de observar la transicion entre estados sin necesidad de esperar un evento de E/S real.</P>
        <P> A diferencia de este diagrama de estados, el diagrama de estados del sistema UNIX llega a ser más complejo, por que agrega estados adicionales para la gestion de memoria y la terminacion de los procesos </P>
        <P> El diagrama se resume en que el proceso puede tener los estados siguientes: Ejecucion en modo usuario y modo kernel estos difieren por el hecho de que uno hace uso de llamadas al sistema o interrupcion. Listo para ejecutarse pero no en ejecucion, y el otro es suspendido 
          pero en espera a que el proceso 0 lo cargue en memoria. Dormido en memoria en espera de un evento, respecto a evento nos referimos a una accion donde tanto el usuario como el sistema pueden realizar, En transicion y  Finalizando.
        </P>
        <P>Lo más interesante de este diagrama de estados de UNIX es que maneja lo que se llama estado zombi, que basicamente es el momento en el que proceso a finalizado, pero el proceso padre no ha pasado a recogerlo dando a entender que
          vaga como un zombie, este desaparece despues de este evento.
        </P>
        <H2>Creacion de un proceso</H2>
        <P>En UNIX, los procesos se crean mediante la llamada al sistema <strong>fork()</strong>. Esta funcion duplica el proceso actual, generando un proceso <em>hijo</em> identico al <em>padre</em>. El hijo recibe una copia del espacio de memoria, descriptores de archivo y contexto de ejecucion del padre, pero con un PID distinto.</P>
        <Code title="fork.c">{`#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    pid_t pid = fork();

    if (pid < 0) {
        perror("fork fallo");
        return 1;
    } else if (pid == 0) {
        printf("Hijo: PID=%d, padre=%d\\n", getpid(), getppid());
    } else {
        printf("Padre: PID=%d, hijo=%d\\n", getpid(), pid);
        wait(NULL);
    }
    return 0;
}`}</Code>
        <P>El valor que retorna <strong>fork()</strong> distingue al proceso en ejecucion: devuelve <strong>0</strong> en el hijo, el <strong>PID del hijo</strong> en el padre, y <strong>-1</strong> si la creacion fallo. Por esto el mismo codigo se bifurca en dos caminos segun la rama del <em>if</em>. La llamada <strong>wait(NULL)</strong> en el padre lo bloquea hasta que el hijo termine, evitando que el hijo quede en estado <strong>zombi</strong>. Si el padre no recoge al hijo, este permanece en la tabla de procesos como zombie hasta que algun proceso (como <em>init</em>) lo adopte y lo libere.</P>
    </>
   
      

  );
}
