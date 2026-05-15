import { P, H2, H3, List, Code, Callout, CodeExplain, Table } from '../../components/ui/Prose';

export default function MemoriaCompartida() {
  return (
    <>
      <P>
        Hasta ahora todos los mecanismos IPC que vimos pasan los datos por el kernel: pipes, FIFOs y colas de
        mensajes copian bytes de un proceso al otro. Eso funciona, pero tiene un costo en cada operación. La
        <strong> memoria compartida</strong> es el mecanismo más rápido porque elimina esa intermediación: el
        kernel reserva una región de memoria y la mapea al espacio de direcciones de varios procesos.
        Escribir un byte ahí es tan barato como modificar una variable local, y todos los demás lo ven al
        instante.
      </P>

      <Callout tone="warn" title="Velocidad a cambio de cuidado">
        Como el kernel ya no media en cada acceso, tampoco sincroniza. Si dos procesos escriben la misma zona
        sin coordinarse, el resultado es indefinido. La memoria compartida casi siempre va de la mano de
        semáforos o algún otro mecanismo de sincronización.
      </Callout>

      <H2>El API de System V</H2>
      <P>
        El esqueleto es paralelo al que ya conoces de los semáforos: una función para obtener el recurso, una
        para "engancharlo" al proceso, y una de control.
      </P>

      <Table
        headers={['Función', 'Para qué sirve']}
        rows={[
          [<em>shmget()</em>, 'Crea un segmento nuevo o abre uno existente a partir de una llave.'],
          [<em>shmat()</em>,  'Adjunta el segmento al espacio de direcciones del proceso. Devuelve un puntero usable.'],
          [<em>shmdt()</em>,  'Detacha el segmento (lo desmapea del proceso). NO lo destruye.'],
          [<em>shmctl()</em>, 'Control: leer estado, eliminar el segmento con IPC_RMID.'],
        ]}
      />

      <H3>shmget()</H3>
      <Code title="shmget">{`int shmget(key_t key, size_t size, int shmflg);`}</Code>
      <List>
        <li><strong>key</strong>: la llave (típicamente de <em>ftok()</em>) que identifica el segmento entre procesos.</li>
        <li><strong>size</strong>: el tamaño en bytes que necesitas. El kernel redondea al tamaño de página.</li>
        <li><strong>shmflg</strong>: permisos (<em>0660</em>) combinados con <em>IPC_CREAT</em> y, si quieres que falle cuando ya exista, <em>IPC_EXCL</em>.</li>
      </List>

      <H3>shmat()</H3>
      <Code title="shmat">{`void *shmat(int shmid, const void *shmaddr, int shmflg);`}</Code>
      <List>
        <li><strong>shmid</strong>: el ID que devolvió <em>shmget()</em>.</li>
        <li><strong>shmaddr</strong>: dirección preferida donde mapear; en la práctica casi siempre se pasa <em>NULL</em> para que el kernel decida.</li>
        <li><strong>shmflg</strong>: típicamente 0 (lectura/escritura). Devuelve <em>(void *)-1</em> si falla.</li>
      </List>

      <Callout tone="info" title="shmdt no borra, IPC_RMID sí">
        <em>shmdt()</em> solo desconecta el segmento del proceso actual; otros procesos pueden seguir usándolo.
        Para destruir el segmento del kernel hay que llamar <em>shmctl(shmid, IPC_RMID, NULL)</em>. El segmento
        se borra realmente cuando <strong>el último proceso lo desadjunta</strong>, pero la marca <em>RMID</em>
        garantiza que no se reutilice después.
      </Callout>

      <H2>Patrón común</H2>
      <Code title="ciclo de vida">{`/* 1. Obtener llave y crear/abrir */
key_t llave = ftok("/ruta/anclaje", 'X');
int shmid   = shmget(llave, tamano, IPC_CREAT | 0660);

/* 2. Adjuntar y trabajar */
void *region = shmat(shmid, NULL, 0);
/*    usar region como si fuera memoria propia    */

/* 3. Limpiar */
shmdt(region);                       /* desadjuntar de este proceso */
shmctl(shmid, IPC_RMID, NULL);       /* destruir el segmento        */`}</Code>

      <H2>Un ejemplo completo: determinante en paralelo</H2>
      <P>
        Para verlo en acción: un programa donde el <strong>padre</strong> genera una matriz aleatoria de NxN
        y la deja en memoria compartida; el <strong>hijo</strong> la lee, calcula su determinante por expansión
        de cofactores e imprime el resultado. El padre espera y luego limpia.
      </P>

      <P>
        Lo interesante aquí es la <strong>estructura</strong> que se comparte. En vez de mapear un buffer
        amorfo, se define un <em>struct</em> que contiene todo lo que el hijo necesita: el tamaño <em>n</em> y
        la matriz. Esto es típico — la memoria compartida se vuelve más manejable cuando le impones un esquema.
      </P>

      <Code title="estructura compartida">{`#define MAX_N 8

typedef struct {
    int    n;
    double mat[MAX_N][MAX_N];
} MatrizCompartida;`}</Code>

      <Callout tone="warn" title="Tamaño fijo, ahorro de problemas">
        Definir <em>MAX_N</em> y reservar la matriz como un arreglo estático evita una clase entera de bugs.
        Si la dimensión fuera variable, padre e hijo tendrían que ponerse de acuerdo sobre cómo interpretar
        los bytes y cómo calcular offsets. Con tamaño fijo, el puntero al struct sirve igual en ambos procesos.
      </Callout>

      <H3>Núcleo del programa anotado</H3>

      <CodeExplain
        title="determinante.c (núcleo)"
        lines={[
          { code: 'key_t clave = ftok("/tmp", \'D\');', note: 'Llave derivada de /tmp con el caracter "D" como proyecto. /tmp casi siempre existe.' },
          { code: 'int shmid = shmget(clave, sizeof(MatrizCompartida),' },
          { code: '                   IPC_CREAT | IPC_EXCL | 0660);', note: 'Crea el segmento. IPC_EXCL hace que falle si ya existe (útil para detectar ejecuciones previas que no limpiaron).' },
          { code: 'MatrizCompartida *shm = (MatrizCompartida *)shmat(shmid, NULL, 0);', note: 'Mapea el segmento. shm ahora apunta a memoria visible para todo proceso que adjunte el mismo shmid.' },
          { code: 'srand((unsigned)time(NULL));' },
          { code: 'shm->n = n;', note: 'Padre escribe el tamaño en el struct compartido.' },
          { code: 'for (int i = 0; i < n; i++)' },
          { code: '    for (int j = 0; j < n; j++)' },
          { code: '        shm->mat[i][j] = (double)(rand() % 20 + 1);', note: 'Padre llena la matriz con números aleatorios entre 1 y 20.' },
          { code: 'pid_t pid = fork();', note: 'Tras el fork, el hijo hereda el mismo mapeo: tanto el ID como el puntero shm son válidos en ambos.' },
          { code: 'if (pid == 0) {', note: 'HIJO: lee y calcula.' },
          { code: '    double det = determinante(shm->mat, shm->n);' },
          { code: '    printf("Determinante = %.4f\\n", det);' },
          { code: '    shmdt(shm);', note: 'Desadjunta. El hijo no destruye el segmento; eso es trabajo del padre.' },
          { code: '    exit(EXIT_SUCCESS);' },
          { code: '} else {', note: 'PADRE: espera y limpia.' },
          { code: '    int estado;' },
          { code: '    waitpid(pid, &estado, 0);', note: 'Bloquea hasta que el hijo termine. Sin esto, podríamos liberar la memoria mientras el hijo aún la usa.' },
          { code: '    shmdt(shm);' },
          { code: '    shmctl(shmid, IPC_RMID, NULL);', note: 'Marca el segmento para destrucción. El kernel lo libera cuando el último proceso lo desadjunta — en este punto, nadie más.' },
          { code: '}' },
        ]}
      />

      <H2>Por qué no hizo falta sincronizar</H2>
      <P>
        Aunque dijimos que la memoria compartida no se sincroniza sola, este ejemplo funciona sin semáforos.
        El truco es el orden de las operaciones:
      </P>

      <List>
        <li>El padre llena la matriz <strong>antes</strong> de hacer <em>fork()</em>.</li>
        <li>El hijo solo lee (no escribe) la matriz.</li>
        <li>El padre espera con <em>waitpid()</em> a que el hijo termine antes de destruir el segmento.</li>
      </List>

      <P>
        Cada acceso ocurre en una fase distinta del tiempo: escritura → fork → lectura → wait → destrucción.
        No hay solapamiento, no hay riesgo de carrera. En cuanto varios procesos quieran escribir al mismo
        tiempo o intercalarse, hará falta un mutex o un par de semáforos como los de la nota anterior.
      </P>

      <H2>Cálculo del determinante</H2>
      <P>
        Como bono, el algoritmo del hijo es un buen ejemplo de recursión: expansión de cofactores por la
        primera fila.
      </P>

      <Code title="determinante() recursivo">{`double determinante(double m[MAX_N][MAX_N], int n)
{
    if (n == 1) return m[0][0];
    if (n == 2) return m[0][0]*m[1][1] - m[0][1]*m[1][0];

    double det = 0.0;
    double sub[MAX_N][MAX_N];

    for (int col = 0; col < n; col++) {
        /* Submatriz: quitar fila 0 y columna col */
        for (int i = 1; i < n; i++) {
            int k = 0;
            for (int j = 0; j < n; j++) {
                if (j == col) continue;
                sub[i-1][k++] = m[i][j];
            }
        }
        double signo = (col % 2 == 0) ? 1.0 : -1.0;
        det += signo * m[0][col] * determinante(sub, n-1);
    }
    return det;
}`}</Code>

      <List>
        <li><strong>Casos base</strong>: 1x1 y 2x2 se resuelven directamente.</li>
        <li>Para N&gt;2 se construye la submatriz quitando la fila 0 y la columna actual, y se llama a la propia función recursivamente.</li>
        <li>El signo del cofactor alterna: positivo en columnas pares, negativo en impares.</li>
        <li>Es O(N!), por eso el ejemplo limita N&lt;8. Para algo serio existen algoritmos mejores (eliminación gaussiana), pero esto es lo más limpio didácticamente.</li>
      </List>

      <Callout tone="success" title="Lo que demuestra el ejemplo">
        Memoria compartida es la primitiva más cercana al "hardware" entre las IPC: dos procesos viendo la
        misma RAM. Si añadís semáforos para coordinar accesos concurrentes, tenés en tus manos todo lo
        necesario para implementar buffers circulares, caches compartidas, productor/consumidor con buffers
        grandes, e incluso bases de datos en memoria entre procesos del mismo nodo.
      </Callout>
    </>
  );
}
