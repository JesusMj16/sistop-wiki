import { P, H2, H3, Code, Callout, CodeExplain, Table } from '../../components/ui/Prose';

export default function Banquero() {
  return (
    <>
      <P>
        El algoritmo del banquero es la idea clásica para evitar el interbloqueo en lugar de
        prevenirlo a la brava. Lo propuso Dijkstra en 1965 y la metáfora es exactamente la
        que sugiere el nombre: un banco con un capital limitado que decide a quién le presta
        sin arriesgarse a quedarse sin dinero.
      </P>

      <H2>La metáfora del banco</H2>
      <P>
        El banco tiene un capital fijo. Llegan clientes a pedir préstamos. Cada cliente, al
        registrarse, debe declarar de antemano cuál es la necesidad máxima que podría llegar
        a pedir. El banco solo acepta clientes cuya necesidad máxima no supere el capital
        total. Mientras un cliente no rebase su necesidad declarada, puede pedir más o
        devolver lo que tenga prestado.
      </P>
      <P>
        Hasta aquí parece un préstamo normal. La novedad está en lo que el banco se permite
        hacer si recibe una petición arriesgada: tiene derecho a posponerla. No se la niega
        para siempre, solo le pide al cliente que espere un poco. Esa pausa es lo que salva
        al sistema de quedar atrapado.
      </P>

      <H2>Traducción a procesos</H2>
      <P>
        En lugar de un banco con dinero, tenemos un sistema con recursos. En lugar de
        clientes, procesos. Cada proceso declara su necesidad máxima de cada recurso. El
        sistema decide a quién darle más en cada momento, evaluando si la nueva asignación
        deja el estado en un punto del que todavía se puede salir bien.
      </P>

      <H3>Las variables que maneja el algoritmo</H3>
      <P>
        Por cada proceso el algoritmo lleva tres números. El préstamo actual, que es lo que
        ya tiene asignado. La necesidad máxima, que es lo que declaró al inicio. Y la
        demanda, que es la resta entre los dos anteriores y representa lo que todavía podría
        pedir. A nivel del sistema hay otra cantidad clave: el efectivo, que es lo que queda
        sin prestar.
      </P>

      <Code title="formulas.txt">{`necesidad[i] <= capital                     (válido para todo i)
0 <= prestamo[i] <= necesidad[i]            (en todo momento)
demanda[i] = necesidad[i] - prestamo[i]
efectivo = capital - suma de todos los prestamo[i]`}</Code>

      <H2>Estado seguro y estado inseguro</H2>
      <P>
        Un estado es seguro si existe al menos un orden en el cual todos los procesos pueden
        terminar. Es decir, hay manera de servir a los clientes uno por uno, de forma que
        cada uno reciba lo que le falta, complete su transacción, devuelva todo, y libere
        recursos para el siguiente. Si no existe ese orden, el estado es inseguro.
      </P>
      <P>
        Cuidado con la trampa mental. Un estado inseguro no significa que el interbloqueo ya
        haya ocurrido. Significa que podría ocurrir si las peticiones futuras caen mal. El
        banquero prefiere no entrar a esa zona de riesgo.
      </P>

      <H2>Ejemplo. Estado seguro</H2>
      <P>
        Sistema con 12 unidades de un recurso, tres procesos. La tabla muestra el estado.
      </P>

      <Table
        headers={['Proceso', 'Préstamo', 'Necesidad', 'Demanda']}
        rows={[
          ['P1', '1', '4', '3'],
          ['P2', '4', '6', '2'],
          ['P3', '5', '8', '3'],
          ['Efectivo', '2', '', ''],
        ]}
      />

      <P>
        Es un estado seguro. Con las 2 unidades de efectivo se le puede dar a P2 lo que le
        falta (necesita 2). P2 termina, devuelve sus 6 y el efectivo sube a 8. Luego P3 toma
        sus 3, termina y devuelve 8, dejando 16. P1 toma sus 3 y también termina. Existe al
        menos un orden en el que todos terminan, así que el sistema sabe que puede salir
        bien de aquí.
      </P>

      <H2>Ejemplo. Estado inseguro</H2>
      <P>
        Las mismas 12 unidades, otra distribución.
      </P>

      <Table
        headers={['Proceso', 'Préstamo', 'Necesidad', 'Demanda']}
        rows={[
          ['P1', '8', '10', '2'],
          ['P2', '2', '5', '3'],
          ['P3', '1', '3', '2'],
          ['Efectivo', '1', '', ''],
        ]}
      />

      <P>
        Aquí solo queda 1 unidad disponible. Pero ningún proceso puede completarse con
        apenas 1 unidad más, porque todos necesitan al menos 2 para terminar. Si cualquiera
        pide ahora ese único recurso, el sistema no puede garantizar que alguien llegue al
        final. Es un estado inseguro. Quizá no hay deadlock todavía, pero el banquero ya no
        controla el desenlace.
      </P>

      <H2>Transición de seguro a inseguro</H2>
      <P>
        Saber que un estado es seguro no nos da garantías para siempre. Cada petición nueva
        puede empeorar la situación. Partiendo del primer ejemplo seguro, supongamos que P3
        pide un recurso más.
      </P>

      <Table
        headers={['Proceso', 'Préstamo', 'Necesidad', 'Demanda']}
        rows={[
          ['P1', '1', '4', '3'],
          ['P2', '4', '6', '2'],
          ['P3', '6', '8', '2'],
          ['Efectivo', '1', '', ''],
        ]}
      />

      <P>
        Aceptamos la petición y el efectivo baja a 1. Ahora ningún proceso puede completarse
        con esa única unidad, porque todos necesitan al menos 2. El estado se volvió
        inseguro. El banquero, en lugar de aceptar a ciegas, debería haber pospuesto esa
        petición de P3.
      </P>

      <H2>La subrutina para verificar seguridad</H2>
      <P>
        El algoritmo se reduce a esto: intentamos simular que el sistema atiende a quien
        pueda servir con el efectivo actual, contamos como si ese proceso devolviera todo, y
        repetimos. Si al final logramos atender a todos, el estado es seguro.
      </P>

      <CodeExplain
        title="banquero.c"
        lines={[
          { code: 'int dinero;' },
          { code: 'boolean seguro, inseguro[1..N];' },
          { code: 'dinero = efectivo;', note: 'Empezamos con el efectivo real del sistema.' },
          { code: 'for (i = 1; i <= N; i++)' },
          { code: '    inseguro[i] = TRUE;', note: 'Marcamos a todos como pendientes de verificar.' },
          { code: 'for (i = 1; i <= N; i++)' },
          { code: '    if (inseguro[i] && demanda[i] <= dinero) {', note: 'Si hay efectivo suficiente para cubrir lo que falta a este proceso, lo damos por servido.' },
          { code: '        inseguro[i] = FALSE;' },
          { code: '        dinero = dinero + prestamo[i];', note: 'Simulamos que el proceso terminó y devolvió todo lo que tenía.' },
          { code: '    }' },
          { code: 'if (dinero == capital)' },
          { code: '    seguro = TRUE;', note: 'Si después de la simulación recuperamos el capital total, hay un orden en el que todos terminan.' },
          { code: 'else' },
          { code: '    seguro = FALSE;', note: 'Si no, el estado actual es inseguro.' },
        ]}
      />

      <Callout tone="warn" title="Limitaciones del banquero">
        Aunque elegante, el algoritmo asume condiciones que rara vez se cumplen en la
        práctica. Capital fijo, número de procesos constante, tiempos finitos garantizados,
        y necesidades máximas declaradas por adelantado. Por eso es más útil como modelo
        conceptual que como solución real en sistemas operativos modernos.
      </Callout>

      <H2>Qué aprendimos en esta nota</H2>
      <P>
        La metáfora del banquero es tan buena que vale la pena repetirla. Imaginemos un
        banco pequeño en un pueblo. Tiene un capital limitado y varios clientes habituales.
        Cada cliente le dijo al banco, al firmar su contrato, cuánto podría llegar a pedir
        en su peor momento. Mientras los clientes se mantengan dentro de esa cifra, el
        banco está obligado a atenderlos eventualmente. La pregunta es cuándo prestar y
        cuándo decir tranquilo, esperá un momento.
      </P>
      <P>
        Entendimos que la jugada inteligente del banquero es no aceptar préstamos que lo
        dejen sin manera de cumplir con los demás clientes. Antes de soltar el dinero hace
        un cálculo mental rápido: si presto esto, ¿puedo seguir atendiendo a todos los que
        falten en algún orden razonable? Si la respuesta es sí, presta. Si la respuesta es
        no, posterga la petición. No la rechaza para siempre, solo le pide al cliente que
        espere. Ese pequeño gesto es lo que salva al banco de quebrar.
      </P>
      <P>
        Aprendimos la diferencia entre un estado seguro y uno inseguro. Un estado seguro
        significa que existe al menos un orden en el que todos los clientes pueden
        completar su préstamo y devolver. Un estado inseguro no significa que el banco ya
        haya quebrado, solo significa que si las cosas salen mal, podría quebrar. Es como
        manejar muy cerca del límite de velocidad: aún no chocaste, pero perdiste el margen
        de error.
      </P>
      <P>
        Llevándolo a procesos, el banco es el sistema operativo, los clientes son los
        procesos, el dinero son los recursos y los préstamos son las asignaciones. El
        algoritmo nos enseñó la idea más profunda: para evitar el interbloqueo no hace
        falta prohibirlo, basta con no acercarse demasiado a la zona peligrosa. La
        contraparte es que necesitamos saber cuánto va a pedir cada proceso, y en la vida
        real eso casi nunca lo sabemos. Por eso el banquero vive más en los libros que en
        los kernels. Lo que vale la pena llevarse es la intuición: planificar pensando en
        si el sistema todavía tiene una salida posible.
      </P>
    </>
  );
}
