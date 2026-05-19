import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación de una cola de mensajes System V.
 * Muestra cómo se apilan mensajes con distinto mtype, y cómo el parámetro
 * msgtyp en msgrcv (0, >0, <0) decide cuál se extrae primero.
 */

type Msg = { id: number; type: number; text: string };
type Action = 'idle' | 'send' | 'recv-any' | 'recv-eq' | 'recv-lte' | 'nowait' | 'rmid';

type Step = {
  title: string;
  queue: Msg[];
  action: Action;
  /** Mensaje que el sender publica este paso (opcional). */
  outgoing?: Msg;
  /** Mensaje que el receiver extrae este paso (opcional). */
  incoming?: Msg | 'NONE';
  /** Parámetros del msgrcv si aplica. */
  msgtyp?: number;
  flags?: string;
  highlight: number[];
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Paso 1. Cola recién creada. Vacía',
    queue: [],
    action: 'idle',
    highlight: [1, 2],
    desc: 'msgget devuelve un msqid. El kernel reserva una estructura msqid_ds y un buffer interno. msg_qnum vale cero. msg_cbytes vale cero. Cualquier proceso con permisos puede empezar a enviar y recibir.',
  },
  {
    title: 'Paso 2. msgsnd. Llega un mensaje de tipo 1',
    queue: [{ id: 1, type: 1, text: 'datos A' }],
    action: 'send',
    outgoing: { id: 1, type: 1, text: 'datos A' },
    highlight: [3],
    desc: 'El productor llama msgsnd con un struct cuyo primer campo mtype vale 1. El kernel copia el mensaje al final de la cola interna. Si no hay espacio y no pides IPC_NOWAIT, msgsnd bloquea hasta que se libere espacio.',
  },
  {
    title: 'Paso 3. Llegan más mensajes con distintos tipos',
    queue: [
      { id: 1, type: 1, text: 'datos A' },
      { id: 2, type: 5, text: 'prioridad' },
      { id: 3, type: 2, text: 'datos B' },
      { id: 4, type: 1, text: 'datos C' },
    ],
    action: 'send',
    outgoing: { id: 4, type: 1, text: 'datos C' },
    highlight: [3],
    desc: 'Tres msgsnd más. La cola ahora tiene cuatro mensajes apilados en orden de llegada. Tipos 1, 5, 2 y 1 respectivamente. El orden de llegada queda guardado. Lo que cambia según el msgtyp del receptor no es el orden interno, sino cuál se elige al extraer.',
  },
  {
    title: 'Paso 4. msgrcv con msgtyp = 0. Saca el primero de cualquier tipo',
    queue: [
      { id: 2, type: 5, text: 'prioridad' },
      { id: 3, type: 2, text: 'datos B' },
      { id: 4, type: 1, text: 'datos C' },
    ],
    action: 'recv-any',
    incoming: { id: 1, type: 1, text: 'datos A' },
    msgtyp: 0,
    flags: '0',
    highlight: [4],
    desc: 'msgrcv con msgtyp = 0 dice tráeme el primer mensaje sin importar el tipo. El kernel saca el más antiguo, que es el id 1 con mtype 1. Se entrega al consumidor y se borra de la cola. msg_qnum baja a tres.',
  },
  {
    title: 'Paso 5. msgrcv con msgtyp = 2. Saca el primero del tipo 2 exacto',
    queue: [
      { id: 2, type: 5, text: 'prioridad' },
      { id: 4, type: 1, text: 'datos C' },
    ],
    action: 'recv-eq',
    incoming: { id: 3, type: 2, text: 'datos B' },
    msgtyp: 2,
    flags: '0',
    highlight: [5],
    desc: 'msgrcv con msgtyp positivo dice tráeme el primer mensaje con ese mtype exacto. El kernel busca en orden de llegada y encuentra el id 3 con mtype 2. Lo entrega y lo borra. Los mensajes id 2 y id 4 quedan intactos aunque sean más antiguos.',
  },
  {
    title: 'Paso 6. msgrcv con msgtyp = -3. Saca el menor mtype menor o igual a 3',
    queue: [
      { id: 2, type: 5, text: 'prioridad' },
    ],
    action: 'recv-lte',
    incoming: { id: 4, type: 1, text: 'datos C' },
    msgtyp: -3,
    flags: '0',
    highlight: [6],
    desc: 'msgrcv con msgtyp negativo dice tráeme el primer mensaje cuyo mtype sea menor o igual al valor absoluto. Aquí valor absoluto es 3. Quedan en la cola el id 2 con mtype 5 y el id 4 con mtype 1. Solo el id 4 cumple porque 1 es menor o igual a 3. El kernel lo entrega.',
  },
  {
    title: 'Paso 7. msgrcv con IPC_NOWAIT en cola sin mensaje del tipo pedido',
    queue: [
      { id: 2, type: 5, text: 'prioridad' },
    ],
    action: 'nowait',
    incoming: 'NONE',
    msgtyp: 7,
    flags: 'IPC_NOWAIT',
    highlight: [7],
    desc: 'msgrcv pide tipo 7. La cola solo tiene un mensaje de tipo 5. Sin IPC_NOWAIT, msgrcv bloquearía esperando que alguien envíe un mtype 7. Con IPC_NOWAIT, retorna inmediatamente -1 y errno queda en ENOMSG. El consumidor revisa errno y decide qué hacer.',
  },
  {
    title: 'Paso 8. msgctl con IPC_RMID. Destruye la cola',
    queue: [],
    action: 'rmid',
    highlight: [8],
    desc: 'msgctl con IPC_RMID elimina inmediatamente la cola. Cualquier proceso que estuviera bloqueado dentro de msgsnd o msgrcv se despierta con error -1 y errno EIDRM. Si te olvidas de IPC_RMID, la cola queda residente visible con ipcs y borrable con ipcrm.',
  },
];

const CODE = [
  '/* el productor */',
  'qid = msgget(llave, IPC_CREAT | 0600);',
  'msgsnd(qid, &m, sizeof(m.text), 0);',
  '/* receptor variantes */',
  'msgrcv(qid, &m, sizeof(m.text),  0, 0);    /* cualquiera */',
  'msgrcv(qid, &m, sizeof(m.text),  2, 0);    /* tipo exacto */',
  'msgrcv(qid, &m, sizeof(m.text), -3, 0);    /* menor o igual */',
  'msgrcv(qid, &m, sizeof(m.text),  7, IPC_NOWAIT);',
  'msgctl(qid, IPC_RMID, NULL);',
];

const AUTO_MS = 3200;

export function MessageQueueFlow() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);
  const current = STEPS[step];

  useEffect(() => {
    if (!playing) {
      if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
      return;
    }
    timer.current = window.setTimeout(() => {
      setStep(s => (s + 1) % STEPS.length);
    }, AUTO_MS);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [playing, step]);

  function goTo(s: number) {
    setPlaying(false);
    setStep(Math.max(0, Math.min(STEPS.length - 1, s)));
  }

  function typeColor(t: number) {
    const map: Record<number, string> = { 1: 'mqf-t1', 2: 'mqf-t2', 5: 'mqf-t5' };
    return map[t] || 'mqf-t0';
  }

  return (
    <div className="zf-wrap mqf-wrap">
      <div className="zf-head">
        <span className="zf-step-num">{step + 1}<small>/{STEPS.length}</small></span>
        <h4 className="zf-step-title">{current.title}</h4>
        <button
          className={`fbf-play ${playing ? 'fbf-play-on' : ''}`}
          onClick={() => setPlaying(p => !p)}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
        >
          {playing ? '❚❚ PAUSA' : '▶ AUTO'}
        </button>
      </div>

      <div className="zf-grid mqf-grid">
        <div className="zf-stage mqf-stage">
          <div className="mqf-arena">
            {/* Sender on left */}
            <div className={`mqf-side mqf-sender ${current.action === 'send' ? 'mqf-side-on' : ''}`}>
              <div className="mqf-side-tag">PRODUCTOR</div>
              <div className="mqf-side-call">msgsnd</div>
              {current.outgoing && current.action === 'send' && (
                <div className={`mqf-pkg ${typeColor(current.outgoing.type)} mqf-pkg-fly-r`}>
                  <span className="mqf-pkg-type">mtype={current.outgoing.type}</span>
                  <span className="mqf-pkg-text">{current.outgoing.text}</span>
                </div>
              )}
            </div>

            {/* Queue in the middle */}
            <div className={`mqf-queue mqf-act-${current.action}`}>
              <div className="mqf-queue-tag">cola · msqid 491521</div>
              <div className="mqf-queue-track">
                {current.queue.length === 0 ? (
                  <span className="mqf-queue-empty">{current.action === 'rmid' ? 'DESTRUIDA' : 'vacía'}</span>
                ) : (
                  current.queue.map((m, i) => (
                    <span
                      key={`${step}-${m.id}`}
                      className={`mqf-pkg ${typeColor(m.type)}`}
                      style={{ ['--i' as string]: i } as React.CSSProperties}
                    >
                      <span className="mqf-pkg-type">mtype={m.type}</span>
                      <span className="mqf-pkg-text">{m.text}</span>
                    </span>
                  ))
                )}
              </div>
              <div className="mqf-queue-meta">
                <span>msg_qnum = {current.queue.length}</span>
                {current.msgtyp !== undefined && (
                  <span>msgtyp = {current.msgtyp}</span>
                )}
                {current.flags && current.flags !== '0' && (
                  <span>flags = {current.flags}</span>
                )}
              </div>
            </div>

            {/* Receiver on right */}
            <div className={`mqf-side mqf-receiver ${current.action.startsWith('recv') || current.action === 'nowait' ? 'mqf-side-on' : ''}`}>
              <div className="mqf-side-tag">CONSUMIDOR</div>
              <div className="mqf-side-call">msgrcv</div>
              {current.incoming === 'NONE' && (
                <div className="mqf-pkg mqf-pkg-none">
                  <span className="mqf-pkg-type">errno</span>
                  <span className="mqf-pkg-text">ENOMSG</span>
                </div>
              )}
              {current.incoming && current.incoming !== 'NONE' && (
                <div className={`mqf-pkg ${typeColor(current.incoming.type)} mqf-pkg-fly-l`}>
                  <span className="mqf-pkg-type">mtype={current.incoming.type}</span>
                  <span className="mqf-pkg-text">{current.incoming.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <ol className="zf-code">
          {CODE.map((line, i) => {
            const ln = i + 1;
            const hot = current.highlight.includes(ln);
            return (
              <li key={i} className={`zf-code-line ${hot ? 'zf-code-line-hot' : ''}`}>
                <span className="zf-code-num">{ln}</span>
                <pre className="zf-code-text"><code>{line || ' '}</code></pre>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="zf-desc">{current.desc}</p>

      <div className="zf-nav">
        <button className="zf-nav-btn" onClick={() => goTo(step - 1)} disabled={step === 0} aria-label="Anterior">◀</button>
        <div className="zf-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`zf-dot ${step === i ? 'zf-dot-on' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Paso ${i + 1}`}
            />
          ))}
        </div>
        <button className="zf-nav-btn zf-nav-next" onClick={() => goTo(step + 1)} disabled={step === STEPS.length - 1} aria-label="Siguiente">▶</button>
      </div>
    </div>
  );
}
