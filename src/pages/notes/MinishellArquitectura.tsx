import { P, H2, H3, List, Code, Callout, CodeExplain } from '../../components/ui/Prose';

export default function MinishellArquitectura() {
  return (
    <>
      <P>
        El corazón de cualquier shell es un patrón <strong>REPL</strong> (Read-Eval-Print Loop): un bucle
        que lee una línea, la evalúa como comando, imprime el resultado y vuelve a empezar. Esta nota
        desglosa cómo está implementado ese bucle en nuestra minishell y, sobre todo, cómo se separa
        una línea de texto en argumentos antes de despacharla a la función adecuada.
      </P>

      <H2>El bucle principal en shell.c</H2>
      <P>
        El archivo <em>shell.c</em> contiene únicamente <em>main()</em> y la lógica de despacho. Todo el
        trabajo "pesado" vive en la biblioteca. Esta separación es deliberada: leyendo solo <em>shell.c</em>
        ya puedes entender el flujo completo del intérprete sin perderte en detalles.
      </P>

      <CodeExplain
        title="shell.c (esqueleto del REPL)"
        lines={[
          { code: '#include "lib/minishell.h"', note: 'Trae la declaración de cada comando y los includes de POSIX.' },
          { code: 'int main(void) {' },
          { code: '    char  cmd[255];', note: 'Buffer para la línea cruda que escribe el usuario.' },
          { code: '    char *args[MAX_ARGS];', note: 'Arreglo de punteros a tokens. MAX_ARGS está definido en el header (64).' },
          { code: '    while (1) {', note: 'Bucle infinito: solo se rompe con EOF o con el comando exit.' },
          { code: '        printf("\\n> ");', note: 'Imprime el prompt al inicio de cada iteración.' },
          { code: '        fflush(stdout);', note: 'Vacía el buffer de stdout. Sin esto, el prompt podría no aparecer hasta el siguiente \\n.' },
          { code: '        if (fgets(cmd, sizeof(cmd), stdin) == NULL)', note: 'Lee una línea. fgets devuelve NULL si recibe EOF (Ctrl+D).' },
          { code: '            break;' },
          { code: '        cmd[strcspn(cmd, "\\n")] = \'\\0\';', note: 'Trunca el \\n que fgets dejó. strcspn busca la primera ocurrencia de \\n y devuelve su índice.' },
          { code: '        int argc = separar_cadena(cmd, args, MAX_ARGS);', note: 'Tokeniza la línea por espacios y devuelve cuántos tokens encontró.' },
          { code: '        if (argc == 0) continue;', note: 'Línea vacía: reintenta sin hacer nada.' },
          { code: '        if (strcmp(args[0], "pwd") == 0)', note: 'Comienza el dispatch. Cada comando es un if/else if comparando args[0].' },
          { code: '            pwd_fun();' },
          { code: '        else if (strcmp(args[0], "exit") == 0)', note: 'Único comando que rompe el bucle.' },
          { code: '            break;' },
          { code: '        /* ... resto de comandos ... */' },
          { code: '        else', note: 'Si ninguna rama coincidió, el comando es desconocido.' },
          { code: '            fprintf(stderr, "%s: comando no encontrado\\n", args[0]);' },
          { code: '    }' },
          { code: '    return 0;' },
          { code: '}' },
        ]}
      />

      <Callout tone="info" title="¿Por qué fgets y no scanf?">
        <em>scanf</em> con <em>%s</em> deja de leer en el primer espacio en blanco, así que perderías el resto
        de los argumentos. <em>fgets</em> lee la línea entera hasta el <em>\n</em> o hasta llenar el buffer,
        que es justo lo que necesitamos antes de tokenizar manualmente.
      </Callout>

      <H2>Tokenización: separar_cadena()</H2>
      <P>
        Una vez leída la línea, hay que partirla en piezas. <em>separar_cadena()</em> es una envoltura
        sobre <em>strtok()</em> de la biblioteca estándar. <em>strtok</em> recorre la cadena reemplazando
        los delimitadores por <em>\0</em> y devolviendo punteros al inicio de cada token. No copia memoria:
        modifica la cadena original en el lugar.
      </P>

      <Code title="separar_cadena()">{`int separar_cadena(char *cadena, char *args[], int max_args)
{
    int   i     = 0;
    char *token = strtok(cadena, " ");

    while (token != NULL && i < max_args - 1)
    {
        args[i++] = token;
        token     = strtok(NULL, " ");
    }
    args[i] = NULL;
    return i;
}`}</Code>

      <List>
        <li>La <strong>primera llamada</strong> a <em>strtok</em> recibe la cadena; las siguientes reciben <em>NULL</em> para indicarle "sigue donde te quedaste".</li>
        <li>El bucle se detiene cuando <em>strtok</em> devuelve <em>NULL</em> (no hay más tokens) o cuando llenamos el arreglo.</li>
        <li>El último elemento del arreglo se deja en <em>NULL</em>: una convención típica para iterar sin necesidad de pasar también el conteo.</li>
        <li>Se devuelve <em>i</em>, la cantidad de tokens, que en <em>main()</em> se interpreta como <em>argc</em>.</li>
      </List>

      <Callout tone="warn" title="Limitaciones del split por espacios">
        <em>strtok</em> con <em>" "</em> como delimitador no respeta comillas ni escapes, así que un argumento
        con espacios (<em>"hola mundo"</em>) se rompe en dos tokens. Una shell de verdad usa un parser más
        elaborado; esto es una decisión consciente para mantener el código pequeño.
      </Callout>

      <H2>El despacho: una cadena de if/else if</H2>
      <P>
        Después de tokenizar, <em>main()</em> compara <em>args[0]</em> contra cada comando soportado usando
        <em>strcmp()</em>. Es la forma más directa de despachar y, con pocos comandos, sigue siendo legible.
        Cada rama es básicamente: "si el primer token es X, llama a <em>X_fun()</em>".
      </P>

      <List>
        <li>Los comandos que necesitan argumentos (<em>cd</em>, <em>mkdir</em>, <em>stat</em>, <em>cat</em>, <em>unlink</em>) validan antes que <em>argc</em> alcance e imprimen un mensaje de uso si no.</li>
        <li>Los que no necesitan más argumentos (<em>pwd</em>, <em>date</em>, <em>who</em>) se llaman directamente.</li>
        <li>Los que aceptan flags (<em>ls</em>, <em>wall</em>, <em>mac</em>) reciben el arreglo completo de <em>args</em> y lo recorren internamente.</li>
      </List>

      <H3>Comandos que delegan en system()</H3>
      <P>
        Algunos comandos no implementan la funcionalidad por sí mismos sino que delegan en programas
        existentes mediante <em>system()</em>:
      </P>
      <List>
        <li><em>free</em> ejecuta <em>system("free -h")</em>.</li>
        <li><em>who</em> ejecuta <em>system("who")</em>.</li>
        <li><em>clear</em> ejecuta <em>system("clear")</em>.</li>
      </List>
      <P>
        <em>system()</em> internamente hace <em>fork() + execvp() + wait()</em> usando <em>/bin/sh</em> como
        intermediario. Es la forma más rápida de añadir un comando si ya existe la utilidad, aunque pagas
        el precio de crear un proceso por cada llamada.
      </P>

      <H2>Tipos de errores reportados</H2>
      <P>
        Una shell útil tiene que distinguir entre que el usuario tecleó algo mal y que el sistema reportó
        un error real. La minishell maneja ambos casos:
      </P>

      <List>
        <li><strong>perror()</strong>: cuando una llamada al sistema falla (por ejemplo <em>getcwd</em>, <em>chdir</em>, <em>opendir</em>). Imprime un prefijo y el mensaje de <em>errno</em> traducido. La verás en casi todas las funciones de <em>minishell.c</em>.</li>
        <li><strong>fprintf(stderr, ...)</strong>: para errores de uso, como faltar el argumento de <em>cd</em> o no encontrar el comando. No depende de <em>errno</em>: simplemente describe el problema desde el lado del programa.</li>
      </List>

      <Callout tone="success" title="Construido para crecer">
        Agregar un comando nuevo es una operación de tres pasos: declarar su función en <em>minishell.h</em>,
        implementarla en <em>minishell.c</em> y añadir una rama <em>else if</em> en <em>main()</em>. El esqueleto
        no cambia. Por eso este patrón escala hasta cierto punto sin volverse caótico — y por qué shells
        reales acaban reemplazándolo por una tabla de despacho con punteros a función.
      </Callout>
    </>
  );
}
