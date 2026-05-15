import { P, H2, Code, Callout, CodeExplain, MemoryLayout } from '../../components/ui/Prose';

export default function MemoriaIntro() {
  return (
    <>
      <P>
        Hasta aquí hablamos de procesos como si vivieran en un mundo con espacio infinito.
        Toca aterrizar: la memoria principal es limitada y todos los procesos quieren su
        pedazo. Repartir esa memoria con justicia, vigilar quién tiene qué y mover cosas al
        disco cuando hace falta, es el oficio del administrador de memoria del sistema
        operativo.
      </P>

      <H2>Qué hace el administrador de memoria</H2>
      <P>
        El sistema operativo trata la memoria principal como un recurso para repartir entre
        los procesos activos. Su tarea diaria es llevar un registro fino: qué partes de la
        memoria están ocupadas, cuáles están libres, a qué proceso pertenece cada zona, y
        cuándo conviene reciclar o intercambiar pedazos con el disco. La meta es tener en
        memoria a la mayor cantidad posible de procesos útiles al mismo tiempo, dando
        prioridad a los más importantes.
      </P>
      <P>
        Para lograrlo el sistema usa dos herramientas clásicas. La paginación divide la
        memoria en piezas de tamaño fijo y reparte páginas a cada proceso sin importar el
        orden. La segmentación, en cambio, entrega trozos de tamaño variable que
        corresponden a regiones lógicas como código, datos o pila. Y muchos sistemas usan
        las dos a la vez para combinar lo mejor de cada filosofía.
      </P>

      <H2>Animación. Paginación, segmentación y combinación</H2>
      <P>
        Comparemos las tres formas de repartir la memoria viéndolas lado a lado. Avanza
        paso a paso para entender cómo se ve la memoria física en cada caso y por qué cada
        técnica tiene sus ventajas.
      </P>

      <MemoryLayout />

      <H2>Tamaño de página en x86 y x86-64</H2>
      <P>
        En la mayoría de las arquitecturas x86 y x86-64, la unidad mínima de gestión es la
        página de 4KB, equivalente a 4096 bytes. Esa es la pieza que la unidad de
        traducción mapea entre la memoria virtual y la física. La estructura que guarda ese
        mapeo se llama entrada de la tabla de páginas, abreviada PTE.
      </P>
      <P>
        Linux también soporta páginas grandes, de 2MB e incluso 1GB, conocidas como
        HugePages. Sirven para reducir el costo del buffer de traducción anticipada, el
        famoso TLB, cuando un proceso usa mucha memoria contigua. Menos páginas significa
        menos entradas que el procesador tiene que recordar para traducir direcciones.
      </P>

      <Callout tone="info" title="Para ver el tamaño de página en tu sistema">
        Desde una terminal, el comando <em>getconf PAGESIZE</em> imprime el tamaño de
        página actual en bytes. En la mayoría de los Linux de escritorio devuelve 4096.
        Es la cifra que el kernel usa internamente como unidad mínima cuando reparte
        memoria.
      </Callout>

      <H2>Tamaño de página desde C</H2>
      <P>
        Si queremos consultar el tamaño de página dentro de un programa en C, la librería
        estándar nos da dos funciones. La primera es <em>sysconf</em>, que recibe un
        identificador y devuelve un valor del sistema. La segunda es <em>getpagesize</em>,
        que es directa y devuelve el tamaño en bytes.
      </P>

      <Code title="prototipos.h">{`#include <unistd.h>

long sysconf(int name);
int  getpagesize(void);`}</Code>

      <H2>Ejemplo. Programa que imprime el tamaño de página</H2>
      <P>
        Un programa pequeñísimo que pregunta al sistema cuánto mide una página y la imprime
        usando las dos funciones disponibles.
      </P>

      <CodeExplain
        title="pagesize.c"
        lines={[
          { code: '#include <stdlib.h>' },
          { code: '#include <stdio.h>' },
          { code: '#include <unistd.h>', note: 'Aquí viven sysconf y getpagesize.' },
          { code: 'int main()' },
          { code: '{' },
          { code: '    printf("Tamano de pagina: %d\\n",' },
          { code: '           (int) sysconf(_SC_PAGESIZE));', note: 'sysconf con la clave _SC_PAGESIZE devuelve la unidad mínima del sistema, normalmente 4096.' },
          { code: '    printf("Tamano de pagina: %d\\n",' },
          { code: '           (int) getpagesize());', note: 'getpagesize hace lo mismo pero en una sola llamada directa.' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
        ]}
      />

      <P>
        Compilar y ejecutar es directo:
      </P>

      <Code title="terminal">{`gcc pagesize.c -o pagesize
./pagesize`}</Code>

      <P>
        En la mayoría de máquinas de escritorio veremos dos veces el mismo número: 4096.
        Ese es el ladrillo con el que el kernel construye toda la memoria que tu programa
        cree estar viendo.
      </P>

      <H2>Qué aprendimos en esta nota</H2>
      <P>
        La mejor forma de entender la administración de memoria es pensar en un edificio de
        oficinas. El sistema operativo es el administrador del edificio, los procesos son
        las empresas que quieren rentar, y la memoria principal es el conjunto de pisos
        disponibles. El administrador lleva un libro de quién está en cada piso, decide a
        quién darle más espacio cuando lo pide, y manda al sótano los muebles que no se
        están usando para hacer lugar a quienes sí los necesitan.
      </P>
      <P>
        Entendimos que existen dos estilos de reparto. La paginación es como entregar
        oficinas idénticas, todas del mismo tamaño, sin importar que las empresas terminen
        repartidas en pisos no contiguos. La segmentación, en cambio, asigna espacios a la
        medida de lo que pide cada empresa: una sala grande para reuniones, un cuartito
        para archivo, una bodega aparte. Cada estilo tiene sus trampas. La paginación deja
        páginas medio llenas en su última pieza, lo que llamamos fragmentación interna. La
        segmentación deja huecos raros entre regiones, la famosa fragmentación externa.
        Por eso los sistemas modernos casi siempre combinan los dos.
      </P>
      <P>
        Aprendimos también que la unidad básica con la que el kernel piensa la memoria es
        la página, y que en la mayoría de las máquinas mide 4KB. Esa cifra no es un
        número mágico: viene de la arquitectura del procesador y de un compromiso entre
        precisión y costo. Páginas más pequeñas significan más entradas que el TLB tiene
        que recordar; páginas más grandes desperdician más espacio cuando un proceso solo
        necesita un trozo. Vimos cómo preguntar el tamaño desde la terminal con
        <em> getconf PAGESIZE</em> y desde C con <em>sysconf</em> o
        <em> getpagesize</em>. Esa cifra es la pieza básica con la que el sistema operativo
        arma todo el rompecabezas de memoria que cada proceso cree habitar solo, aunque en
        realidad esté compartiendo el edificio con muchos otros.
      </P>
    </>
  );
}
