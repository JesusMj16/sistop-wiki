import { P, H2, H3, List, Code, Callout, Table } from '../../components/ui/Prose';

export default function MinishellComandosFS() {
  return (
    <>
      <P>
        Los comandos del sistema de archivos son los que más se acercan a lo que ya conoces de una shell
        normal: moverse entre directorios, listar contenido, leer archivos, renombrar, eliminar, buscar.
        Casi todos son envolturas finitas alrededor de una llamada al sistema POSIX. En esta nota los
        recorremos uno por uno, con su llamada base y los detalles que importan al implementarlos.
      </P>

      <H2>pwd — saber dónde estás</H2>
      <P>
        El comando <em>pwd</em> imprime el directorio de trabajo actual. La llamada al sistema detrás es
        <em> getcwd()</em>, que copia la ruta absoluta del proceso en un buffer que tú provees.
      </P>

      <Code title="pwd_fun">{`void pwd_fun(void)
{
    char ruta[RUTA];
    if (getcwd(ruta, RUTA) == NULL)
        perror("getcwd");
    else
        printf("%s\\n", ruta);
}`}</Code>

      <List>
        <li><em>RUTA</em> es 255 (definido en <em>minishell.h</em>). Si la ruta real es más larga, <em>getcwd</em> falla y se reporta con <em>perror</em>.</li>
        <li>Cada proceso lleva su propio directorio de trabajo en su <em>PCB</em>; <em>getcwd</em> solo lo consulta.</li>
      </List>

      <H2>cd — moverse de directorio</H2>
      <P>
        <em>cd</em> cambia el directorio de trabajo del proceso con la llamada <em>chdir()</em>. Importa
        recordar que esto solo afecta al proceso que la invoca: si una shell real ejecutara <em>cd</em> en
        un hijo, al volver el directorio no cambiaría. Por eso <em>cd</em> es siempre un comando
        <strong>interno</strong> (built-in), nunca un programa externo.
      </P>

      <Code title="cd_fun">{`void cd_fun(const char *ruta)
{
    if (ruta == NULL)
    {
        fprintf(stderr, "cd: falta el argumento\\n");
        return;
    }
    if (chdir(ruta) == -1)
        perror("cd");
}`}</Code>

      <Callout tone="info" title="Por qué cd no puede ser externo">
        Si <em>cd</em> fuera un programa externo, la shell tendría que hacer <em>fork()</em> para ejecutarlo.
        El hijo cambiaría su directorio, pero al terminar, el padre seguiría exactamente donde estaba. Para
        que <em>cd</em> tenga efecto, debe ejecutarse en el mismo proceso que lee los comandos.
      </Callout>

      <H2>mkdir — crear un directorio</H2>
      <P>
        Envoltura directa de la llamada <em>mkdir()</em>. El segundo argumento es el modo (permisos):
        nuestra implementación usa <em>0777</em> y deja que la <em>umask</em> del proceso recorte los bits
        que no aplican.
      </P>

      <Code title="mkdir_fun">{`int mkdir_fun(const char *cmd)
{
    if (cmd == NULL) {
        fprintf(stderr, "mkdir: falta el nombre del directorio\\n");
        return -1;
    }
    if (mkdir(cmd, 0777) != 0) {
        perror("mkdir");
        return -1;
    }
    return 0;
}`}</Code>

      <H2>ls — listar el contenido del directorio</H2>
      <P>
        <em>ls</em> es el más sustancioso del grupo. Combina varias llamadas: <em>opendir</em> abre un
        flujo de entradas, <em>readdir</em> devuelve cada una, <em>lstat</em> trae los metadatos del
        archivo, y <em>getpwuid</em> / <em>getgrgid</em> traducen IDs numéricos a nombres legibles.
        Además acepta flags al estilo POSIX:
      </P>

      <Table
        headers={['Flag', 'Significado']}
        rows={[
          [<em>-a</em>, 'Muestra archivos ocultos (los que empiezan con punto).'],
          [<em>-l</em>, 'Formato largo: permisos, dueño, grupo, tamaño, fecha.'],
          [<em>-i</em>, 'Antepone el número de inodo a cada entrada.'],
        ]}
      />

      <H3>Cómo se construye el formato largo</H3>
      <P>
        Cuando se solicita <em>-l</em>, una función auxiliar (<em>ls_print_long</em>) hace <em>lstat</em>
        sobre el archivo y arma manualmente la cadena de permisos. Es un buen ejemplo de cómo se decodifican
        los bits de <em>st_mode</em>:
      </P>

      <List>
        <li>El primer carácter indica el <strong>tipo</strong>: <em>d</em> para directorio, <em>l</em> para enlace simbólico, <em>-</em> para archivo regular. Se determina con macros como <em>S_ISDIR</em> y <em>S_ISLNK</em>.</li>
        <li>Los siguientes nueve caracteres son tres tríos <em>rwx</em> para <em>usuario</em>, <em>grupo</em> y <em>otros</em>. Cada bit se prueba contra constantes como <em>S_IRUSR</em>, <em>S_IWGRP</em>, <em>S_IXOTH</em>.</li>
        <li>La fecha de modificación se obtiene de <em>st_mtime</em> y se formatea con <em>strftime</em> al estilo <em>"Nov 14 09:42"</em>.</li>
        <li>UID y GID se convierten en nombres consultando <em>/etc/passwd</em> y <em>/etc/group</em> vía <em>getpwuid</em> y <em>getgrgid</em>.</li>
      </List>

      <Callout tone="warn" title="¿lstat o stat?">
        <em>lstat</em> NO sigue enlaces simbólicos: te dice los metadatos del enlace en sí, no del archivo
        al que apunta. Para <em>ls</em> esto es lo correcto, porque si un <em>symlink</em> apunta a un destino
        roto, aun así queremos mostrarlo. <em>stat</em>, en cambio, lo seguiría y fallaría.
      </Callout>

      <H2>stat — metadatos completos de un archivo</H2>
      <P>
        Donde <em>ls -l</em> resume, <em>stat</em> muestra todo lo que el kernel sabe sobre un archivo:
        número de dispositivo, inodo, modo en octal, conteo de enlaces, propietario, tamaño, número de
        bloques, y tres marcas de tiempo (<em>creación</em>, <em>último acceso</em>, <em>última modificación</em>).
      </P>

      <List>
        <li>Usa <em>lstat()</em> para llenar una estructura <em>struct stat</em>.</li>
        <li>El número de dispositivo se descompone en <em>major</em>/<em>minor</em> con macros del mismo nombre.</li>
        <li>El tipo de archivo se identifica con las macros <em>S_ISxxx</em>, igual que en <em>ls</em>, pero aquí también detecta FIFOs, sockets y dispositivos de bloque/carácter.</li>
        <li>Las marcas de tiempo se imprimen con <em>ctime()</em>, que ya incluye un salto de línea.</li>
      </List>

      <H2>cat — volcar el contenido de un archivo</H2>
      <P>
        <em>cat</em> abre el archivo en modo lectura, transfiere bloques al stdout y lo cierra. Antes de
        leer verifica con <em>lstat</em> que no sea un directorio, porque abrir un directorio con <em>open()</em>
        funciona pero leer de él daría error.
      </P>

      <Code title="cat_fun (núcleo)">{`fd = open(ruta, O_RDONLY);
if (fd == -1) {
    perror("cat");
    return;
}
while ((bytes_read = read(fd, buffer, sizeof(buffer))) > 0)
    write(STDOUT_FILENO, buffer, bytes_read);
close(fd);`}</Code>

      <List>
        <li>Usa <em>read</em>/<em>write</em> en lugar de <em>fread</em>/<em>fwrite</em>. Son llamadas al sistema directas: copian datos del kernel al espacio del proceso sin pasar por buffers de la stdio.</li>
        <li>El buffer es de 1024 bytes. Para archivos grandes, leer en bloques evita cargar todo en memoria.</li>
        <li><em>STDOUT_FILENO</em> es el descriptor 1, la salida estándar.</li>
      </List>

      <H2>unlink y rename — modificar nombres</H2>
      <P>
        Estos dos comandos son los más cortos. <em>unlink()</em> elimina el enlace al archivo (cuando el
        último enlace desaparece, el kernel libera los bloques). <em>rename()</em> cambia el nombre o ruta
        de un archivo en una sola operación atómica.
      </P>

      <Code title="unlink y rename">{`void unlink_fun(const char *ruta) {
    if (unlink(ruta) == -1) perror("unlink");
}

void rename_fun(const char *old, const char *nuevo) {
    if (rename(old, nuevo) == -1) perror("rename");
}`}</Code>

      <Callout tone="info" title="unlink no es DELETE">
        <em>unlink</em> remueve la <strong>entrada de directorio</strong>, no el archivo. Si otro proceso
        tiene abierto el archivo, los datos siguen existiendo hasta que ese proceso cierre el descriptor.
        Es por eso que en UNIX puedes borrar un log que está siendo escrito por un demonio sin romper nada
        — el demonio sigue escribiendo en un inodo que ya nadie ve.
      </Callout>

      <H2>find — buscar por nombre, recursivamente</H2>
      <P>
        El último del grupo es el más interesante porque es <strong>recursivo</strong>. Recorre un directorio,
        compara cada entrada con el nombre buscado, y si encuentra una subcarpeta entra y repite. Devuelve
        en el momento en que encuentra la primera coincidencia.
      </P>

      <Code title="find_fun (núcleo)">{`int find_fun(const char *ruta, const char *nombre_buscado)
{
    DIR *dir = opendir(ruta);
    if (!dir) { /* error */ return 0; }

    struct dirent *entry;
    while ((entry = readdir(dir)) != NULL) {
        if (entry->d_name[0] == '.') continue;

        char ruta_completa[1024];
        snprintf(ruta_completa, sizeof(ruta_completa),
                 "%s/%s", ruta, entry->d_name);

        if (strcmp(entry->d_name, nombre_buscado) == 0) {
            printf("Encontrado: %s\\n", ruta_completa);
            closedir(dir);
            return 1;
        }

        struct stat sb;
        if (lstat(ruta_completa, &sb) == 0 && S_ISDIR(sb.st_mode))
            if (find_fun(ruta_completa, nombre_buscado)) {
                closedir(dir);
                return 1;
            }
    }
    closedir(dir);
    return 0;
}`}</Code>

      <List>
        <li>Salta entradas que empiezan con punto (<em>.</em>, <em>..</em>) para no caer en bucles infinitos.</li>
        <li>Construye la ruta completa concatenando con <em>snprintf</em> y verificando que no se trunque.</li>
        <li>Si la entrada actual es un directorio, llama recursivamente. Si la recursión encontró algo, propaga el éxito hacia arriba.</li>
        <li>Hace un esfuerzo importante por cerrar el <em>DIR</em> en todos los caminos de salida, para no filtrar descriptores.</li>
      </List>

      <Callout tone="success" title="Idea para llevarte">
        Casi cualquier herramienta del filesystem se construye combinando tres primitivas: <em>opendir</em>
        para empezar a recorrer, <em>readdir</em> para iterar, y <em>stat</em> (o <em>lstat</em>) para
        decidir qué hacer con cada entrada. Si entiendes este patrón, puedes implementar <em>tree</em>,
        <em> du</em>, <em>grep -r</em> y muchos más con muy poco código adicional.
      </Callout>
    </>
  );
}
