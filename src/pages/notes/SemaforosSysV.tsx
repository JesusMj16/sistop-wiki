import { P, H2, Callout } from '../../components/ui/Prose';

export default function SemaforosSysV() {
  return (
    <>
      <P>
        Los <strong>semáforos de System V</strong> son una de las primeras primitivas de sincronización
        que UNIX introdujo para coordinar procesos sin parentesco. A diferencia de los semáforos POSIX,
        estos viven en el kernel como objetos identificados por una llave, se manipulan en
        <em> conjuntos</em> y persisten incluso cuando los procesos que los crearon terminan.
      </P>

      <H2>Contenido pendiente</H2>
      <P>
        Aquí desarrollaremos las llamadas <em>semget()</em>, <em>semop()</em> y <em>semctl()</em>, el
        uso de la estructura <em>sembuf</em>, la diferencia entre operaciones P y V, y el patrón
        canónico para proteger una sección crítica compartida entre varios procesos.
      </P>

      <Callout tone="info" title="Por desarrollar">
        Incluiremos un ejemplo completo de productor/consumidor sincronizado con semáforos System V,
        además de comparativa con la alternativa POSIX para que se entienda cuándo conviene cada API.
      </Callout>
    </>
  );
}
