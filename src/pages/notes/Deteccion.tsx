import { P, H2, H3, Callout } from '../../components/ui/Prose';

export default function Deteccion() {
  return (
    <>
      <P>
        En lugar de prevenir o evitar, otra estrategia es dejar que los interbloqueos
        ocurran y revisarlos a posteriori. La detección consiste en mirar el estado del
        sistema cada cierto tiempo y averiguar si hay procesos atrapados en una espera
        circular. Si encontramos uno, lo desarmamos. Es reactivo, no preventivo.
      </P>

      <H2>Qué busca la detección</H2>
      <P>
        El algoritmo de detección típicamente construye un grafo con los procesos y los
        recursos del sistema. Las aristas representan quién retiene qué y quién pide qué.
        Si en ese grafo aparece un ciclo cerrado, hay interbloqueo. Identificamos los
        procesos atrapados, los recursos involucrados, y pasamos a la recuperación.
      </P>

      <H2>Con qué frecuencia revisar</H2>
      <P>
        Aquí hay un compromiso interesante. Podemos correr la detección cada vez que un
        proceso pide un recurso. Eso encuentra el problema apenas se forma, pero gasta
        mucho tiempo de procesador en revisiones constantes. La otra opción es revisar cada
        cierto rato. Más barato pero el deadlock puede durar horas antes de descubrirse.
      </P>

      <Callout tone="info" title="Ventajas de revisar en cada petición">
        Cuando comprobamos en cada solicitud de recurso ganamos dos cosas. Detectamos el
        interbloqueo en el instante en que se forma, sin dejarlo crecer. Y el algoritmo
        resulta más simple porque solo analiza los cambios incrementales del estado, no
        todo el grafo desde cero. La contrapartida es el costo continuo de CPU.
      </Callout>

      <H2>Cuando se detecta, hay que actuar</H2>
      <P>
        Detectar es solo la mitad. Hay que recuperar el sistema. Existen varias formas, de
        la más brutal a la más cuidadosa.
      </P>

      <H3>Abandonar todos los bloqueados</H3>
      <P>
        La opción más común en sistemas operativos reales. Matar a todos los procesos
        involucrados en el ciclo. Drástico, pero garantiza que se libera todo y el sistema
        sigue avanzando. Se pierde el trabajo de esos procesos pero al menos los demás no
        sufren.
      </P>

      <H3>Retroceder a un punto de control</H3>
      <P>
        Si los procesos guardan estados intermedios cada cierto tiempo, podemos volver a
        uno de esos puntos y reintentar. El riesgo es que el mismo interbloqueo se forme de
        nuevo. La buena noticia es que la concurrencia es indeterminista, así que con
        diferentes velocidades de ejecución pocas veces se repite el problema exactamente
        igual.
      </P>

      <H3>Abandonar uno por uno</H3>
      <P>
        En lugar de matar a todos los procesos atrapados, se va matando uno cada vez y se
        verifica si el deadlock se rompió. La elección de qué proceso sacrificar sigue un
        criterio de mínimo coste. Es más quirúrgico pero también más lento porque hay que
        volver a correr la detección después de cada eliminación.
      </P>

      <H3>Apropiarse de recursos</H3>
      <P>
        Aquí no matamos al proceso pero le quitamos un recurso. Se lo damos a otro que lo
        necesite, y el primero retrocede hasta antes de haberlo tomado. Funciona si los
        recursos son fácilmente reasignables, como memoria. No funciona con dispositivos
        donde quitar a media operación dejaría las cosas inconsistentes.
      </P>

      <H2>Cómo elegir a quién sacrificar</H2>
      <P>
        Tanto al abandonar procesos uno por uno como al apropiarse de recursos hay que
        decidir a quién tocar primero. Algunos criterios habituales son escoger el proceso
        que menos tiempo de CPU ha consumido, el que ha producido menos resultados, el que
        más trabajo le queda por delante, el que tiene menos recursos asignados o el de
        menor prioridad. La idea de fondo siempre es la misma: minimizar lo que se pierde y
        liberar lo que más impacta para romper el ciclo.
      </P>

      <H2>Qué aprendimos en esta nota</H2>
      <P>
        La detección es la postura del bombero. No intentamos evitar que el incendio
        ocurra, lo que hacemos es tener alarmas que nos avisen cuando empieza y mangueras
        listas para apagarlo. El sistema deja que los procesos pidan recursos con
        libertad, sin imponerles reglas raras, y se reserva el derecho de revisar de vez
        en cuando si alguien quedó atrapado.
      </P>
      <P>
        Entendimos que el truco está en el ritmo de las revisiones. Revisar todo el tiempo
        es preciso pero caro, como tener un guardia parado vigilando una sola puerta. Revisar
        cada cierto rato es barato pero corremos el riesgo de que el incendio crezca antes
        de que lleguemos. La elección depende de qué tan grave sería el deadlock en cada
        sistema. En un kernel general, donde el problema es raro, podemos darnos el lujo
        de revisar de vez en cuando. En un sistema crítico, conviene revisar a cada paso.
      </P>
      <P>
        Aprendimos que detectar es solo la mitad del trabajo. Una vez encontrado el ciclo,
        hay que romperlo. Las opciones van de lo brutal a lo quirúrgico. Podemos matar a
        todos los procesos involucrados de un solo golpe, que es lo más común porque es
        rápido y predecible. Podemos hacerlos retroceder a un punto de control anterior y
        rezar para que la concurrencia caiga distinta la siguiente vez. Podemos eliminarlos
        uno por uno hasta que el deadlock desaparezca. O podemos quitarle un recurso a
        alguien sin matarlo y dárselo a otro. La elección depende del tipo de recurso y
        del costo de cada decisión. Lo importante es entender que en este enfoque siempre
        alguien paga el precio del rescate, y nuestra tarea es decidir quién pierde menos.
      </P>
    </>
  );
}
