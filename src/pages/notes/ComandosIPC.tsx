import { P, H2, H3, List, Code, Callout, Table } from '../../components/ui/Prose';

export default function ComandosIPC() {
  return (
    <>
      <P>
        Todos los recursos IPC de System V — semáforos, memoria compartida y colas de mensajes — viven en el
        kernel y persisten más allá del proceso que los creó. Esto es útil pero también peligroso: si un
        programa muere a mitad sin destruir lo que reservó, el recurso queda "huérfano" ocupando una llave.
        Linux ofrece dos comandos para gestionarlos desde la shell: <strong>ipcs</strong> para listar y
        <strong> ipcrm</strong> para eliminar.
      </P>

      <H2>ipcs — inventario de recursos IPC</H2>
      <P>
        <em>ipcs</em> consulta las tablas internas del kernel y muestra todos los objetos IPC del sistema:
        quién los creó, su llave, su ID, sus permisos, sus tamaños y, cuando aplica, cuántos procesos los
        están usando. Sin argumentos muestra un resumen de los tres tipos:
      </P>

      <Code title="terminal">{`$ ipcs

------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages
0x00000000 32768      dante      600        0            0

------ Shared Memory Segments --------
key        shmid      owner      perms      bytes      nattch     status
0x44000004 16         dante      660        648        2

------ Semaphore Arrays --------
key        semid      owner      perms      nsems
0x4b020001 0          dante      666        3`}</Code>

      <H3>Lectura de las columnas</H3>
      <List>
        <li><strong>key</strong>: la llave (en hexadecimal). <em>0x00000000</em> corresponde a recursos creados con <em>IPC_PRIVATE</em>.</li>
        <li><strong>msqid / shmid / semid</strong>: el ID interno que devolvió <em>...get()</em>.</li>
        <li><strong>owner / perms</strong>: usuario propietario y modo POSIX (lectura/escritura).</li>
        <li><strong>nattch</strong> (sólo memoria compartida): cuántos procesos tienen el segmento adjuntado vía <em>shmat()</em>. Si es 0 y el segmento sigue listado, está pendiente de liberarse.</li>
        <li><strong>nsems</strong> (sólo semáforos): cuántos semáforos hay en el conjunto.</li>
        <li><strong>used-bytes / messages</strong> (sólo colas): cuánto payload está pendiente y cuántos mensajes hay en cola.</li>
      </List>

      <H3>Flags útiles</H3>

      <Table
        headers={['Comando', 'Qué hace']}
        rows={[
          [<em>ipcs -q</em>, 'Solo colas de mensajes.'],
          [<em>ipcs -m</em>, 'Solo segmentos de memoria compartida.'],
          [<em>ipcs -s</em>, 'Solo conjuntos de semáforos.'],
          [<em>ipcs -a</em>, 'Información completa (por defecto en la mayoría de distros).'],
          [<em>ipcs -t</em>, 'Marcas de tiempo: cuándo se creó, cuándo se usó por última vez.'],
          [<em>ipcs -p</em>, 'PIDs del creador y del último que lo manipuló.'],
          [<em>ipcs -c</em>, 'Solo creador y propietario.'],
          [<em>ipcs -l</em>, 'Límites del kernel: tamaño máximo de mensaje, semáforos por conjunto, etc.'],
        ]}
      />

      <Callout tone="info" title="Para diagnosticar fugas">
        Después de cada ejecución de un programa que use IPC, corre <em>ipcs</em>. Si ves recursos con tu
        usuario que no deberían seguir ahí, significa que el programa no llamó a <em>IPC_RMID</em> en algún
        camino (típicamente cuando crashea o lo matas con Ctrl+C).
      </Callout>

      <H2>ipcrm — eliminación manual</H2>
      <P>
        Cuando un programa muere sin limpiar, <em>ipcrm</em> es la herramienta para borrar el recurso a mano.
        Acepta el ID o la llave, con un flag distinto para cada tipo de recurso:
      </P>

      <Table
        headers={['Comando', 'Qué borra']}
        rows={[
          [<em>ipcrm -q &lt;msqid&gt;</em>, 'Cola de mensajes por ID.'],
          [<em>ipcrm -Q &lt;key&gt;</em>,  'Cola de mensajes por llave.'],
          [<em>ipcrm -m &lt;shmid&gt;</em>, 'Segmento de memoria compartida por ID.'],
          [<em>ipcrm -M &lt;key&gt;</em>,  'Segmento de memoria compartida por llave.'],
          [<em>ipcrm -s &lt;semid&gt;</em>, 'Conjunto de semáforos por ID.'],
          [<em>ipcrm -S &lt;key&gt;</em>,  'Conjunto de semáforos por llave.'],
        ]}
      />

      <Code title="ejemplo">{`$ ipcs -s

------ Semaphore Arrays --------
key        semid      owner      perms      nsems
0x4b020001 0          dante      666        3

$ ipcrm -s 0
$ ipcs -s

------ Semaphore Arrays --------
key        semid      owner      perms      nsems
(vacío)`}</Code>

      <Callout tone="warn" title="Solo puedes borrar lo tuyo">
        Sin privilegios, <em>ipcrm</em> solo te deja eliminar recursos cuyo propietario seas tú. Para limpiar
        de otros usuarios hace falta <em>sudo</em>. En sistemas multiusuario esto evita que un programa
        descuidado deje colgados recursos de otra persona.
      </Callout>

      <H2>Limpieza masiva</H2>
      <P>
        Cuando depuras un programa con IPC y dejas residuos cada vez, conviene tener un atajo para barrer
        todo a la vez. Algunos atajos comunes:
      </P>

      <Code title="bash">{`# Borrar todas las colas de mi usuario
ipcs -q | awk 'NR>3 && $1!="" {print $2}' | xargs -r ipcrm -q

# Borrar toda la memoria compartida y semáforos de mi usuario
ipcrm $(ipcs -m | awk 'NR>3 {print "-m " $2}')
ipcrm $(ipcs -s | awk 'NR>3 {print "-s " $2}')`}</Code>

      <P>
        En sistemas donde tengas permisos, <em>ipcrm --all</em> (en versiones recientes de <em>util-linux</em>)
        borra todos los recursos del tipo indicado:
      </P>

      <Code title="ipcrm --all">{`ipcrm --all=msg     # todas las colas de mensajes
ipcrm --all=shm     # toda la memoria compartida
ipcrm --all=sem     # todos los semáforos
ipcrm --all         # los tres tipos`}</Code>

      <H2>/proc/sysvipc — la fuente original</H2>
      <P>
        Tanto <em>ipcs</em> como <em>ipcrm</em> son envolturas sobre llamadas al sistema (<em>shmctl</em>,
        <em>semctl</em>, <em>msgctl</em>) y, para listar, sobre los archivos virtuales bajo
        <em> /proc/sysvipc/</em>. Si quieres parsear desde un programa, leer estos archivos suele ser más
        cómodo que invocar a <em>ipcs</em> y parsear su salida.
      </P>

      <Code title="terminal">{`$ ls /proc/sysvipc/
msg  sem  shm

$ cat /proc/sysvipc/sem
       key      semid perms      nsems   uid   gid  cuid  cgid      otime      ctime
1258487809          0   666          3  1000  1000  1000  1000          0 1700000000`}</Code>

      <H2>Pequeño checklist de higiene</H2>
      <List>
        <li>Después de cada corrida, <em>ipcs</em>. Si aparecen recursos huérfanos tuyos, hay un camino en tu código que no llama <em>IPC_RMID</em>.</li>
        <li>Maneja <em>SIGINT</em> y <em>SIGTERM</em> con un handler que cierre y libere antes de salir.</li>
        <li>Si trabajas en una máquina compartida, no asumas que tu llave de <em>ftok()</em> es única: otra ejecución previa puede haber dejado un recurso con la misma llave. Usa <em>IPC_EXCL</em> para detectarlo y aborta con un mensaje claro.</li>
        <li>Para scripts de prueba, agrega un <em>ipcrm --all=...</em> en un <em>trap EXIT</em> del shell que los lanza.</li>
      </List>

      <Callout tone="success" title="Idea para llevarte">
        IPC de System V regala potencia y persistencia, pero te cobra el mantenimiento: tú creas, tú limpias.
        <em> ipcs</em> e <em>ipcrm</em> son tus amigos en este proceso. Acostumbrarte a usarlos durante el
        desarrollo te ahorra horas de pelearte con errores tipo "EEXIST" o "no message of desired type" que en
        realidad son síntomas de recursos zombi de ejecuciones anteriores.
      </Callout>
    </>
  );
}
