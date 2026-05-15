import { P, H3, List, Code} from '../../components/ui/Prose'

export default function CtrlProcesos() {
  return (
    <> <P> El sistemas operativo es el controlador central de lo que sucede en el sistema, este planifica y atiende cada proceso para ejecutarlo en el procesado, cuando los ejecuta 
      se encarga de asignar y administrar los recursos con los que cuenta el sistema. El sistema debe ser muy completo ya que realiza diversas operaciones tales como crear, destruir,
      suspender, reanudar y cambiar la prioridad del proceso.
    </P>
    <H3> Acciones de creacion de procesos</H3>
    <P>Para la creacion de un proceso se debe realizar lo siguiente:</P>
    <List>
      <li>Asignar el identificador unico</li>
      <li>Insertarse en la lista de procesos que son administrados por el sistema</li>
      <li>Verificar cual es sus prioridad</li>
      <li>Crear su bloque de control del proceso</li>
      <li>Asignar recursos y direcciones necesarias</li>
    </List>
    <P>
      En el momento que el proceso es añadido a la lista de procesos el sistema debe construir la estructura de datos para su gestion, el kernel respresenta al proceso con un descriptor
      que se define por la estructura task_struct la cual almacena informacion administrativa del proceso: estado, prioridad, identificador, contesxto y relaciones con procesos.
    </P>
    <P>El ejemplo de su anatomia es la propuesta a continuacion:</P>
    <Code title="task_struct.c">{`struct task_struct {
        volatile long state; 
        unsigned long flags;
        pid_t pid;
        pid_t tgid;  
        struct task_struct *parent;  
        struct list_head children;    
        struct list_head sibling;    

        /* Punteros a subsistemas */
        struct mm_struct *mm;         
        struct files_struct *files;   
};`}</Code>
    </>
   

  )
}
