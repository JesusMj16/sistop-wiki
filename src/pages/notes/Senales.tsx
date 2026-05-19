import { P, H2, H3, Callout, SignalsFlow } from '../../components/ui/Prose';

export default function Senales() {
  return (
    <>
      <H2>7.5 Señales</H2>

      <P>
        Las señales son interrupciones de software que pueden ser enviadas a un proceso para
        informarle de algún evento asíncrono o alguna situación especial. El término señal se
        emplea también para referirse al evento en sí. Son el mecanismo más antiguo y más simple
        que tiene UNIX para que el kernel, otros procesos o el propio usuario interrumpan el flujo
        normal de un programa para avisarle que algo pasó. Ctrl C en la terminal, una división
        entre cero, la muerte de un hijo, un timer que expiró, todos esos eventos llegan al
        proceso como señales.
      </P>

      <P>
        El sistema operativo identifica cada señal con un número entero positivo al cual le asocia
        un nombre simbólico. Por convención el nombre empieza con las letras <strong>SIG</strong>.
        Ejemplos clásicos. SIGINT es la señal 2 que se dispara con Ctrl C. SIGSEGV es la señal 11
        que indica una violación de segmento. SIGKILL es la señal 9 que mata el proceso sin
        posibilidad de negociar. SIGTERM es la señal 15 que pide una salida ordenada. Conocer estos
        números y sus nombres es parte del vocabulario básico de cualquier programador de sistemas.
      </P>

      <Callout tone="info" title="Analogía. El timbre de tu casa">
        Piensa en una señal como el timbre de tu casa. Tu vida sigue su curso normal hasta que
        suena. En ese momento tienes tres opciones. Ignorarlo y seguir con lo tuyo. Dejar que
        actúe el comportamiento por defecto, por ejemplo abrir la puerta automáticamente como un
        portero eléctrico. O atenderlo tú mismo con una rutina propia, mirar por la mirilla, ver
        quién es, decidir si abres o no. Las señales en UNIX funcionan exactamente igual. Llegan
        en cualquier momento, son asíncronas, y tú decides cómo responder.
      </Callout>

      <H2>7.5.1 Introducción. Las tres formas de responder a una señal</H2>

      <P>
        Los procesos pueden enviarse señales unos a otros a través del llamado al sistema
        <em> kill</em>. En la siguiente sección veremos su prototipo y cómo se usa. También es
        frecuente que durante la ejecución un proceso reciba señales procedentes del kernel sin
        que nadie las haya pedido explícitamente, por ejemplo cuando el proceso intenta dividir
        entre cero o accede a memoria fuera de su segmento.
      </P>

      <P>
        Cuando un proceso recibe una señal, puede proceder de tres formas distintas. Ignorarla.
        Invocar la rutina de tratamiento por defecto del kernel. O invocar una rutina propia
        escrita por el programador. La animación que viene a continuación recorre las tres
        formas paso a paso. Es la base mental que conviene tener clara antes de meter la mano al
        API de C.
      </P>

      <SignalsFlow />

      <H3>1. Ignorar la señal</H3>

      <P>
        El proceso destino puede ignorar la señal siempre y cuando tenga mayor prioridad que el
        proceso que la envía. En ese caso el proceso queda inmune a la misma. La señal llega al
        kernel, el kernel verifica los permisos y las reglas, y simplemente la descarta sin
        afectar el flujo de ejecución del destinatario. Hay dos excepciones absolutas a esta regla
        que conviene grabar en memoria. <strong>SIGKILL</strong> y <strong>SIGSTOP</strong> nunca
        se pueden ignorar. Son las herramientas de último recurso del kernel para forzar la
        terminación o la suspensión de un proceso descontrolado.
      </P>

      <H3>2. Invocar la rutina de tratamiento por defecto</H3>

      <P>
        Esta rutina es aportada por el kernel. Según el tipo de señal, la rutina por defecto va a
        realizar una acción específica. Por lo general la acción más común suele provocar la
        terminación del proceso mediante una llamada a <em>exit</em>. Algunas señales no solo
        provocan la terminación sino que además hacen que el kernel genere en el directorio actual
        del proceso un archivo llamado <strong>core</strong> que contiene un volcado de memoria
        del contexto del proceso en el instante exacto del fallo.
      </P>

      <P>
        El archivo core es muy útil para depurar programas. Lo puedes cargar en un debugger como
        gdb junto con el binario y reconstruir el stack de llamadas, el valor de los registros y
        el estado de la memoria justo antes de la caída. Es la herramienta forense por excelencia
        para entender por qué un programa murió en producción. SIGSEGV por violación de segmento,
        SIGABRT por abort explícito, SIGFPE por error aritmético y SIGBUS por error de bus son las
        señales típicas que generan core dump.
      </P>

      <H3>3. Invocar una rutina propia</H3>

      <P>
        Esta tercera vía es responsabilidad del programador. Tú escribes una función con la firma
        adecuada y la registras con la API del kernel para que se invoque cuando llegue una señal
        específica. A esa función se le llama <strong>signal handler</strong>. Cuando llega la
        señal, el kernel suspende temporalmente el flujo normal del proceso, salta al handler, lo
        ejecuta hasta que retorna, y entonces continúa el flujo donde se había quedado. Esto
        permite, por ejemplo, que SIGINT al hacer Ctrl C no mate inmediatamente al programa sino
        que dispare una rutina que guarde el estado, libere recursos y salga de forma ordenada.
      </P>

      <Callout tone="warn" title="Restricciones dentro de un handler">
        Lo que puedes hacer dentro de un signal handler está limitado por una lista de funciones
        consideradas async signal safe. Cosas tan inocentes como printf pueden causar corrupción
        si la señal llega justo cuando otro thread está dentro de printf. La regla práctica es
        mantener los handlers cortos y dejar el trabajo pesado para fuera, típicamente poniendo
        una bandera global volátil que el bucle principal del programa revisa cada cierto tiempo.
      </Callout>

      <Callout tone="success" title="Qué entendimos en esta página">
        Una señal es una interrupción de software entregada a un proceso. El kernel u otro proceso
        son los emisores. El destinatario tiene tres opciones de respuesta. Ignorarla si las
        reglas se lo permiten salvo SIGKILL y SIGSTOP que no se pueden ignorar nunca. Dejar que
        actúe la rutina por defecto del kernel que casi siempre termina el proceso y a veces
        genera un archivo core útil para depurar. O instalar un handler propio que el kernel
        invoca al llegar la señal y vuelve al flujo normal cuando termina. El identificador de
        cada señal es un entero positivo con nombre simbólico que empieza con SIG. SIGINT es Ctrl
        C, SIGSEGV es violación de segmento, SIGKILL es muerte forzada inevitable, SIGTERM es
        petición ordenada de salida. Las señales son el mecanismo IPC más antiguo de UNIX y la
        forma natural de comunicar eventos asíncronos entre procesos y kernel.
      </Callout>
    </>
  );
}
