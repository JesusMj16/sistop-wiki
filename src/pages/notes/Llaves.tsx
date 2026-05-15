import { P, H2, Callout } from '../../components/ui/Prose';

export default function Llaves() {
  return (
    <>
      <P>
        En los mecanismos IPC heredados de <strong>System V</strong> (colas de mensajes, semáforos y memoria
        compartida), cada recurso necesita un identificador que dos o más procesos puedan acordar de antemano
        para referirse al mismo objeto del kernel. Esa pieza de identificación es lo que se conoce como
        una <em>llave</em> (<em>key</em>).
      </P>

      <H2>Contenido pendiente</H2>
      <P>
        Esta nota cubrirá el uso de la función <em>ftok()</em>, la noción de llave privada
        (<em>IPC_PRIVATE</em>), las reglas de unicidad y los errores típicos al elegir un <em>pathname</em>
        que no es estable entre ejecuciones.
      </P>

      <Callout tone="info" title="Por desarrollar">
        Aquí entrarán los prototipos, ejemplos de <em>ftok()</em>, recomendaciones de diseño y un par de
        ejercicios prácticos para que el lector compruebe que dos procesos sin relación de parentesco
        consiguen la misma llave a partir del mismo archivo y proyecto.
      </Callout>
    </>
  );
}
