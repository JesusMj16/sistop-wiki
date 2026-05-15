import { P, H2, H3, Callout, CircularWait } from '../../components/ui/Prose';

export default function Inanicion() {
  return (
    <>
      <P>
        Hasta ahora nos hemos preocupado de que los procesos se comuniquen y se sincronicen.
        Toca mirar el lado feo: qué pasa cuando varios procesos se quedan atascados esperando
        recursos que nunca van a llegar. Eso, con sus variantes, es el problema del
        interbloqueo y la inanición.
      </P>

      <H2>Interbloqueo, en una frase</H2>
      <P>
        Un interbloqueo es el bloqueo permanente de un conjunto de procesos que compiten por
        recursos. Cada uno tiene algo que el otro necesita y ninguno está dispuesto a soltarlo.
        El sistema avanza para todos los demás, pero ese grupo queda congelado para siempre.
      </P>

      <H2>Inanición, el primo silencioso</H2>
      <P>
        La inanición es distinta. Un proceso no está bloqueado, sigue en la cola listo para
        ejecutarse, pero el sistema nunca le toca el turno. Las políticas de planificación
        favorecen a otros y este se queda esperando un evento que en la práctica jamás llega.
        También se le conoce como aplazamiento indefinido o bloqueo indefinido.
      </P>

      <H2>Las cuatro condiciones de Coffman</H2>
      <P>
        Coffman propuso un análisis clásico: para que aparezca un interbloqueo tienen que
        cumplirse cuatro condiciones al mismo tiempo. Si falta una sola, el interbloqueo no
        puede formarse. Entender estas cuatro condiciones es la base para todas las
        estrategias que veremos en las siguientes páginas.
      </P>

      <H3>Exclusión mutua</H3>
      <P>
        El primer ingrediente. Un recurso solo lo puede usar un proceso a la vez. Sin
        exclusión mutua no habría competencia por recursos, así que esta condición está casi
        siempre presente.
      </P>

      <H3>Retención y espera</H3>
      <P>
        Un proceso ya tiene algunos recursos en la mano y, aun así, pide otros más. Mientras
        espera los nuevos no suelta los que ya tiene. Esto deja recursos retenidos sin
        poderse usar por nadie más.
      </P>

      <H3>No apropiación</H3>
      <P>
        Ningún proceso puede ser forzado a soltar un recurso que ya retiene. El sistema
        respeta la posesión: para liberar un recurso, el proceso que lo tiene debe terminar
        o renunciar voluntariamente.
      </P>

      <H3>Espera circular</H3>
      <P>
        Existe una cadena cerrada de procesos donde cada uno espera un recurso retenido por
        el siguiente. P1 espera algo que tiene P2, P2 espera algo que tiene P3, y así hasta
        cerrar el círculo de vuelta con P1. Si la cadena se cierra y se cumplen las tres
        condiciones anteriores, ya tenemos el interbloqueo formado.
      </P>

      <H2>Animación. Cómo se forma la espera circular</H2>
      <P>
        En la siguiente animación seguimos a dos procesos y dos recursos. Avanza paso a paso
        para ver cómo cada quien toma uno y luego pide el del otro hasta cerrar el ciclo. Al
        final mostramos cómo se rompe.
      </P>

      <CircularWait />

      <Callout tone="info" title="Necesario y suficiente">
        Las cuatro condiciones de Coffman juntas no solo describen la situación: son
        necesarias y suficientes para que exista interbloqueo. Eliminar cualquiera de las
        cuatro garantiza que el problema no aparezca. Esa idea es justo la que aprovechan
        las técnicas de prevención que veremos en la siguiente sección.
      </Callout>

      <H2>Qué aprendimos en esta nota</H2>
      <P>
        Imaginemos un cuello de botella en una puerta giratoria. Dos personas intentan
        pasar al mismo tiempo, cada una desde un lado, y ambas empujan en sentido
        contrario. Las dos están listas para avanzar, ninguna está dormida, pero la puerta
        no se mueve. Eso es un interbloqueo. Cada quien tiene algo que le bloquea al otro
        y nadie está dispuesto a soltar. El sistema sigue trabajando con todos los demás,
        pero ese par concreto queda congelado para siempre.
      </P>
      <P>
        Entendimos que la inanición es un problema distinto, aunque a primera vista se
        parezca. Aquí no hay un nudo bloqueado, simplemente uno de los procesos nunca llega
        al frente de la fila. Es como ese cliente que se forma en un supermercado donde la
        caja siempre da preferencia a los clientes preferentes: nunca está bloqueado, pero
        tampoco le toca el turno mientras sigan llegando otros con mayor prioridad. La
        inanición se cura con políticas justas. El interbloqueo necesita herramientas más
        potentes.
      </P>
      <P>
        Aprendimos las cuatro condiciones que tienen que coincidir para que el problema se
        forme: exclusión mutua, retención y espera, no apropiación y espera circular.
        Romper cualquiera de las cuatro deshace la trampa. Esa es la observación que abre
        la puerta a todas las estrategias siguientes. La prevención ataca alguna de las
        cuatro por diseño, la detección las deja estar pero limpia después, la predicción
        intenta no llegar nunca a una situación peligrosa. En el fondo, todo el capítulo
        gira alrededor de esas cuatro ideas que vimos aquí.
      </P>
    </>
  );
}
