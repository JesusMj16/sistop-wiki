import type { Course } from '../types/course';

export const COURSE: Course = {
  title: 'Sistemas Operativos',
  subtitle: 'Una guia de Estudio',
  author: 'Mtro. Gabriel Geronimo Castillo',
  semester: '602-B',
  sections: [
    {
      id: 's1',
      number: '01',
      title: 'Introducción',
      summary: 'El conjunto de programas para la administración de los recursos de un dispositivo de computo',
      duration: '≈ 25 min',
      notes: [
        {
          id: 'n1-1',
          title: 'Introducción a los Sistemas Operativos',
          kind: 'lectura',
          body: [
            { type: 'p', text: 'El sistema Operativo es la parte fundamental de todo dispositivo de computo, ya que es una parte elemental para que el hardware tenga esa comunicacion con el usuario' },
            
            { type: 'p', text: 'Una definicion de el sistema es la siguiente, el sistema es aquel que nos ayuda a administrar los recursos de un dispositivo, como el procesador, almacenamiento, dsipostivos de entrada y salida y este nos proporciona la interfaz para crear esa interacción con el usuario' },
            { type: 'callout', tone: 'idea', title: 'Resumen clave', text: 'Control del hardware e interacción con el usuario' },
            { type: 'p', text: 'Los procesos son entidades en ejecucion, el sistema se encargara de resolver y evitar problemas entre ellos'},
            { type: 'title', text:'Clasificación de los Sistemas Operativos'},
            { type: 'p', text: 'Los Sistemas Operativos han llegado a ser clasificacion de acuerdo con el ambito de aplicación que tengan y la arquitectura en la que operan'},
            { type: 'title', text:'Sistemas por lotes', level:3},
            { type: 'p', text: 'Entendamos el sistema por lotes con una analogia, imaginemos un restaurante donde llegan clientes de manera concurrente. La secuencia seria: llega un cliente, se cocina su platillo y despues se es servido, y  esperamos al siguiente cliente con el mismo proceso. Pero aqui surge el problema, nosotros necesitamos esperar al siguiente cliente, pero en ese momento  no se esta haciendo nada por lo que decimos que el procesador desperdicia tiempo.'},
            { type: 'p', text: 'Aquí es donde entra nuestro sistema por lotes, que en vez de atender uno por uno, juntas pedidos o tareas similares y las realizas de golpe. Permitiendo reducir tiempos muertos en comparacion con una secuencia en serie.'},
            { type: 'title', text:'Sistemas Operativos de tiempo real', level:3},
            { type: 'p', text: 'La idea central es que a un sistema de tiempo real, no solo importa que la respuesta sea correcta, sino que llegue exactamente cuando debe llegar. Un resultado tarde es un resultado inutil o peligroso'},
            { type: 'p', text: 'Imaginemos el airbag de un coche, cuando chocas el sensor detecta el impacto y el airbag debe inflarse en menos de 30 ms. Si el sistema operativos que controla esto se distrae y responde en 200ms ya no sevira de nada. A esto le llamamos tiempo real. Donde el sistema siempre tardara lo mismo en responder sin sorpresas de que tarde más o menos.'},
            { type: 'title', text:'Sistemas Operativos multitarea', level:3},
            { type: 'p', text: 'Estos sistemas se caracterizan principalmente por la capacidad de ejecución concurrente de dos o más tareas activas, permitiendo que la CPU (Unidad Central de Procesamiento) siempre tenga algo que realizar o ejecutar, dandole una mayor utilidad al procesador'},
            { type: 'p', text: 'Su principio fundamental es mantener varias tareas en la memoria principal y alternar la forma en que se ejecutan haciendo uso de algunos mecanismo que ayuden a planificar la alternancia y el contexto. '},
            { type: 'title', text:'Sistemas Operativos distribuidos', level:3},
            { type: 'p', text: 'Los sistemas operativos distribuidos permiten distribuir trabajos, tareas o procesos entre un conjunto de procesadores. Estos pueden estar en un mismo equipo o fisicamente separados en multiples sistemas interconectados, pero el usuario percibe todo como una sola entidad de cómputo, es decir, la distribución es transparente.'},
            { type: 'p', text: 'Pensemos en una cocina industrial gigante con muchos chefs trabajando al mismo tiempo. El cliente solo pide su platillo y lo recibe, sin saber si lo cocinó un chef o si la tarea se repartió entre varios. Asi funciona un sistema distribuido, varios procesadores cooperan, pero el usuario solo ve un resultado final.'},
            { type: 'p', text: 'Existen dos esquemas básicos de organización: a) Sistemas fuertemente acoplados, donde los procesadores comparten memoria principal y un reloj global, por lo que los tiempos de acceso son similares para todos. b) Sistemas débilmente acoplados, donde cada procesador tiene su propia memoria local y se comunica con los demás mediante mecanismos de interconexión.'},
            { type: 'callout', tone: 'idea', title: 'Caracteristica clave', text: 'Alta confiabilidad: si un componente falla, otro asume sus funciones sin afectar el servicio.'},
            { type: 'p', text: 'Ejemplos representativos: Sprite, Solaris-MC, Mach, Chorus, Spring, Amoeba y Taos.'},
            { type: 'title', text:'Sistemas Operativos de red', level:3},
            { type: 'p', text: 'Los sistemas operativos de red mantienen interconectadas dos o más computadoras a través de un medio alámbrico o inalámbrico, con el objetivo de intercambiar información y compartir recursos. A diferencia de los distribuidos, aqui cada computadora conserva su propia autonomía y la red solo se usa como mecanismo para compartir archivos, impresoras, servicios y aplicaciones.'},
            { type: 'p', text: 'Imaginemos un edificio de departamentos donde cada inquilino tiene su propia cocina, pero todos comparten la lavanderia del sótano. Cada uno vive de manera independiente (autonomia), pero usan recursos comunes cuando los necesitan. Asi funciona un sistema operativo de red.'},
            { type: 'p', text: 'Ejemplos representativos: Windows Server para administración centralizada en empresas; UNIX y GNU/Linux configurados como servidores con NFS, Samba y FTP; Novell NetWare, ampliamente usado en décadas pasadas; y plataformas modernas basadas en GNU/Linux como servidores web, de archivos y de bases de datos.'},
            { type: 'title', text:'Sistemas Operativos paralelos', level:3},
            { type: 'p', text: 'Los sistemas operativos paralelos están diseñados para aprovechar arquitecturas con multiples procesadores o multiples núcleos, permitiendo que dos o más procesos o hilos se ejecuten simultáneamente. Su objetivo es incrementar el rendimiento y la capacidad de procesamiento, sobre todo cuando varios procesos requieren acceso a los mismos recursos.'},
            { type: 'p', text: 'Pensemos en una mudanza, si solo una persona carga las cajas, tardara horas. Si cuatro personas cargan al mismo tiempo, terminan en una fracción del tiempo. Eso es paralelismo real. Pero si dos intentan agarrar la misma caja chocan, por eso se necesitan mecanismos de sincronización y control de acceso a recursos compartidos.'},
            { type: 'p', text: 'Por otra parte, en sistemas como UNIX existe la posibilidad de ejecutar programas en segundo plano sin interaccion directa con el usuario. El sistema devuelve el control al usuario inmediatamente después de crear el proceso, permitiendo concurrencia y dando apariencia de paralelismo aun en sistemas con un solo procesador.'},
            { type: 'callout', tone: 'idea', title: 'Diferencia importante', text: 'Paralelismo real = ejecución simultánea en varios procesadores. Concurrencia = apariencia de simultaneidad mediante alternancia rápida.'},
            { type: 'title', text:'Sistemas Operativos para dispositivos móviles', level:3},
            { type: 'p', text: 'El auge de los dispositivos móviles ha impulsado una rápida evolución de los sistemas operativos diseñados para estas plataformas. Se caracterizan por optimizar el uso de recursos limitados (bateria, memoria, procesador), ofrecer interfaces orientadas al usuario final y soportar una amplia variedad de aplicaciones y servicios.'},
            { type: 'p', text: 'Pensemos en una mochila de viaje versus un closet completo. En casa puedes tener todo desordenado y en abundancia, pero en una mochila cada gramo y cada espacio cuenta, asi que solo llevas lo esencial y bien organizado. Un sistema operativo móvil hace lo mismo, exprime al máximo recursos limitados.'},
          ],
        },
      ],
    },
    {
      id: 's2',
      number: '02',
      title: 'Procesos e Hilos',
      summary: 'Conceptos de procesos e hilos, caracteristicas y mecanismos de administación',
      duration: '',
      notes: [
         {
          id: 'n1-1',
          title: 'Introducción a Procesos',
          kind: 'lectura',
          body: []
        }

      ]
    }
  ],
};
