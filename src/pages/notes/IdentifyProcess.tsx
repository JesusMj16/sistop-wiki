import React from 'react'
import { Code, P } from '../../components/ui/Prose'

export default function IdentifyProcess() {
  return (
    <>
        <P>En los procesos tenemos identificadores unicos llamados PID, este es asignado por el kernel
            este proceso mantiene su referencia con su pápa, donde para el se usa PPID (Parent Process Identifier)
            el sistema nos proporciona estas llamadas: </P>
            <Code title="getpid.c">{`#include <sys/types.h>
#include <unistd.h>

pid_t getpid(void);`}</Code>
            <Code title='getppid.c'>{`#include <stdio.h>
#include <sys/types.h>
#include <unistd.h>

pid_t getppid(void);`}</Code>   

        <P> La primera funcion nos ayuda a obtener el PID del proceso actual, mientras 
            que en el segundo  </P>
    </>
  )
}