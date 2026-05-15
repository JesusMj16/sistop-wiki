import { P, H2, H3, Callout } from '../../components/ui/Prose';

export default function Prediccion() {
  return (
    <>
      <P>
        La predicción del interbloqueo es la estrategia más cautelosa de todas. La idea es
        mirar al futuro: antes de aceptar cualquier acción, calculamos si esa acción podría
        llevar al sistema a un escenario donde el interbloqueo sea posible. Si la respuesta
        es sí, simplemente no la permitimos.
      </P>

      <H2>De qué información depende</H2>
      <P>
        Para predecir hay que conocer cosas sobre el futuro de los procesos. En particular,
        las peticiones máximas de recursos que cada uno podría llegar a hacer. Sin ese dato
        no se puede razonar sobre lo que viene. Por eso esta técnica es difícil de aplicar
        en sistemas generales: muchas veces los programas no saben de antemano qué van a
        necesitar.
      </P>

      <H2>Dos enfoques principales</H2>
      <P>
        La predicción se materializa en dos decisiones distintas según el momento en el que
        miremos hacia el futuro.
      </P>

      <H3>No arrancar procesos peligrosos</H3>
      <P>
        Antes de poner un proceso en marcha revisamos qué recursos podría necesitar. Si esa
        demanda combinada con la de los procesos que ya corren puede acabar en
        interbloqueo, no lo dejamos empezar. El proceso espera afuera del sistema, no se
        admite hasta que sea seguro.
      </P>

      <H3>No conceder peticiones que cierren un ciclo</H3>
      <P>
        Una vez que el proceso ya está corriendo, cada vez que pida más recursos repetimos
        el análisis. Si darle lo que pide podría conducir al deadlock, le pedimos esperar.
        El proceso no muere ni pierde lo que ya tenía, solo se posterga la asignación hasta
        que sea seguro.
      </P>

      <Callout tone="info" title="El parentesco con el banquero">
        Esta filosofía es exactamente la que aplica el algoritmo del banquero. La diferencia
        es que aquí la describimos en abstracto, mientras que el banquero ofrece un método
        concreto para evaluar si un estado es seguro antes de aceptar una petición. La
        predicción es el marco; el banquero, la herramienta más conocida dentro de ese
        marco.
      </Callout>

      <H2>Prevención, evitación, detección, predicción</H2>
      <P>
        Vale la pena recapitular las cuatro familias de estrategias en una sola idea. La
        prevención rompe alguna condición de Coffman por diseño, garantizando que el
        interbloqueo nunca se forme. La predicción, también conocida como evitación, deja
        las condiciones intactas pero rechaza peticiones que llevarían a un estado
        peligroso. La detección permite que ocurra y limpia después. Y siempre queda la
        opción del avestruz: ignorar el problema y esperar que rara vez aparezca, que es lo
        que hacen muchos sistemas reales cuando el costo de las otras estrategias es alto.
      </P>

      <H2>Qué aprendimos en esta nota</H2>
      <P>
        La predicción es la actitud del piloto cuidadoso. Antes de cada giro mira al
        camino que viene y se pregunta si todavía tendrá margen para frenar si las cosas
        salen mal. No se trata de prohibir el camino, se trata de no entrar en una zona
        donde después no haya salida. Esa es la diferencia clave con la prevención: aquí
        no rompemos ninguna condición de Coffman, dejamos todas en pie y simplemente
        rechazamos cualquier movimiento que nos acerque demasiado al precipicio.
      </P>
      <P>
        Entendimos que para predecir necesitamos algo difícil de obtener: información
        sobre el futuro. Saber cuánto va a pedir un proceso a lo largo de su vida. Sin esa
        información el análisis se vuelve imposible. Por eso, en sistemas operativos
        generales donde los programas no declaran sus necesidades por adelantado, la
        predicción rara vez se aplica tal cual. Donde sí funciona es en entornos
        controlados, como sistemas de tiempo real o aplicaciones específicas con cargas
        de trabajo conocidas.
      </P>
      <P>
        Aprendimos que la predicción se manifiesta en dos decisiones. Antes de admitir un
        proceso nuevo nos preguntamos si su combinación con los demás podría llevar al
        deadlock. Y antes de conceder una nueva petición de alguien que ya está corriendo
        repetimos el cálculo. En ambos casos, si la respuesta es preocupante, postergamos.
        Cerrando el capítulo, también entendimos las cuatro grandes familias de
        estrategias y por qué cada una existe. Prevención cambia el diseño. Predicción
        evita zonas peligrosas. Detección limpia después. Y siempre queda la opción de
        ignorar el problema cuando es raro y el costo de evitarlo no se justifica. Saber
        cuándo aplicar cuál es el verdadero arte de diseñar sistemas que conviven con la
        concurrencia sin quedar paralizados.
      </P>
    </>
  );
}
