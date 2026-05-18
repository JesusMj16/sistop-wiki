import { P, H2, H3, Callout, FsDriverFlow, DiskLayoutFlow } from '../../components/ui/Prose';

export default function ArquitecturaFS() {
  return (
    <>

      <P>
        Bienvenido a la primera página de la nueva sección. Aquí dejamos los procesos, los semáforos y
        la memoria compartida, y bajamos un escalón en la pila del kernel para conocer cómo UNIX y
        Linux organizan su disco. El sistema de archivos no es solo una colección de carpetas y
        nombres. Es una arquitectura física precisa, dividida en zonas, con su propio plano maestro,
        su área de etiquetas y su almacén de bytes. La parte del kernel que administra esta
        arquitectura recibe el nombre de Sistema de Archivo Extendido, en inglés Extended File System,
        y según la generación se identifica como <strong>ext2</strong>, <strong>ext3</strong> o
        <strong> ext4</strong>.
      </P>

      <Callout tone="info" title="Por qué esta sección importa tanto">
        Todo lo que hayas visto hasta ahora en el curso, procesos, IPC, memoria, depende en última
        instancia de poder leer y escribir archivos. Cuando ejecutas un binario, el kernel lo lee del
        disco usando estas estructuras. Cuando un programa abre un log, el kernel atraviesa estos
        bloques. Entender la arquitectura del sistema de archivos es entender el suelo sobre el que
        camina todo proceso.
      </Callout>

      <P>
        El sistema de archivos en UNIX es una estructura compuesta por cuatro zonas físicas en disco.
        El <strong>boot</strong>, el <strong>superbloque</strong>, la <strong>lista de inodos</strong>
        y el <strong>área de datos</strong>. Esta estructura está administrada por la parte del
        sistema operativo conocida como Sistema de Archivo Extendido. Su nombre cambia según la
        versión histórica. ext2 introdujo la base sólida. ext3 le añadió journaling. ext4 amplió
        límites y mejoró el rendimiento. Las tres comparten la misma arquitectura general que vamos a
        diseccionar en esta página.
      </P>

      <H3>Las cuatro características fundamentales</H3>

      <P>
        Dentro de las características que posee el sistema de archivos de UNIX y Linux se encuentran
        cuatro pilares. Una <strong>estructura jerárquica</strong> de los archivos, donde todo cuelga
        de un único directorio raíz que se llama <em>/</em>. Una <strong>consistencia y protección de
        datos</strong>, garantizada por permisos, dueños, grupos y por mecanismos como el journaling
        en versiones modernas. La <strong>creación y eliminación de archivos</strong> como operaciones
        primitivas del sistema. Y un <strong>manejo dinámico</strong> de los archivos, que significa
        que el sistema crece o se reduce sin tener que detenerse y sin reservar el espacio máximo por
        adelantado.
      </P>

      <H3>Analogía. El almacén logístico gigante</H3>

      <P>
        Para visualizar la arquitectura completa del disco, imagina un almacén logístico gigante con
        cuatro zonas físicas bien delimitadas. Conforme avancemos cada zona se va a entender mejor,
        pero ten esta imagen presente porque cada concepto técnico va a apoyarse en ella.
      </P>

      <P>
        La <strong>zona del boot</strong> es la caseta de encendido del almacén. Lo primero que se
        prende al llegar por la mañana. Sin esta caseta el resto del almacén ni siquiera se ilumina.
        El <strong>superbloque</strong> es el plano maestro pegado en la pared a la entrada. Te dice
        cuántos pasillos hay, cuántos estantes, cuántas etiquetas disponibles, dónde empieza cada
        zona. Sin el plano maestro estás perdido en metros cuadrados. Los <strong>inodos</strong> son
        las etiquetas de registro pegadas a cada caja del almacén. Cada etiqueta dice quién es el
        dueño de la caja, cuánto pesa, en qué estante exacto está y desde cuándo está ahí. El
        <strong> área de datos</strong> son los estantes físicos donde efectivamente reposan los
        bytes. El contenido bruto. La etiqueta del inodo te dice qué caja buscar y los estantes te
        dan la caja.
      </P>

      <H3>Animación. El layout físico del disco en una cinta de bloques</H3>

      <P>
        Antes de entrar en cada zona conviene ver el disco entero como una cinta de bloques
        consecutivos. Aquí están las cuatro zonas dibujadas en su orden físico real, con un esquema
        de bloques numerados.
      </P>

      <DiskLayoutFlow />

      <H3>Disección zona por zona</H3>

      <P>
        El <strong>boot</strong> ocupa el primer bloque del disco. Su único propósito es contener el
        código mínimo que arranca el sistema operativo cuando enciendes la computadora. La BIOS o el
        firmware UEFI lee este bloque, ejecuta su contenido, y ese código se encarga de cargar el
        kernel desde algún lugar del área de datos. Si tu disco no es de arranque, el bloque sigue
        existiendo por compatibilidad estructural aunque su contenido pueda estar vacío.
      </P>

      <P>
        El <strong>superbloque</strong> ocupa el segundo bloque y es el plano maestro del sistema de
        archivos. Guarda los datos globales que el kernel necesita siempre tener a mano. Tamaño total
        del sistema de archivos. Cantidad de inodos disponibles. Cantidad de inodos libres. Cantidad
        de bloques de datos libres. Tamaño del bloque. Punto de montaje. Marca de tiempo del último
        chequeo. Es tan crítico que las versiones modernas mantienen copias de respaldo en distintos
        puntos del disco, por si el original se corrompe.
      </P>

      <P>
        La <strong>lista de inodos</strong> es un arreglo de estructuras de tamaño fijo. Cada inodo
        es la etiqueta de un archivo. No guarda el nombre, pero sí casi todo lo demás. Tipo de
        archivo, permisos en formato octal, UID y GID del dueño, tamaño en bytes, marcas de tiempo
        de acceso modificación y cambio, contador de enlaces duros, y punteros a los bloques del área
        de datos donde efectivamente vive el contenido. El número del inodo es la llave única que
        identifica cada archivo dentro del sistema. Los nombres viven en los directorios, no en los
        inodos.
      </P>

      <P>
        El <strong>área de datos</strong> ocupa el resto del disco. Son los bloques donde reposan los
        bytes reales de cada archivo. Si un archivo mide menos que un bloque, ocupa un bloque
        completo de todas formas y queda un sobrante interno. Si mide más, ocupa varios bloques que
        el inodo enumera mediante una combinación de punteros directos y punteros indirectos a otros
        bloques de índice.
      </P>

      <Callout tone="info" title="Por qué los nombres no están en los inodos">
        Un detalle elegante del diseño UNIX. Los nombres viven dentro de archivos especiales llamados
        directorios. Un directorio es simplemente una tabla que mapea nombres a números de inodo. Por
        eso el mismo archivo puede tener varios nombres distintos en distintos directorios, todos
        apuntando al mismo número de inodo. Eso es lo que se llama enlace duro. Y por eso renombrar
        un archivo enorme es instantáneo, porque solo modifica una entrada de directorio sin tocar
        los bloques de datos.
      </Callout>


      <H2>Nivel lógico contra nivel físico. Donde aparecen los drivers</H2>

      <P>
        Aquí viene una de las decisiones de diseño más importantes de UNIX. El kernel trabaja con el
        sistema de archivos a un <strong>nivel lógico</strong>, no trata directamente con los discos
        a nivel físico. Lee esa frase otra vez. Significa que cuando un proceso pide leer un archivo,
        el kernel no piensa en términos de platos magnéticos, cabezales, cilindros o sectores. Piensa
        en términos de bloques numerados de un sistema de archivos abstracto. Alguien más se encarga
        de traducir esos bloques lógicos a posiciones físicas reales en el hardware. Ese alguien es
        el <strong>driver</strong> del dispositivo.
      </P>

      <P>
        Cada dispositivo del sistema es considerado por el kernel como una entidad lógica con dos
        números asociados. El <strong>número mayor</strong> y el <strong>número menor</strong>. Estos
        dos números no son arbitrarios. Funcionan como índices dentro de una tabla de funciones del
        kernel. El número mayor selecciona <em>qué driver</em> debe atender la petición. El número
        menor selecciona <em>cuál dispositivo específico</em> dentro de los que ese driver maneja.
        Una vez seleccionado el driver y el dispositivo, el driver se encarga de transformar las
        direcciones lógicas que el sistema de archivos le entrega en direcciones físicas reales del
        disco.
      </P>

      <H3>Analogía del conmutador telefónico</H3>

      <P>
        Imagina el viejo conmutador telefónico de los años cincuenta. El usuario marca un número
        completo. La primera cifra del número decide a qué <em>operadora</em> conecta la llamada. La
        segunda cifra decide a qué <em>extensión</em> dentro del bloque que esa operadora maneja. El
        usuario nunca habla directamente con los cables. Habla con la operadora, que sabe cómo
        conectar físicamente los plugs en el panel correcto. El número mayor es la operadora. El
        número menor es la extensión específica. El kernel marca el número, el driver hace el
        conexionado físico.
      </P>

      <P>
        Otra forma de verlo es el servicio postal. Cuando envías una carta, escribes una dirección
        lógica como Calle Falsa 123 Colonia Centro. Para el cartero esa dirección es una etiqueta
        abstracta. El cartero traduce esa dirección a una ruta física específica, qué calles
        atravesar, en qué portón meterse, qué buzón usar. Tú jamás necesitas saber el camino
        concreto. La traducción es trabajo del cartero. En el kernel, las direcciones lógicas del
        sistema de archivos son la dirección postal. El driver es el cartero. Las direcciones físicas
        del disco son la ruta concreta.
      </P>

      <H3>Animación. El flujo de traducción desde la petición hasta el plato magnético</H3>

      <P>
        Veamos en cámara lenta qué pasa cuando un proceso pide leer un byte de un archivo. Pon
        atención al rol que juegan el número mayor y el número menor en cada etapa.
      </P>

      <FsDriverFlow />

      <P>
        Cada flecha hacia abajo es una traducción. La VFS no sabe de extensiones .ext4 ni de
        cilindros. El driver sd no sabe de inodos. Los platos no saben de números de archivo. Cada
        capa habla solo con su vecino inmediato. La belleza está en la separación de
        responsabilidades. Cambias el disco mecánico por un SSD y solo se reemplaza el driver. El
        kernel sigue pidiendo bloques lógicos como siempre.
      </P>

      <Callout tone="info" title="Por qué importa esta separación lógica física">
        La separación lógica versus física es la razón por la que UNIX corre en hardware tan distinto.
        Discos magnéticos, SSD NVMe, memorias flash USB, sistemas de archivos en red. El kernel
        siempre habla en bloques lógicos. Solo el driver sabe del medio físico real. Si mañana
        inventan memoria cuántica, basta con escribir un driver nuevo y el resto del kernel sigue
        funcionando sin cambios. Esto es ingeniería de software de máxima clase.
      </Callout>


      <H2>Evolución del Extended File System. De ext2 a ext4</H2>

      <P>
        El Extended File System nació en 1992 como respuesta a las limitaciones del Minix File System
        que Linux usaba al inicio. Tres grandes generaciones le siguieron. La evolución no cambió la
        arquitectura conceptual que acabas de aprender. Sigue habiendo boot, superbloque, inodos y
        área de datos. Lo que cambió fue la <strong>protección</strong> y el <strong>manejo
        dinámico</strong> de esos elementos. Veamos cada salto.
      </P>

      <H3>ext2. La base sólida</H3>

      <P>
        Fue el primer sistema de archivos pensado específicamente para Linux con la arquitectura
        Extended completa. Estableció el formato de inodos, el superbloque, los grupos de bloques y
        el bitmap de bloques libres. Su gran limitación es que en caso de un apagado abrupto, por
        ejemplo un corte de luz, el sistema podía quedar inconsistente. Para recuperarse había que
        correr la utilidad <em>fsck</em> que recorre el disco entero validando estructuras. En discos
        grandes esto podía tardar horas. Funciona, pero la confianza tras una caída es baja.
      </P>

      <H3>ext3. Llega el journaling, la red de seguridad</H3>

      <P>
        ext3 es ext2 más una pieza nueva llamada <strong>journal</strong>. Imagina que antes de mover
        cualquier caja en tu almacén, escribes en una libreta exactamente qué vas a mover y a dónde.
        Si el techo se cae a la mitad del movimiento, cuando regreses puedes leer la libreta y saber
        exactamente qué quedó a medias. Lo terminas o lo deshaces. Eso es journaling. ext3 reserva
        una zona del disco como bitácora. Antes de aplicar una modificación al sistema de archivos,
        la escribe primero al journal. Si ocurre un crash, al reiniciar el sistema lee el journal y
        completa o revierte las operaciones pendientes. Esto reduce los tiempos de recuperación de
        horas a segundos y baja drásticamente el riesgo de corrupción.
      </P>

      <H3>ext4. Más límites, mejor rendimiento, más dinámico</H3>

      <P>
        ext4 conservó todo lo bueno de ext3 y rompió los techos. Los archivos individuales pueden
        crecer hasta 16 terabytes en lugar de 2. El sistema de archivos completo soporta hasta 1
        exabyte. Pero la mejora conceptual más importante es el manejo dinámico vía
        <strong> extents</strong>. En ext2 y ext3, los inodos mantenían listas largas de punteros a
        bloques individuales. Si un archivo ocupaba 100000 bloques, había 100000 punteros. ext4 los
        agrupa en rangos contiguos. Un extent dice <em>desde el bloque 5000 hasta el bloque 7000 son
        míos sin interrupción</em>. Eso es una sola entrada en lugar de 2000. El resultado es menos
        metadata, menos lecturas, mejor rendimiento, y archivos grandes mucho más rápidos.
      </P>

      <P>
        ext4 también añadió asignación retardada de bloques, una técnica que pospone la decisión de
        en qué bloques físicos colocar los datos hasta el último momento. Esto permite al sistema
        agrupar escrituras pequeñas en bloques contiguos, lo que reduce la fragmentación interna del
        disco y aumenta la vida útil de los SSDs.
      </P>

      <Callout tone="success" title="La lección de la evolución ext">
        En treinta años el Extended File System pasó de ser una estructura estática propensa a
        corrupción a un sistema robusto, transaccional y elástico. Pero la arquitectura conceptual
        sigue siendo la misma. Boot. Superbloque. Lista de inodos. Área de datos. La mejora estuvo en
        proteger esa arquitectura contra fallos, journaling, y en permitirle adaptarse a tamaños y
        cargas modernas, extents y asignación retardada. La estructura es estable. La protección y el
        manejo dinámico evolucionan.
      </Callout>

      <H2>Qué entendimos</H2>

      <P>
        Si tuvieras que explicarle todo esto a alguien en treinta segundos, este sería el mapa mental
        completo que deberías poder recitar de memoria. Léelo lento. Cada párrafo concentra un piso
        entero del rascacielos que es el sistema de archivos de UNIX.
      </P>

      <P>
        Un sistema de archivos UNIX es una estructura de cuatro zonas físicas en el disco. El
        <strong> boot</strong> es la caseta de encendido. El <strong>superbloque</strong> es el
        plano maestro con datos globales. La <strong>lista de inodos</strong> es el catálogo de
        etiquetas de cada archivo con sus permisos, dueños y punteros a bloques. El <strong>área de
        datos</strong> son los estantes donde efectivamente viven los bytes. Los nombres de archivo
        no viven en los inodos sino en los directorios, que son tablas que mapean nombre a número de
        inodo.
      </P>

      <P>
        El kernel trabaja siempre a <strong>nivel lógico</strong>, hablando en términos de bloques
        abstractos del sistema de archivos. Nunca toca platos ni sectores directamente. Cada
        dispositivo tiene asociado un <strong>número mayor</strong> y un <strong>número menor</strong>.
        El mayor indexa una tabla de drivers y selecciona cuál driver atiende la petición. El menor
        selecciona dentro de ese driver cuál dispositivo específico se usa. El driver es el que
        traduce las direcciones lógicas que recibe del kernel en direcciones físicas reales del
        hardware. Esa separación lógica versus física es la razón por la que UNIX corre sobre
        cualquier hardware sin cambiar el kernel.
      </P>

      <P>
        El Extended File System evolucionó en tres generaciones manteniendo siempre la misma
        arquitectura de cuatro zonas. <strong>ext2</strong> estableció la base sólida. <strong>ext3</strong>
        añadió <em>journaling</em> como red de seguridad contra crashes, reduciendo los tiempos de
        recuperación de horas a segundos. <strong>ext4</strong> introdujo extents para manejo
        dinámico eficiente de archivos enormes, asignación retardada para reducir fragmentación, y
        rompió los techos de tamaño llevándolos a 16 terabytes por archivo y 1 exabyte por sistema de
        archivos completo. La estructura no cambió. La protección y el manejo dinámico sí.
      </P>
    </>
  );
}
