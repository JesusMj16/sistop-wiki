import { P, H2, H3, List, Callout } from '../../components/ui/Prose';

export default function MinishellIntro() {
  return (
    <>
      <P>
        Hasta aquí hemos visto cómo el sistema operativo crea procesos, los identifica, los espera y les
        permite comunicarse. Toda esa teoría toma forma cuando se mete dentro de un programa que la pone
        en práctica. Esta sección documenta una <strong>minishell</strong>: una shell minimalista escrita
        en C que reúne casi todas las llamadas al sistema vistas en el curso dentro de un mismo binario.
      </P>

      <P>
        Una <em>shell</em> es un programa que actúa como intérprete entre el usuario y el kernel. Lee
        una línea, la interpreta como un comando, ejecuta la acción correspondiente y muestra el resultado.
        Las shells reales (<em>bash</em>, <em>zsh</em>, <em>fish</em>) son enormes porque resuelven
        cosas como pipes, redirecciones, scripting, expansión de variables y control de jobs. La nuestra
        no llega tan lejos: el objetivo es <strong>mostrar cómo se construye el esqueleto</strong> y, sobre
        él, cómo se cuelgan llamadas al sistema una por una.
      </P>

      <H2>¿Qué hace la minishell?</H2>
      <P>
        El programa expone un prompt sencillo (<em>{'>'}</em>) y queda esperando una línea del usuario.
        Cuando la recibe, separa la cadena en argumentos, identifica el comando y llama a la función
        encargada. Cada comando interno corresponde casi siempre a <strong>una llamada al sistema</strong>
        envuelta para imprimir resultados o errores legibles.
      </P>

      <List>
        <li><strong>Comandos del sistema de archivos:</strong> <em>pwd</em>, <em>cd</em>, <em>mkdir</em>, <em>ls</em>, <em>stat</em>, <em>cat</em>, <em>unlink</em>, <em>rename</em>, <em>find</em>.</li>
        <li><strong>Comandos de información del sistema:</strong> <em>free</em>, <em>ip</em>, <em>mac</em>, <em>date</em>, <em>who</em>, <em>uname</em>, <em>wall</em>.</li>
        <li><strong>Utilitarios:</strong> <em>clear</em> y <em>exit</em> para limpiar la pantalla y salir del bucle.</li>
      </List>

      <Callout tone="info" title="¿Por qué importa hacer una shell propia?">
        Una shell es el laboratorio natural para aterrizar todo lo aprendido. Casi cualquier programa
        que escribas como parte del curso (procesos, IPC, semáforos) lo lanzas desde una shell, así que
        construir una te obliga a entender qué pasa <strong>antes</strong> de que tu programa siquiera arranque:
        cómo se parsea la línea, cómo se busca el comando, cómo se reportan errores.
      </Callout>

      <H2>Estructura del proyecto</H2>
      <P>
        El código está organizado en tres archivos para mantener separadas las responsabilidades:
        el <em>punto de entrada</em>, una <em>biblioteca</em> con la implementación de cada comando, y
        un <em>encabezado</em> que declara la interfaz pública. Esta separación no es decorativa: permite
        agregar comandos nuevos sin tocar el bucle principal.
      </P>

      <List>
        <li><strong>shell.c</strong>: contiene <em>main()</em> y el bucle de lectura. Es el corazón del intérprete: lee, separa, despacha.</li>
        <li><strong>lib/minishell.h</strong>: declara las funciones de cada comando y agrupa todos los <em>include</em> de POSIX necesarios (unistd, sys/stat, dirent, sys/utsname, etc.).</li>
        <li><strong>lib/minishell.c</strong>: implementa cada comando como una función independiente. Aquí viven las llamadas al sistema reales.</li>
      </List>

      <H3>Compilación</H3>
      <P>
        Como el código está repartido en varios archivos, hay que compilar todo junto y decirle al
        compilador dónde encontrar los encabezados. La instrucción es directa con <em>gcc</em>:
      </P>

      <List>
        <li><em>-I lib/</em> agrega el directorio <em>lib</em> a la ruta de búsqueda de <em>#include</em>.</li>
        <li><em>shell.c</em> y <em>lib/minishell.c</em> son las dos unidades de traducción que entran a la compilación.</li>
        <li><em>-o minishell</em> nombra al ejecutable final.</li>
      </List>

      <H2>Cómo se compone una sesión</H2>
      <P>
        Cuando arranca, el ejecutable entra en un bucle infinito que repite estos pasos hasta que el
        usuario teclea <em>exit</em> o cierra la entrada estándar:
      </P>

      <List>
        <li><strong>Imprime el prompt</strong> y vacía el buffer de salida con <em>fflush(stdout)</em> para que aparezca aunque la línea no termine en salto de línea.</li>
        <li><strong>Lee la línea</strong> con <em>fgets()</em>. Si recibe EOF (por ejemplo, con Ctrl+D), rompe el bucle.</li>
        <li><strong>Trunca el salto de línea</strong> que <em>fgets()</em> deja al final de la cadena.</li>
        <li><strong>Tokeniza</strong> la línea separándola por espacios en un arreglo de argumentos.</li>
        <li><strong>Despacha</strong>: compara el primer argumento con cada comando conocido y, si coincide, llama a la función correspondiente.</li>
        <li><strong>Vuelve a empezar.</strong></li>
      </List>

      <Callout tone="success" title="Idea para llevarte">
        Este patrón <em>lee — tokeniza — despacha — ejecuta</em> es el mismo que usan shells, intérpretes
        de comandos, REPLs de lenguajes de programación e incluso muchas interfaces de control remoto.
        Lo que cambia es la sofisticación del parser y la riqueza del catálogo de acciones; el esqueleto
        es el mismo.
      </Callout>

      <H2>Qué viene a continuación</H2>
      <P>
        En las siguientes notas desmenuzamos cada parte. Primero veremos el <strong>bucle REPL</strong> y
        cómo se separa una línea en argumentos. Después recorreremos los <strong>comandos del sistema de
        archivos</strong> (los que se apoyan en <em>dirent.h</em>, <em>sys/stat.h</em> y <em>unistd.h</em>) y
        finalmente los <strong>comandos de información del sistema</strong> (red, usuarios, kernel, mensajes
        en broadcast).
      </P>
    </>
  );
}
