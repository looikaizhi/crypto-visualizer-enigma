import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import ContactColumn, { ContactColumnHandle, ColumnId } from './ContactColumn';
import {
  ALPHA,
  chr,
  idx,
  NOTCHES,
  plugboardMapping,
  reflectorMapping,
  rotorForwardMapping,
} from './core';
import type { TraceStage } from './signal';
import type { Rotor, Reflector, RotorSelection, PlugPair } from '../../services/api';
import './MachineCore.css';

interface MachineCoreProps {
  rotors: RotorSelection[];
  availableRotors: Rotor[];
  selectedReflector: string;
  availableReflectors: Reflector[];
  plugPairs: PlugPair[];
  trace: TraceStage[] | null;
  traceVersion: number;
  showAdvanced: boolean;
  speed: 'normal' | 'slow';
  stepMode: boolean;
  onSetSpeed: (s: 'normal' | 'slow') => void;
  onSetStepMode: (v: boolean) => void;
  onRotorChange: (slot: number, index: string) => void;
  onPositionChange: (slot: number, position: string) => void;
  onRingSettingChange: (slot: number, ring: string) => void;
}

const ROTOR_MODELS = ['I', 'II', 'III', 'IV', 'V'];
const SPEED_MS: Record<'normal' | 'slow', number> = { normal: 200, slow: 620 };
/* Step phase duration: current flow begins only after this delay. */
const STEP_MS: Record<'normal' | 'slow', number> = { normal: 240, slow: 700 };
const TICK_DEG = 360 / 26;
const PAD = 6;
const GAP = 10;
const CHIP_BAND = 58;
const EDGE = 13;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Column order, left to right. */
const COL_IDS: ColumnId[] = ['PB', 'R3', 'R2', 'R1', 'UKW'];
/* Column index -> selectedRotors slot */
const SLOT_OF: Record<number, number> = { 1: 2, 2: 1, 3: 0 };

interface PathPoint {
  col: number;
  side: 'L' | 'R';
  i: number;
}

const MachineCore: React.FC<MachineCoreProps> = ({
  rotors,
  availableRotors,
  selectedReflector,
  availableReflectors,
  plugPairs,
  trace,
  traceVersion,
  showAdvanced,
  speed,
  stepMode,
  onSetSpeed,
  onSetStepMode,
  onRotorChange,
  onPositionChange,
  onRingSettingChange,
}) => {
  const { t } = useTranslation();
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 420 });
  const [revealed, setRevealed] = useState(0);
  const [replay, setReplay] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'stepping' | 'flowing'>('idle');
  const [hover, setHover] = useState<{
    col: number;
    side: 'L' | 'R';
    i: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colRefs = useRef<(ContactColumnHandle | null)[]>([]);

  /* Chip rotation: accumulated angle in degrees, picks the shortest signed
     delta per change to avoid a full Z->A backspin. */
  const [chipRot, setChipRot] = useState<number[]>([0, 0, 0]);
  const [noChipTransition, setNoChipTransition] = useState(false);
  const prevPosRef = useRef<string[]>(rotors.map((r) => r?.position || 'A'));
  const lastStepDeltaRef = useRef<number[]>([0, 0, 0]);
  const posKey = rotors.map((r) => r?.position || 'A').join('');

  useEffect(() => {
    const cur = rotors.map((r) => r?.position || 'A');
    const prev = prevPosRef.current;
    const deltas = [0, 1, 2].map((slot) => {
      let d = (idx(cur[slot]) - idx(prev[slot]) + 26) % 26;
      if (d > 13) d -= 26;
      return d;
    });
    if (deltas.some((d) => d !== 0)) {
      lastStepDeltaRef.current = deltas.map((d) => d * TICK_DEG);
      setChipRot((r) => r.map((deg, slot) => deg + deltas[slot] * TICK_DEG));
    }
    prevPosRef.current = cur;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posKey]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Geometry */
  const geo = useMemo(() => {
    const { w, h } = size;
    const raw = (w - PAD * 2 - GAP * 4) / 5;
    const colW = Math.max(54, Math.min(156, raw));
    const totalW = colW * 5 + GAP * 4;
    const startX = Math.max(PAD, (w - totalW) / 2);
    const contactsTop = CHIP_BAND;
    const contactsHeight = Math.max(120, h - CHIP_BAND - 10);
    const rowH = contactsHeight / 26;
    const colX = (c: number) => startX + c * (colW + GAP);
    const leftX = (c: number) => colX(c) + EDGE;
    const rightX = (c: number) => colX(c) + colW - EDGE;
    const yOf = (i: number) => contactsTop + rowH * (i + 0.5);
    return { w, h, colW, colX, leftX, rightX, contactsTop, contactsHeight, yOf };
  }, [size]);

  /* Per-column mappings */
  const reflectorWiring =
    availableReflectors.find((r) => r.index === selectedReflector)?.wiring || '';

  const mappings = useMemo(() => {
    const pb = plugboardMapping(plugPairs);
    const mk = (slot: number) =>
      rotorForwardMapping(
        rotors[slot]?.wiring || '',
        rotors[slot]?.position || 'A',
        rotors[slot]?.ringSetting || 'A'
      );
    return {
      PB: pb,
      R3: mk(2),
      R2: mk(1),
      R1: mk(0),
      UKW: reflectorMapping(reflectorWiring),
    };
  }, [plugPairs, rotors, reflectorWiring]);

  /* Current path points (column, side, row index) */
  const pathPoints = useMemo<PathPoint[]>(() => {
    if (!trace || trace.length < 11) return [];
    const L = trace.map((s) => idx(s.letter));
    return [
      { col: 0, side: 'L', i: L[0] },
      { col: 0, side: 'R', i: L[1] },
      { col: 1, side: 'L', i: L[1] },
      { col: 1, side: 'R', i: L[2] },
      { col: 2, side: 'L', i: L[2] },
      { col: 2, side: 'R', i: L[3] },
      { col: 3, side: 'L', i: L[3] },
      { col: 3, side: 'R', i: L[4] },
      { col: 4, side: 'L', i: L[4] },
      { col: 4, side: 'L', i: L[5] },
      { col: 3, side: 'R', i: L[5] },
      { col: 3, side: 'L', i: L[6] },
      { col: 2, side: 'R', i: L[6] },
      { col: 2, side: 'L', i: L[7] },
      { col: 1, side: 'R', i: L[7] },
      { col: 1, side: 'L', i: L[8] },
      { col: 0, side: 'R', i: L[8] },
      { col: 0, side: 'L', i: L[9] },
    ];
  }, [trace]);

  /* Step -> flow animation */
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (!trace) {
      setRevealed(0);
      setPhase('idle');
      return;
    }
    const reduced = prefersReducedMotion();
    setRevealed(0);
    setPhase('stepping');

    /* Reveal the current path only after the step phase ends. */
    const startFlow = () => {
      setPhase('flowing');
      if (reduced) {
        setRevealed(trace.length);
        return;
      }
      if (stepMode) {
        setRevealed(1);
        return;
      }
      let n = 0;
      timerRef.current = setInterval(() => {
        n += 1;
        setRevealed(n);
        if (n >= trace.length && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }, SPEED_MS[speed]);
    };

    stepTimerRef.current = setTimeout(
      startFlow,
      reduced ? 0 : STEP_MS[speed]
    );

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [trace, traceVersion, speed, stepMode, replay]);

  const total = trace ? trace.length : 0;
  const visibleSegs = total
    ? Math.round((revealed / total) * (pathPoints.length - 1))
    : 0;

  const coord = (p: PathPoint) => ({
    x: p.side === 'L' ? geo.leftX(p.col) : geo.rightX(p.col),
    y: geo.yOf(p.i),
  });

  /* Static cross-column wires (26 faint lines between adjacent columns) */
  const staticWires: React.ReactNode[] = [];
  for (let c = 0; c < 4; c++) {
    for (let i = 0; i < 26; i++) {
      staticWires.push(
        <line
          key={`s${c}-${i}`}
          x1={geo.rightX(c)}
          y1={geo.yOf(i)}
          x2={geo.leftX(c + 1)}
          y2={geo.yOf(i)}
          className="core-static-wire"
        />
      );
    }
  }

  /* Current path segments */
  const segs: React.ReactNode[] = [];
  const nodes: React.ReactNode[] = [];
  for (let s = 0; s < visibleSegs && s < pathPoints.length - 1; s++) {
    const a = coord(pathPoints[s]);
    const b = coord(pathPoints[s + 1]);
    const isReflect = s === 8;
    const dir = s < 9 ? 'fwd' : 'back';
    if (isReflect) {
      const bulge = Math.max(a.x, b.x) + Math.min(40, geo.colW * 0.5);
      segs.push(
        <path
          key={`seg${s}`}
          d={`M ${a.x} ${a.y} C ${bulge} ${a.y} ${bulge} ${b.y} ${b.x} ${b.y}`}
          className={`core-path core-path--${dir}`}
          markerEnd="url(#arrow-fwd)"
        />
      );
    } else {
      segs.push(
        <line
          key={`seg${s}`}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          className={`core-path core-path--${dir}`}
          markerEnd={dir === 'fwd' ? 'url(#arrow-fwd)' : 'url(#arrow-back)'}
        />
      );
    }
  }
  for (let s = 0; s <= visibleSegs && s < pathPoints.length; s++) {
    const c = coord(pathPoints[s]);
    nodes.push(
      <circle
        key={`node${s}`}
        cx={c.x}
        cy={c.y}
        r={5}
        className={`core-node core-node--${s < 9 ? 'fwd' : 'back'}`}
      />
    );
  }

  /* Hover tooltip */
  const bubble = (() => {
    if (!hover) return null;
    const colId = COL_IDS[hover.col];
    const m = mappings[colId];
    const c = coord({ col: hover.col, side: hover.side, i: hover.i });
    let text: string;
    if (colId === 'PB') {
      const j = m[hover.i];
      text =
        j === hover.i
          ? t('core.hover.plugIdle', { letter: chr(hover.i) })
          : t('core.hover.plugLinked', { from: chr(hover.i), to: chr(j) });
    } else if (colId === 'UKW') {
      text = t('core.hover.reflector', {
        from: chr(hover.i),
        to: chr(m[hover.i]),
      });
    } else {
      if (hover.side === 'L') {
        text = t('core.hover.rotorFwd', {
          col: colId,
          from: chr(hover.i),
          to: chr(m[hover.i]),
        });
      } else {
        const src = m.indexOf(hover.i);
        text = t('core.hover.rotorBack', {
          col: colId,
          from: chr(hover.i),
          to: src >= 0 ? chr(src) : '?',
        });
      }
    }
    return (
      <div
        className="core-bubble"
        role="tooltip"
        aria-live="polite"
        style={{ left: c.x, top: c.y - 14 }}
      >
        {text}
      </div>
    );
  })();

  /* Concentric ring chip (rotor position indicator) */
  const renderChip = (c: number, slot: number) => {
    const rotor = rotors[slot];
    if (!rotor) return null;
    const cx = geo.colX(c) + geo.colW / 2;
    const cy = CHIP_BAND / 2;
    const R = 21;
    const notch = NOTCHES[rotor.index];
    /* Ticks are drawn at fixed letter angles; the whole group is rotated
       via transform so the motion can be CSS-transitioned. */
    const ticks: React.ReactNode[] = [];
    for (let k = 0; k < 26; k++) {
      const ang = (k * TICK_DEG - 90) * (Math.PI / 180);
      const isNotch = notch && k === idx(notch);
      const r1 = R - (isNotch ? 6 : 3.5);
      ticks.push(
        <line
          key={k}
          x1={cx + Math.cos(ang) * r1}
          y1={cy + Math.sin(ang) * r1}
          x2={cx + Math.cos(ang) * R}
          y2={cy + Math.sin(ang) * R}
          className={isNotch ? 'core-chip-notch' : 'core-chip-tick'}
        />
      );
    }
    return (
      <g key={`chip${c}`}>
        <circle cx={cx} cy={cy} r={R} className="core-chip-ring" />
        <circle cx={cx} cy={cy} r={R - 9} className="core-chip-inner" />
        <g
          className={`core-chip-ring-rot${
            noChipTransition ? ' core-chip-ring-rot--instant' : ''
          }`}
          style={
            { '--step-ms': `${STEP_MS[speed]}ms` } as React.CSSProperties
          }
          transform={`rotate(${-chipRot[slot]} ${cx} ${cy})`}
        >
          {ticks}
        </g>
        <text x={cx} y={cy} className="core-chip-letter">
          {rotor.position || 'A'}
        </text>
      </g>
    );
  };

  /* Top caps (per-column controls) */
  const stepPos = (slot: number, delta: number) => {
    const cur = idx(rotors[slot]?.position || 'A');
    onPositionChange(slot, chr(cur + delta));
  };

  const renderTopCap = (c: number) => {
    const colId = COL_IDS[c];
    const style: React.CSSProperties = {
      left: geo.colX(c),
      width: geo.colW,
    };
    if (colId === 'PB') {
      return (
        <div className="core-cap" style={style} key={c}>
          <span className="core-cap-label">{t('core.cap.plugboard')}</span>
        </div>
      );
    }
    if (colId === 'UKW') {
      return (
        <div className="core-cap" style={style} key={c}>
          <span className="core-cap-label">
            {t('core.cap.reflector', { value: selectedReflector })}
          </span>
        </div>
      );
    }
    const slot = SLOT_OF[c];
    const rotor = rotors[slot];
    return (
      <div className="core-cap" style={style} key={c}>
        <div className="core-cap-line">
          <span className="core-cap-tag">{colId}</span>
          <select
            className="core-cap-select focus-brass"
            value={rotor?.index || ''}
            onChange={(e) => onRotorChange(slot, e.target.value)}
            aria-label={t('core.ariaCtl.model', { col: colId })}
          >
            <option value="" disabled>
              {t('core.field.model')}
            </option>
            {ROTOR_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="core-cap-line">
          <button
            type="button"
            className="core-cap-step focus-brass"
            onClick={() => stepPos(slot, -1)}
            aria-label={t('core.ariaCtl.posDown', { col: colId })}
          >
            ▼
          </button>
          <span className="core-cap-window">{rotor?.position || 'A'}</span>
          <button
            type="button"
            className="core-cap-step focus-brass"
            onClick={() => stepPos(slot, 1)}
            aria-label={t('core.ariaCtl.posUp', { col: colId })}
          >
            ▲
          </button>
          {showAdvanced && (
            <select
              className="core-cap-ring focus-brass"
              value={rotor?.ringSetting || 'A'}
              onChange={(e) => onRingSettingChange(slot, e.target.value)}
              aria-label={t('core.ariaCtl.ring', { col: colId })}
            >
              {ALPHA.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
  };

  const stepBack = () => setRevealed((r) => Math.max(1, r - 1));
  const stepFwd = () => setRevealed((r) => Math.min(total, r + 1));

  /* Replay: instantly snap the chip back one notch, then re-run STEP + FLOW. */
  const handleReplay = () => {
    const delta = lastStepDeltaRef.current;
    if (delta.some((d) => d !== 0) && !prefersReducedMotion()) {
      setNoChipTransition(true);
      setChipRot((r) => r.map((deg, slot) => deg - delta[slot]));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setNoChipTransition(false);
          setChipRot((r) => r.map((deg, slot) => deg + delta[slot]));
        })
      );
    }
    setReplay((r) => r + 1);
  };

  return (
    <section
      className="machine-core"
      data-phase={phase}
      aria-label={t('core.aria')}
    >
      <div className="core-titlebar">
        <span className="core-title emboss">{t('core.title')}</span>
        <span className="core-legend" aria-hidden="true">
          <i className="core-legend-fwd" /> {t('core.legend.fwd')}
          <i className="core-legend-back" /> {t('core.legend.back')}
        </span>
      </div>

      <div className="core-topcaps">
        {COL_IDS.map((_, c) => renderTopCap(c))}
      </div>

      <div className="core-stage" ref={stageRef}>
        <svg
          className="core-svg"
          width={geo.w}
          height={geo.h}
          viewBox={`0 0 ${geo.w} ${geo.h}`}
        >
          <defs>
            <marker
              id="arrow-fwd"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--wire-forward)" />
            </marker>
            <marker
              id="arrow-back"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--wire-backward)" />
            </marker>
          </defs>

          <g className="core-static-wires">{staticWires}</g>

          {COL_IDS.map((colId, c) => (
            <ContactColumn
              key={colId}
              id={colId}
              ref={(h) => {
                colRefs.current[c] = h;
              }}
              x={geo.colX(c)}
              width={geo.colW}
              contactsTop={geo.contactsTop}
              contactsHeight={geo.contactsHeight}
              mapping={mappings[colId]}
              leftLabels={ALPHA}
              rightLabels={colId === 'UKW' ? undefined : ALPHA}
              onContactHover={(side, i) => setHover({ col: c, side, i })}
              onContactLeave={() => setHover(null)}
            />
          ))}

          <g className="core-chips">
            {renderChip(1, 2)}
            {renderChip(2, 1)}
            {renderChip(3, 0)}
          </g>

          <g className="core-path-layer">{segs}</g>
          <g className="core-node-layer">{nodes}</g>
        </svg>

        {bubble}

        {!trace && (
          <div className="core-idle">{t('core.idle')}</div>
        )}
      </div>

      <div className="core-timeline">
        <div className="core-dots" role="list" aria-label={t('core.ariaCtl.dots')}>
          {Array.from({ length: 11 }, (_, i) => (
            <span
              key={i}
              role="listitem"
              className={`core-dot${i < revealed ? ' core-dot--on' : ''}`}
            />
          ))}
        </div>
        <div className="core-controls">
          {stepMode ? (
            <>
              <button
                type="button"
                className="core-btn focus-brass"
                onClick={stepBack}
                disabled={!trace || revealed <= 1}
                aria-label={t('core.nav.prev')}
              >
                ◀
              </button>
              <span className="core-step-count">
                {revealed}/{total || 11}
              </span>
              <button
                type="button"
                className="core-btn focus-brass"
                onClick={stepFwd}
                disabled={!trace || revealed >= total}
                aria-label={t('core.nav.next')}
              >
                ▶
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`core-btn focus-brass${
                  speed === 'normal' ? ' core-btn--on' : ''
                }`}
                onClick={() => onSetSpeed('normal')}
              >
                {t('core.speed.normal')}
              </button>
              <button
                type="button"
                className={`core-btn focus-brass${
                  speed === 'slow' ? ' core-btn--on' : ''
                }`}
                onClick={() => onSetSpeed('slow')}
              >
                {t('core.speed.slow')}
              </button>
              <button
                type="button"
                className="core-btn focus-brass"
                onClick={handleReplay}
                disabled={!trace}
                aria-label={t('core.action.replayAria')}
              >
                {t('core.action.replayLabel')}
              </button>
            </>
          )}
          <button
            type="button"
            className={`core-btn focus-brass${
              stepMode ? ' core-btn--on' : ''
            }`}
            onClick={() => onSetStepMode(!stepMode)}
          >
            {t('core.mode.step')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default MachineCore;
