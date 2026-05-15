import { P, H2, H3, Callout, LinearOrdering } from '../../components/ui/Prose';

export default function Prevencion() {
  return (
    <>
      <P>
        La forma más usada para tratar el interbloqueo es directamente impedir que se forme.
        Si para producirlo hacen falta las cuatro condiciones de Coffman, basta con romper
        una sola de ellas en el diseño del sistema. Esa es la idea de la prevención.
      </P>

      <H2>Estrategias de Havender</H2>
      <P>
        Havender propuso varias políticas para atacar las condiciones de retención y espera
        y la espera circular. Cada una sacrifica algo en flexibilidad a cambio de garantizar
        que el interbloqueo no aparezca.
      </P>

      <H3>Pedir todos los recursos de golpe</H3>
      <P>
        Antes de empezar a ejecutarse, el proceso debe declarar todos los recursos que va a
        necesitar. Si el sistema no se los puede dar todos juntos, el proceso simplemente
        no arranca. Mientras no tenga el paquete completo, no avanza ni un paso. Eso elimina
        la condición de retención y espera, porque el proceso nunca tendrá unos recursos
        mientras pide otros.
      </P>

      <H3>Soltar todo si te niegan algo</H3>
      <P>
        Otra variante. Si un proceso ya tiene recursos asignados y pide más, y el sistema le
        niega los nuevos, entonces se le obliga a liberar todo lo que tenía. Después podrá
        volver a pedir el paquete completo, junto con los adicionales. Es una forma de
        evitar que un proceso se siente sobre recursos esperando indefinidamente.
      </P>

      <H3>Ordenamiento lineal de los recursos</H3>
      <P>
        Esta es la idea más elegante. Numeramos todos los tipos de recursos del sistema.
        Cada proceso solo puede pedir recursos cuyo número sea mayor que el del último
        recurso que ya retiene. Es decir, las peticiones siempre van hacia arriba en el
        orden. Si todas las flechas suben, jamás puede cerrarse un ciclo, así que la
        condición de espera circular desaparece.
      </P>

      <H2>Animación. Ordenamiento lineal</H2>
      <P>
        Visualicemos el ordenamiento lineal con un proceso de ejemplo. P1 ya tiene varios
        recursos. Vemos qué solicitud el sistema acepta y cuál rechaza, dependiendo de hacia
        dónde apunte la flecha.
      </P>

      <LinearOrdering />

      <Callout tone="info" title="El precio de la prevención">
        Estas técnicas son simples y robustas, pero tienen un costo. Pedir todo por
        adelantado puede dejar recursos ociosos esperando a otros. Soltar todo cuando te
        niegan algo desperdicia trabajo. El ordenamiento lineal obliga a los programadores a
        respetar un orden global que a veces no es natural. La prevención garantiza que no
        haya interbloqueo, pero rara vez es la solución más eficiente.
      </Callout>

      <H2>Qué aprendimos en esta nota</H2>
      <P>
        La prevención es como diseñar un edificio donde es físicamente imposible que dos
        personas queden atrapadas en la misma puerta giratoria. En lugar de poner letreros
        de buena conducta, cambiamos el edificio para que el problema no pueda existir. Ese
        es el espíritu de la estrategia. Rompemos una de las condiciones de Coffman por
        diseño y nos olvidamos del tema.
      </P>
      <P>
        Entendimos que se puede atacar el problema desde varios ángulos. Pedir todos los
        recursos de golpe es como ir al supermercado con una lista cerrada y no entrar
        hasta que todo esté disponible: si falta una sola cosa, mejor no empezamos. Soltar
        todo cuando nos niegan algo es como salir del supermercado, dejar el carrito en la
        entrada y volver a hacer la lista desde cero: parece desperdicio, pero garantiza
        que nadie quede a medias con productos retenidos.
      </P>
      <P>
        La idea más elegante que vimos fue el ordenamiento lineal. Numeramos los recursos
        y exigimos que las peticiones siempre vayan hacia arriba. Es como decirle a todo el
        mundo que solo puede subir escaleras, nunca bajar dentro del mismo viaje. Si todas
        las flechas suben, nunca pueden cerrar un círculo. Esa simple regla geométrica
        elimina la espera circular de raíz. Aprendimos que el costo de la prevención es la
        flexibilidad: el sistema queda más rígido, a veces deja recursos ociosos y obliga
        al programador a pensar en órdenes que no siempre son naturales. Pero a cambio
        obtenemos la tranquilidad absoluta de que el interbloqueo no puede aparecer.
      </P>
    </>
  );
}
