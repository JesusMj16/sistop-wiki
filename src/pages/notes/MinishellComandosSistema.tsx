import { P, H2, H3, List, Code, Callout } from '../../components/ui/Prose';

export default function MinishellComandosSistema() {
  return (
    <>
      <P>
        Esta segunda familia de comandos no toca el sistema de archivos: extrae información del kernel,
        del hardware y del entorno del usuario. Cada uno aterriza una llamada al sistema distinta y, en
        conjunto, demuestra cómo POSIX expone "estado del sistema" como si fueran lecturas de archivo o
        consultas a tablas internas.
      </P>

      <H2>uname — quién es esta máquina</H2>
      <P>
        La llamada <em>uname()</em> llena una <em>struct utsname</em> con cinco campos sobre el sistema:
        nombre del kernel, nombre de la máquina (hostname), versión, release y arquitectura. Es la misma
        información que muestra <em>uname -a</em> en una terminal real.
      </P>

      <Code title="uname_fun">{`void uname_fun(){
    struct utsname info;
    uname(&info);
    printf("Sistema: %s\\n", info.sysname);
    printf("Nodo: %s\\n", info.nodename);
    printf("Release: %s\\n", info.release);
    printf("Version: %s\\n", info.version);
    printf("Arquitectura: %s\\n", info.machine);
}`}</Code>

      <List>
        <li><em>sysname</em>: nombre del SO (típicamente <em>Linux</em>).</li>
        <li><em>nodename</em>: hostname configurado en la máquina.</li>
        <li><em>release</em>: versión exacta del kernel (<em>6.x</em>).</li>
        <li><em>version</em>: cadena con la fecha de compilación y opciones del kernel.</li>
        <li><em>machine</em>: arquitectura del hardware (<em>x86_64</em>, <em>aarch64</em>, ...).</li>
      </List>

      <H2>date — fecha y hora locales</H2>
      <P>
        Combina tres pasos clásicos de la biblioteca <em>time.h</em>: <em>time()</em> obtiene el número de
        segundos desde el <em>epoch</em>, <em>localtime()</em> lo convierte a una estructura con campos
        (año, mes, día, hora, minutos, segundos) ajustada a la zona horaria local, y <em>strftime()</em>
        produce una cadena con el formato que tú especifiques.
      </P>

      <Code title="date_fun">{`void date_fun(void)
{
    time_t t = time(NULL);
    struct tm *tm_info = localtime(&t);
    char buffer[64];
    strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", tm_info);
    printf("%s CST", buffer);
}`}</Code>

      <Callout tone="info" title="¿Por qué tres llamadas para algo tan simple?">
        Internamente el tiempo se maneja como un entero (segundos desde 1970) porque es lo único que
        evoluciona de forma uniforme. Las representaciones humanas (zona horaria, calendarios, formatos)
        son una capa que se agrega encima. Esto te permite hacer aritmética de tiempo sin preocuparte por
        zonas, y solo aplicar el formato al imprimirlo.
      </Callout>

      <H2>who — quién está conectado al sistema</H2>
      <P>
        Aquí elegimos el camino simple: <em>system("who")</em>. La utilidad <em>who</em> ya existe en todos
        los UNIX y lee <em>/var/run/utmp</em> para reportar las sesiones activas. Reimplementarla nosotros
        sería un ejercicio interesante, pero no aporta nada conceptual nuevo.
      </P>

      <Code title="who_fun">{`void who_fun() {
    system("who");
}`}</Code>

      <Callout tone="warn" title="system() lanza un fork">
        Cada llamada a <em>system()</em> crea un proceso hijo, ejecuta <em>/bin/sh -c "comando"</em> y
        espera su terminación. Es más costoso que llamar la función directamente, pero a veces el código
        que ganas en simplicidad lo justifica.
      </Callout>

      <H2>ip — listar direcciones de interfaces de red</H2>
      <P>
        Este comando consulta las interfaces de red con <em>getifaddrs()</em>, que devuelve una lista
        enlazada de estructuras <em>struct ifaddrs</em>. Cada nodo describe una interfaz: nombre
        (<em>lo</em>, <em>eth0</em>, <em>wlan0</em>) y una dirección asociada. <em>getnameinfo()</em>
        convierte la dirección binaria en una cadena legible.
      </P>

      <Code title="fun_getifaddrs (núcleo)">{`if (getifaddrs(&ifaddr) == -1) {
    perror("getifaddrs");
    return -1;
}
for (ifa = ifaddr; ifa != NULL; ifa = ifa->ifa_next) {
    if (ifa->ifa_addr == NULL) continue;
    int family = ifa->ifa_addr->sa_family;

    if (family == AF_INET || family == AF_INET6) {
        getnameinfo(ifa->ifa_addr,
            (family == AF_INET) ? sizeof(struct sockaddr_in)
                                : sizeof(struct sockaddr_in6),
            host, INET6_ADDRSTRLEN, NULL, 0, NI_NUMERICHOST);
        printf("%s: %s\\n", ifa->ifa_name, host);
    }
}
freeifaddrs(ifaddr);`}</Code>

      <List>
        <li>Filtra las interfaces que no tienen dirección asignada (<em>ifa_addr == NULL</em>).</li>
        <li>Solo procesa <em>AF_INET</em> (IPv4) y <em>AF_INET6</em> (IPv6). La misma lista incluye también <em>AF_PACKET</em> (capa de enlace), que se usará en el comando <em>mac</em>.</li>
        <li>El flag <em>NI_NUMERICHOST</em> evita que <em>getnameinfo</em> intente hacer un DNS reverso, lo que sería lento y a veces falla.</li>
        <li><em>freeifaddrs</em> es obligatorio: la lista la alocó la libc y hay que liberarla.</li>
      </List>

      <H2>mac — direcciones MAC físicas</H2>
      <P>
        Reusa <em>getifaddrs</em> pero filtra por <em>AF_PACKET</em>, que corresponde a la capa 2 (Ethernet,
        Wi-Fi). En esa familia, la dirección es la MAC: seis bytes que identifican unívocamente la tarjeta
        de red.
      </P>

      <Code title="mac_fun (núcleo)">{`for (ifa = ifaddr; ifa != NULL; ifa = ifa->ifa_next) {
    if (ifa->ifa_addr == NULL) continue;
    if (ifa->ifa_addr->sa_family != AF_PACKET) continue;

    struct sockaddr_ll *s = (struct sockaddr_ll *)ifa->ifa_addr;
    unsigned char *mac = s->sll_addr;

    /* Saltar la MAC 00:00:00:00:00:00 (loopback) */
    if (mac[0]==0 && mac[1]==0 && mac[2]==0 &&
        mac[3]==0 && mac[4]==0 && mac[5]==0) continue;

    printf("%02x:%02x:%02x:%02x:%02x:%02x\\n",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
}`}</Code>

      <Callout tone="info" title="¿Por qué hay que castear?">
        La estructura <em>ifa-&gt;ifa_addr</em> es de tipo genérico <em>struct sockaddr</em>. Para acceder a
        los bytes de la MAC necesitas casterar a <em>struct sockaddr_ll</em> (link-layer), que es la
        especialización para <em>AF_PACKET</em>. Es un patrón habitual en POSIX: los punteros genéricos
        se casterean según la familia de protocolos.
      </Callout>

      <H2>free — memoria del sistema</H2>
      <P>
        Como con <em>who</em>, delegamos en la utilidad existente del sistema: <em>system("free -h")</em>.
        La flag <em>-h</em> imprime las cifras en unidades legibles (GB/MB) en lugar de bytes.
      </P>

      <H3>¿Por qué no escribirlo nosotros?</H3>
      <P>
        Implementar <em>free</em> a mano implica abrir <em>/proc/meminfo</em>, parsear sus líneas y
        formatear los valores. Es educativo, pero alarga la nota sin agregar conceptos nuevos. Si te
        interesa, abre <em>/proc/meminfo</em> con <em>cat</em> y veras el formato crudo.
      </P>

      <H2>wall — mensaje en broadcast a todos los terminales</H2>
      <P>
        El comando más interesante del grupo. <em>wall</em> envía un mensaje a cada terminal donde hay un
        usuario conectado. Para encontrarlas, recorre el archivo <em>utmp</em> usando <em>getutent()</em>,
        que abstrae la lectura de <em>/var/run/utmp</em>. Por cada entrada activa abre <em>/dev/&lt;tty&gt;</em>
        y escribe directamente.
      </P>

      <Code title="wall_fun (núcleo)">{`setutent();
while ((entry = getutent()) != NULL) {
    if (entry->ut_type != USER_PROCESS) continue;

    snprintf(tty_path, sizeof(tty_path), "/dev/%s", entry->ut_line);

    fd = open(tty_path, O_WRONLY | O_NOCTTY);
    if (fd == -1) { /* error */ continue; }
    write(fd, "\\n[Broadcast]: ", 14);
    write(fd, mensaje, strlen(mensaje));
    close(fd);
}
endutent();`}</Code>

      <List>
        <li><em>setutent()</em> rebobina el archivo de sesiones al inicio.</li>
        <li><em>getutent()</em> devuelve la siguiente entrada o <em>NULL</em> al final.</li>
        <li><em>ut_type == USER_PROCESS</em> filtra a los usuarios conectados (descarta logins de sistema, getty, etc.).</li>
        <li><em>O_NOCTTY</em> evita que abrir el TTY lo convierta en la terminal controladora del proceso, cosa que cambiaría el comportamiento de señales como <em>SIGINT</em>.</li>
        <li><em>endutent()</em> cierra el archivo cuando terminas.</li>
      </List>

      <Callout tone="warn" title="Requiere permisos">
        Para escribir en <em>/dev/&lt;tty&gt;</em> de otros usuarios suele hacer falta pertenecer al grupo
        <em> tty</em> o ejecutar la shell como <em>root</em>. Si no, <em>open()</em> devuelve <em>EACCES</em>
        y el bucle simplemente reporta el error y continúa con la siguiente terminal.
      </Callout>

      <H2>clear y exit — utilitarios mínimos</H2>
      <P>
        Los dos últimos son tan cortos que casi no merecen sección. <em>clear</em> delega en <em>system("clear")</em>
        para mandar al terminal la secuencia de escape ANSI que limpia la pantalla (<em>\033[H\033[2J</em>).
        <em> exit</em> es la única rama del dispatcher que rompe el <em>while(1)</em> del bucle principal,
        con lo cual <em>main()</em> retorna y el proceso termina normalmente.
      </P>

      <Callout tone="success" title="Lo que demuestra esta familia">
        Los comandos del sistema enseñan que el kernel expone su estado de muchas maneras: estructuras
        rellenadas por una llamada (<em>uname</em>, <em>time</em>), listas enlazadas (<em>getifaddrs</em>,
        <em>getutent</em>), archivos especiales bajo <em>/proc</em>, o herramientas existentes que ya
        encapsulan todo lo anterior (<em>free</em>, <em>who</em>). Saber moverse entre estas opciones es
        la diferencia entre <em>scriptear</em> y <em>programar sistemas</em>.
      </Callout>
    </>
  );
}
