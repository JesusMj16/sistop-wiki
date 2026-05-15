import { P, H2, H3, List, Code, Callout, CodeExplain, Table } from '../../components/ui/Prose';

export default function ColaMensajes() {
  return (
    <>
      <P>
        Las <strong>colas de mensajes</strong> de System V son el mecanismo IPC que ocupa el lugar medio entre
        las pipes y la memoria compartida. A diferencia de las pipes, los mensajes <em>conservan sus límites</em>:
        cada <em>msgsnd()</em> es un mensaje completo, no un flujo de bytes anónimo. Y a diferencia de la memoria
        compartida, el kernel maneja la entrega y se encarga de la sincronización: el productor entrega y el
        consumidor recoge cuando quiera, sin riesgo de pisarse.
      </P>

      <H2>Características clave</H2>
      <List>
        <li><strong>Persistencia en el kernel:</strong> la cola sobrevive a los procesos. Si nadie la destruye con <em>IPC_RMID</em>, queda residente hasta el reinicio.</li>
        <li><strong>Mensajes tipados:</strong> cada mensaje lleva un campo <em>mtype</em> (un <em>long</em>) que el receptor puede usar para filtrar. Se pueden tener varias "rutas lógicas" en la misma cola.</li>
        <li><strong>Bloqueo configurable:</strong> por defecto <em>msgrcv()</em> bloquea hasta que llegue un mensaje; con <em>IPC_NOWAIT</em> retorna inmediatamente con error si no hay nada.</li>
        <li><strong>Tamaño y cantidad limitados:</strong> el kernel impone límites por cola y por mensaje (<em>MSGMAX</em>, <em>MSGMNB</em>).</li>
      </List>

      <H2>El API</H2>

      <H3>msgget()</H3>
      <Code title="msgget">{`int msgget(key_t key, int msgflg);`}</Code>
      <List>
        <li>Crea o abre la cola identificada por la llave.</li>
        <li><em>IPC_PRIVATE</em> es habitual cuando padre e hijo comparten todo: el padre crea, el hijo la hereda por <em>fork()</em>.</li>
      </List>

      <H3>msgsnd() y msgrcv()</H3>
      <Code title="enviar y recibir">{`int msgsnd(int msqid, const void *msgp, size_t msgsz, int msgflg);
ssize_t msgrcv(int msqid, void *msgp, size_t msgsz, long msgtyp, int msgflg);`}</Code>
      <List>
        <li><em>msgp</em> apunta a una estructura cuyo primer campo es <em>long mtype</em>. El resto es libre: tú defines el formato.</li>
        <li><em>msgsz</em> es el tamaño del payload sin contar el <em>mtype</em>.</li>
        <li><em>msgtyp</em> en <em>msgrcv</em> filtra:
          <List>
            <li><em>0</em>: trae el primer mensaje sin importar su tipo.</li>
            <li><em>{'>'} 0</em>: trae el primer mensaje con ese <em>mtype</em> exacto.</li>
            <li><em>{'<'} 0</em>: trae el de menor <em>mtype</em> que sea ≤ |valor|.</li>
          </List>
        </li>
      </List>

      <Callout tone="info" title="Define tu propio struct">
        El kernel solo exige que el primer campo sea <em>long mtype</em>. El resto del struct lo modelas según
        lo que necesites transportar: una cadena fija, un sub-tipo, varios enteros... Lo que pongas, eso copia
        el kernel desde el productor al consumidor.
      </Callout>

      <H2>Patrón canónico: padre productor, hijo consumidor</H2>
      <P>
        El siguiente programa muestra cómo un proceso reporta a otro la lista de usuarios conectados al sistema
        a través de una cola de mensajes. El <strong>padre</strong> recorre <em>utmp</em> (el archivo donde
        Linux registra las sesiones activas), formatea cada entrada y la envía como mensaje. El <strong>hijo
        </strong> recibe los mensajes y los imprime hasta recibir un marcador de fin.
      </P>

      <H3>Estructura del mensaje y los dos tipos</H3>
      <Code title="declaraciones">{`#define MSG_DATA 1L
#define MSG_END  2L
#define MAX_TEXT 256

typedef struct {
    long mtype;
    char text[MAX_TEXT];
} Message;`}</Code>

      <List>
        <li>Hay <strong>dos tipos lógicos</strong> en la misma cola: <em>MSG_DATA</em> para cada usuario, <em>MSG_END</em> como sentinela.</li>
        <li>Este patrón evita que el consumidor tenga que saber de antemano cuántos mensajes va a recibir. El productor le avisa con un mensaje especial cuando terminó.</li>
      </List>

      <H3>El productor (padre)</H3>

      <CodeExplain
        title="enviar_usuarios()"
        lines={[
          { code: 'setutent();', note: 'Rebobina el archivo utmp al inicio.' },
          { code: 'while ((entrada = getutent()) != NULL) {' },
          { code: '    if (entrada->ut_type != USER_PROCESS) continue;', note: 'Solo nos interesan las entradas de usuarios reales (saltamos logins de sistema, getty, etc.).' },
          { code: '    /* formatear fecha, usuario, terminal, host */' },
          { code: '    msg.mtype = MSG_DATA;', note: 'Tipo 1: mensaje de datos.' },
          { code: '    snprintf(msg.text, sizeof(msg.text),' },
          { code: '             "%s\\t%s\\t%s\\n", usuario, linea, fecha);' },
          { code: '    msgsnd(queue_id, &msg, sizeof(msg.text), 0);', note: 'Encola. msgsz es el tamaño del payload SIN incluir mtype.' },
          { code: '    enviados++;' },
          { code: '}' },
          { code: 'endutent();' },
          { code: 'if (enviados == 0) {', note: 'Caso especial: si nadie estaba conectado, se manda un MSG_DATA con texto informativo.' },
          { code: '    msg.mtype = MSG_DATA;' },
          { code: '    snprintf(msg.text, sizeof(msg.text), "No hay usuarios conectados.\\n");' },
          { code: '    msgsnd(queue_id, &msg, sizeof(msg.text), 0);' },
          { code: '}' },
          { code: 'msg.mtype = MSG_END;', note: 'Tipo 2: sentinela de fin. El consumidor lo usa para romper el bucle.' },
          { code: 'msg.text[0] = \'\\0\';' },
          { code: 'msgsnd(queue_id, &msg, sizeof(msg.text), 0);' },
        ]}
      />

      <H3>El consumidor (hijo)</H3>

      <CodeExplain
        title="recibir_y_mostrar()"
        lines={[
          { code: 'printf("Usuarios conectados:\\n");' },
          { code: 'while (1) {' },
          { code: '    if (msgrcv(queue_id, &msg, sizeof(msg.text), 0, 0) == -1) {', note: 'msgtyp = 0: trae el primer mensaje de cualquier tipo. Si la cola está vacía, BLOQUEA.' },
          { code: '        perror("msgrcv");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    if (msg.mtype == MSG_END) break;', note: 'Termina el bucle al recibir el marcador.' },
          { code: '    fputs(msg.text, stdout);' },
          { code: '}' },
        ]}
      />

      <H2>Coreografía completa en main()</H2>

      <Code title="main()">{`int queue_id = msgget(IPC_PRIVATE, IPC_CREAT | 0600);

pid_t pid = fork();
if (pid == 0) {
    recibir_y_mostrar(queue_id);   /* HIJO */
    _exit(EXIT_SUCCESS);
}

enviar_usuarios(queue_id);          /* PADRE */
waitpid(pid, NULL, 0);

msgctl(queue_id, IPC_RMID, NULL);   /* limpieza */
return EXIT_SUCCESS;`}</Code>

      <List>
        <li>El padre crea la cola con <em>IPC_PRIVATE</em>. Como el hijo se crea por <em>fork()</em>, hereda el <em>queue_id</em> y puede usarlo sin más.</li>
        <li>El hijo entra inmediatamente a <em>recibir_y_mostrar()</em> y se bloquea esperando mensajes.</li>
        <li>El padre llama a <em>enviar_usuarios()</em>, que llena la cola de mensajes y termina con un <em>MSG_END</em>.</li>
        <li>El padre espera al hijo con <em>waitpid()</em> y solo entonces destruye la cola con <em>IPC_RMID</em>.</li>
      </List>

      <Callout tone="warn" title="Orden de la limpieza">
        Si el padre llamara <em>IPC_RMID</em> antes de que el hijo terminara de leer, el kernel le entregaría
        <em> EIDRM</em> al consumidor. Por eso primero <em>waitpid()</em>, después <em>msgctl()</em>.
      </Callout>

      <H2>Comparativa rápida con pipes y FIFOs</H2>

      <Table
        headers={['Aspecto', 'Pipe / FIFO', 'Cola de mensajes']}
        rows={[
          ['Modelo', 'Flujo de bytes', 'Mensajes discretos con tipo'],
          ['Sincronización', 'Implícita: lecturas bloquean', 'Implícita; además filtrable por mtype'],
          ['Sin parentesco', 'Solo FIFO (con nombre)', 'Sí, vía ftok()'],
          ['Persistencia', 'Hasta cerrar descriptores', 'Hasta IPC_RMID o reinicio'],
          ['Múltiples canales', 'Una por pipe', 'Una sola cola, varios mtype'],
          ['Sobrecarga', 'Baja', 'Mayor (copia por mensaje + estructuras)'],
        ]}
      />

      <Callout tone="success" title="Cuándo conviene una cola">
        Cuando el flujo natural es "mensajes" más que "bytes", y especialmente cuando varios productores
        publican y varios consumidores leen filtrando por tipo. Es el ancestro conceptual de los <em>topics</em>
        en sistemas pub/sub modernos: una cola compartida con etiquetas.
      </Callout>
    </>
  );
}
