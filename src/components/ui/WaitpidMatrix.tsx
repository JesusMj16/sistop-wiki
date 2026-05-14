import { useState } from 'react';
import './prose.css';

type Child = {
  pid: number;
  pgid: number;
  label: string;
};

const CHILDREN: Child[] = [
  { pid: 1101, pgid: 500, label: 'compresor.sh' },
  { pid: 1102, pgid: 500, label: 'enviador.sh' },
  { pid: 1103, pgid: 700, label: 'render.py' },
  { pid: 1104, pgid: 700, label: 'thumbnail.py' },
];

const SELF_PGID = 500;

type Mode = {
  id: string;
  label: string;
  pidArg: string;
  title: string;
  desc: string;
  match: (c: Child) => boolean;
  matchExplain: string;
};

const MODES: Mode[] = [
  {
    id: 'any',
    label: 'pid = -1',
    pidArg: '-1',
    title: 'ESPERA POR CUALQUIER HIJO',
    desc: 'Con pid = -1 el padre indica al kernel: me da igual cuál de mis hijos termine primero, atiéndeme al que sea. Es la opción más permisiva y es exactamente lo que hace wait() internamente.',
    match: () => true,
    matchExplain: 'Todos los hijos del proceso califican.',
  },
  {
    id: 'specific',
    label: 'pid > 0',
    pidArg: '1103',
    title: 'ESPERA POR UN HIJO ESPECÍFICO',
    desc: 'Con pid igual a un valor positivo concreto (aquí 1103), el padre se queda dormido hasta que ESE proceso en particular termine, ignorando lo que hagan los demás. Si los otros hijos terminan antes, quedarán en estado zombie hasta que alguien los recoja.',
    match: (c) => c.pid === 1103,
    matchExplain: 'Solo el hijo con PID 1103 satisface la espera.',
  },
  {
    id: 'group',
    label: 'pid = 0',
    pidArg: '0',
    title: 'ESPERA POR HIJOS DEL MISMO GRUPO',
    desc: 'Con pid = 0, el padre dice: solo me interesan los hijos que pertenezcan a MI mismo grupo de procesos (PGID del padre). Es útil cuando el shell o un supervisor quiere atender únicamente al pipeline de primer plano.',
    match: (c) => c.pgid === SELF_PGID,
    matchExplain: `Hijos cuyo PGID coincida con el del padre (PGID ${SELF_PGID}).`,
  },
  {
    id: 'pgid',
    label: 'pid < 0',
    pidArg: '-700',
    title: 'ESPERA POR HIJOS DE UN PGID DADO',
    desc: 'Con pid negativo distinto de -1, el kernel toma el VALOR ABSOLUTO y lo interpreta como un PGID. Aquí -700 significa: espera por cualquier hijo cuyo grupo de procesos sea 700. Útil para supervisar pipelines en segundo plano lanzados con un PGID particular.',
    match: (c) => c.pgid === 700,
    matchExplain: 'Hijos cuyo PGID sea 700 (valor absoluto del pid pasado).',
  },
];

export function WaitpidMatrix() {
  const [modeId, setModeId] = useState('any');
  const [nohang, setNohang] = useState(false);
  const mode = MODES.find(m => m.id === modeId)!;

  const captured = CHILDREN.filter(mode.match);

  return (
    <div className="wpm-wrap">
      <div className="wpm-intro">
        <span className="wpm-intro-badge">VISUAL · ELIGIENDO QUÉ HIJO ESPERAR</span>
        <p className="wpm-intro-text">
          A diferencia de <em>wait()</em>, la llamada <strong>waitpid()</strong> permite decir EXACTAMENTE
          qué hijos cuentan. El primer parámetro (<em>pid</em>) cambia totalmente el significado de la
          espera según el valor que le des. Cambia el modo en los botones de abajo y observa qué hijos
          quedan elegibles. Activa <em>WNOHANG</em> para ver cómo se comporta sin bloquear.
        </p>
      </div>

      <div className="wpm-modes">
        {MODES.map(m => (
          <button
            key={m.id}
            className={`wpm-mode-btn ${modeId === m.id ? 'wpm-mode-btn-on' : ''}`}
            onClick={() => setModeId(m.id)}
          >
            <span className="wpm-mode-arg">{m.label}</span>
            <span className="wpm-mode-name">{m.title.replace('ESPERA POR ', '')}</span>
          </button>
        ))}
      </div>

      <div className="wpm-call">
        <span className="wpm-call-prefix">waitpid(</span>
        <span className="wpm-call-arg wpm-call-arg-pid">{mode.pidArg}</span>
        <span className="wpm-call-sep">,</span>
        <span className="wpm-call-arg">&amp;status</span>
        <span className="wpm-call-sep">,</span>
        <span className={`wpm-call-arg wpm-call-arg-opt ${nohang ? 'wpm-call-arg-opt-on' : ''}`}>{nohang ? 'WNOHANG' : '0'}</span>
        <span className="wpm-call-prefix">);</span>
        <label className="wpm-toggle">
          <input type="checkbox" checked={nohang} onChange={e => setNohang(e.target.checked)} />
          <span className="wpm-toggle-text">WNOHANG (no bloquear)</span>
        </label>
      </div>

      <div className="wpm-explain">
        <p className="wpm-explain-text">{mode.desc}</p>
        <p className="wpm-explain-match"><span className="wpm-explain-tag">REGLA</span>{mode.matchExplain}</p>
      </div>

      <div className="wpm-children">
        <div className="wpm-children-tag">HIJOS DEL PADRE (PGID 500)</div>
        <div className="wpm-children-grid">
          {CHILDREN.map(c => {
            const hit = captured.some(x => x.pid === c.pid);
            return (
              <div key={c.pid} className={`wpm-child ${hit ? 'wpm-child-hit' : 'wpm-child-miss'}`}>
                <div className="wpm-child-head">
                  <span className="wpm-child-pid">PID {c.pid}</span>
                  <span className="wpm-child-pgid">PGID {c.pgid}</span>
                </div>
                <div className="wpm-child-label">{c.label}</div>
                <div className="wpm-child-flag">{hit ? '✓ ELEGIBLE' : '✗ IGNORADO'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="wpm-result">
        <span className="wpm-result-tag">RESULTADO</span>
        <span className="wpm-result-text">
          {nohang
            ? captured.length === 0
              ? 'WNOHANG activo y ningún hijo elegible terminó aún. waitpid() retorna 0 INMEDIATAMENTE, sin bloquear.'
              : `WNOHANG activo. waitpid() retornará el PID de un hijo elegible (uno de: ${captured.map(c => c.pid).join(', ')}) si ya terminó, o 0 si todavía no.`
            : captured.length === 0
              ? 'Sin WNOHANG, waitpid() se queda bloqueado para SIEMPRE: no hay hijo elegible que pueda llegar a satisfacer la espera. Devolverá -1 con errno = ECHILD.'
              : `Sin WNOHANG, el padre se bloquea hasta que alguno de [${captured.map(c => c.pid).join(', ')}] termine. Entonces waitpid() retorna su PID y rellena status.`}
        </span>
      </div>
    </div>
  );
}
