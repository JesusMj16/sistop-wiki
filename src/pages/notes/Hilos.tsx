import { P, H2, H3, Code, Callout, CodeExplain, ThreadsFlow } from '../../components/ui/Prose';

export default function Hilos() {
  return (
    <>
      <P>
        Hasta aquí hemos hablado mucho de procesos: cada uno con su memoria, sus archivos,
        su propia existencia. Pero a veces no queremos tantos procesos enteros corriendo en
        paralelo; queremos algo más ligero. Algo que viva dentro del mismo programa pero
        haciendo varias cosas a la vez. Eso es un hilo.
      </P>

      <H2>Qué es un hilo</H2>
      <P>
        Un hilo es una unidad de ejecución que vive dentro de un proceso. Si un proceso es
        una casa, los hilos son las personas que viven adentro: comparten la cocina, los
        muebles y la dirección, pero cada uno hace su propia tarea. Comparten memoria,
        archivos abiertos y casi todo lo demás del proceso. Lo único realmente propio de
        cada hilo es su contador de programa, su pila de ejecución y sus registros.
      </P>
      <P>
        Esto cambia el tono respecto a los procesos. Crear un proceso con fork es como
        construir una casa nueva: lento y caro. Crear un hilo es como llamar a un compañero
        para que entre a la casa existente: rápido y barato. Por eso los hilos son la opción
        natural cuando queremos hacer varias cosas al mismo tiempo dentro del mismo programa.
      </P>

      <H2>Cuándo conviene usar hilos</H2>
      <P>
        Los hilos brillan cuando necesitamos varias tareas que cooperan y comparten datos.
        Por ejemplo, una aplicación interactiva que mientras dibuja la interfaz también
        descarga algo de la red; un servidor que atiende muchas peticiones al mismo tiempo;
        un programa que aprovecha varios núcleos del procesador para acelerar un cálculo. En
        todos esos casos, los hilos resultan más cómodos que los procesos porque no
        necesitamos mecanismos costosos para que se comuniquen entre ellos.
      </P>

      <H2>POSIX y la librería pthreads</H2>
      <P>
        En C, los hilos se manejan con una librería llamada pthreads, que es parte del
        estándar POSIX. En Linux moderno, cada hilo de usuario corresponde a una entidad
        real dentro del kernel: el sistema lo planifica casi igual que a un proceso. La
        diferencia clave es que todos los hilos de un mismo proceso comparten memoria.
      </P>
      <P>
        Para compilar un programa que use hilos hay que añadir la bandera <em>-lpthread</em>:
      </P>

      <Code title="terminal">{`gcc hilos.c -o hilos -lpthread`}</Code>

      <H3>Funciones más usadas</H3>
      <P>
        La librería tiene muchas funciones, pero en la práctica solemos volver siempre a
        unas pocas. Estas son las que veremos en esta página.
      </P>

      <Code title="pthread.h">{`#include <pthread.h>

int pthread_create(pthread_t *thread,
                   const pthread_attr_t *attr,
                   void *(*start_routine)(void *),
                   void *arg);

int pthread_join(pthread_t thread, void **value_ptr);

int pthread_exit(void *value_ptr);

pthread_t pthread_self(void);

int pthread_attr_init(pthread_attr_t *attr);
int pthread_attr_destroy(pthread_attr_t *attr);`}</Code>

      <H2>Crear un hilo</H2>
      <P>
        La función <em>pthread_create</em> es la que arranca un hilo nuevo. Recibe cuatro
        cosas: dónde guardar el identificador del hilo, qué atributos darle, qué función
        debe ejecutar y qué argumento pasarle a esa función. Si no nos interesa configurar
        nada especial podemos poner NULL en los atributos y se usarán los valores por
        defecto.
      </P>
      <P>
        Cuando la función llamada por el hilo termina, automáticamente se invoca
        <em> pthread_exit</em>. No hay que llamarla a mano si simplemente hacemos return
        al final.
      </P>

      <Callout tone="info" title="Cómo termina un hilo">
        Un hilo puede terminar de varias formas. Llamando explícitamente a
        <em> pthread_exit</em> con un valor de retorno. Haciendo return al final de su
        función, que es equivalente. Siendo cancelado desde otro hilo con
        <em> pthread_cancel</em>. O simplemente porque el hilo principal hizo return desde
        main, lo cual mata a todos los hilos del proceso de golpe.
      </Callout>

      <H2>Esperar a que termine un hilo</H2>
      <P>
        Igual que el padre espera al hijo con <em>wait</em>, un hilo puede esperar a otro
        con <em>pthread_join</em>. La función bloquea al que llama hasta que el hilo destino
        termine, y nos entrega el valor que ese hilo dejó al salir. Es la forma estándar de
        sincronizar trabajo entre hilos: lanzo un cálculo en paralelo, sigo con lo mío, y
        cuando necesito el resultado hago join para recogerlo.
      </P>

      <H2>Animación. Cómo nacen, trabajan y se recogen los hilos</H2>
      <P>
        Antes de ver el código, juguemos con la idea visual. La siguiente animación
        muestra a main creando varios hilos, cómo todos comparten la misma memoria, qué
        pasa cuando main se bloquea con <em>pthread_join</em> y cómo el sistema queda
        limpio al final. Avanza paso a paso para ver el ciclo completo.
      </P>

      <ThreadsFlow />

      <H2>Ejemplo. Un hilo que calcula un factorial</H2>
      <P>
        Este programa crea un solo hilo y le pide que calcule el factorial de un número
        recibido por línea de comandos. El hilo principal espera al hilo trabajador con
        <em> pthread_join</em> y luego imprime el resultado. Es el patrón más sencillo
        posible para entender el ciclo crear, ejecutar, esperar.
      </P>

      <CodeExplain
        title="hilos.c"
        lines={[
          { code: '#include <pthread.h>' },
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: 'long prod = 1;', note: 'Variable global compartida por todos los hilos del proceso. Aquí dejaremos el resultado.' },
          { code: 'void *factorial(void *valor);' },
          { code: 'int main(int argc, char *argv[]) {' },
          { code: '    pthread_t tid;', note: 'Aquí guardaremos el identificador del hilo cuando lo creemos.' },
          { code: '    pthread_attr_t attr;' },
          { code: '    if (argc != 2) {' },
          { code: '        fprintf(stderr, "Uso: ./hilos <entero>\\n");' },
          { code: '        return EXIT_FAILURE;' },
          { code: '    }' },
          { code: '    pthread_attr_init(&attr);', note: 'Inicializamos los atributos con los valores por defecto. Podríamos pasar NULL en su lugar.' },
          { code: '    pthread_create(&tid, &attr, factorial, argv[1]);', note: 'Arrancamos el hilo. Ejecutará la función factorial con argv[1] como argumento.' },
          { code: '    pthread_join(tid, NULL);', note: 'Esperamos a que el hilo termine antes de seguir. Es el equivalente a wait pero para hilos.' },
          { code: '    printf("Factorial: %ld\\n", prod);' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
          { code: 'void *factorial(void *valor) {' },
          { code: '    int i = 1;' },
          { code: '    while (i <= atol(valor)) prod *= (i++);', note: 'Como prod es global, ambos hilos la ven. Es el mismo dato, sin copias.' },
          { code: '    pthread_exit(0);', note: 'Salida limpia del hilo. Equivalente a hacer return aquí.' },
          { code: '}' },
        ]}
      />

      <H2>Ejemplo. Varios hilos a la vez</H2>
      <P>
        Cuando queremos lanzar muchas tareas en paralelo, el patrón cambia un poco. Cada
        hilo necesita sus propios datos para que no se pisen entre ellos. Una forma cómoda
        de lograrlo es crear una estructura por hilo, con su id y los datos que necesita,
        y pasarle a cada uno un puntero a su propia estructura.
      </P>

      <CodeExplain
        title="chilos.c"
        lines={[
          { code: '#include <pthread.h>' },
          { code: '#include <stdio.h>' },
          { code: '#include <stdlib.h>' },
          { code: 'typedef struct dhilos {', note: 'Estructura privada por hilo. Aquí evitamos que se pisen las variables.' },
          { code: '    int id;' },
          { code: '    long prod;' },
          { code: '} DHILOS;' },
          { code: 'DHILOS pm_hilos[10];', note: 'Un arreglo: cada hilo escribirá en su propio espacio.' },
          { code: 'void *factorial(void *valor);' },
          { code: 'int main(int argc, char *argv[]) {' },
          { code: '    pthread_t tid[argc - 1];', note: 'Arreglo de identificadores, uno por hilo creado.' },
          { code: '    pthread_attr_t attr;' },
          { code: '    int i;' },
          { code: '    if (argc < 2) {' },
          { code: '        perror("Uso: ./chilos <entero1> <entero2> ...");' },
          { code: '        exit(EXIT_FAILURE);' },
          { code: '    }' },
          { code: '    for (i = 0; i < argc - 1; i++) {', note: 'Por cada argumento, un hilo nuevo.' },
          { code: '        pthread_attr_init(&attr);' },
          { code: '        pm_hilos[i].id = i + 1;' },
          { code: '        pm_hilos[i].prod = atol(argv[i + 1]);' },
          { code: '        pthread_create(&tid[i], &attr,' },
          { code: '                       factorial, &pm_hilos[i]);', note: 'Le pasamos a cada hilo el puntero a su propia estructura.' },
          { code: '    }' },
          { code: '    for (i = 0; i < argc - 1; i++)' },
          { code: '        pthread_join(tid[i], NULL);', note: 'Esperamos a todos antes de imprimir. Si imprimiéramos antes, veríamos resultados a medias.' },
          { code: '    for (i = 0; i < argc - 1; i++)' },
          { code: '        printf("Factorial de: %s = %ld\\n",' },
          { code: '               argv[i + 1], pm_hilos[i].prod);' },
          { code: '    return EXIT_SUCCESS;' },
          { code: '}' },
          { code: 'void *factorial(void *valor) {' },
          { code: '    int i = 1, prod = 1;' },
          { code: '    DHILOS *datos = (DHILOS *) valor;', note: 'Recuperamos el puntero como nuestro tipo real para acceder a los campos.' },
          { code: '    while (i <= datos->prod) prod *= (i++);' },
          { code: '    datos->prod = prod;', note: 'Escribimos el resultado en la estructura propia del hilo. Sin colisiones.' },
          { code: '    pthread_exit(&(datos->prod));' },
          { code: '}' },
        ]}
      />

      <H2>Diferencias prácticas con los procesos</H2>
      <P>
        Después de tantos ejemplos vale la pena resumir mentalmente la comparación. Los
        procesos se crean con fork y cada uno tiene su propia memoria, sus propios archivos
        abiertos, su propia identidad. Para que se comuniquen necesitamos mecanismos extra
        como pipes, sockets o memoria compartida. Los hilos se crean con
        <em> pthread_create</em>, comparten todo lo del proceso y se comunican simplemente
        leyendo y escribiendo las mismas variables.
      </P>
      <P>
        Eso es muy potente, pero también es la fuente de los problemas clásicos de
        concurrencia. Si dos hilos escriben al mismo tiempo en la misma variable sin ningún
        cuidado, el resultado puede ser incorrecto o impredecible. Por eso pthreads incluye
        también herramientas de coordinación, como los mutex y las variables de condición,
        que veremos en secciones posteriores.
      </P>

      <H2>Qué aprendimos en esta nota</H2>
      <P>
        La mejor forma de quedarnos con la idea es volver a la analogía de la casa. Un
        proceso es una casa entera con su propia cocina, sus propios cuartos y sus propias
        cosas. Los hilos son las personas que viven dentro de esa casa. Comparten el
        refrigerador, los muebles y el WiFi, así que pasarse información es tan fácil como
        dejar un papelito en la mesa. Cada hilo tiene lo suyo nada más en lo personal: su
        cuaderno de notas (el stack), el lápiz con el que está escribiendo (los registros)
        y la línea exacta en la que va leyendo (el contador de programa).
      </P>
      <P>
        Entendimos que esta cercanía es a la vez la mayor ventaja y la mayor trampa de los
        hilos. La ventaja es que comunicarse cuesta cero porque todos miran el mismo refri.
        La trampa es que si dos personas abren el refri al mismo tiempo y mueven la misma
        botella sin avisarse, una de las dos termina con la mano vacía o derramando algo.
        En programación a eso le llamamos condición de carrera, y es lo que motiva las
        herramientas de sincronización que veremos después, como los mutex y las variables
        de condición.
      </P>
      <P>
        Aprendimos los pasos del ciclo de vida. Con <em>pthread_create</em> arrancamos un
        hilo nuevo y le decimos qué función debe ejecutar. Mientras corre, hace lo suyo en
        paralelo con el resto. Con <em>pthread_exit</em> termina, o simplemente regresa de
        la función, que es lo mismo. Y con <em>pthread_join</em> el hilo principal espera a
        los trabajadores y recoge sus resultados. Es exactamente el mismo patrón mental que
        ya teníamos con <em>fork</em> y <em>wait</em>, solo que dentro de un mismo proceso
        y muchísimo más ligero. La regla práctica que nos llevamos es clara: por cada hilo
        que creamos, en algún lado debe existir un join que lo recoja, y por cada dato
        compartido entre hilos debe haber un mecanismo de coordinación que evite sorpresas.
      </P>
    </>
  );
}
