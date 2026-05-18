import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QWERTZ_ROWS } from './layout';
import { ALPHA } from './core';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { PlugPair } from '../../services/api';
import './Plugboard.css';

interface PlugboardProps {
  plugPairs: PlugPair[];
  onPlugPairsChange: (pairs: PlugPair[]) => void;
}

const MAX_PAIRS = 10;
const CABLE_COLORS = ['#c0563b', '#3f6f8c', '#8a7a3a', '#6e6256', '#7a4a5e'];

/* Legacy three-row geometry (used for the narrow-screen fallback). */
const CELL = 54;
const SOCKET = 44;
const ROW_H = 64;
const boardWidth =
  Math.max(...QWERTZ_ROWS.map((r) => r.length)) * CELL - (CELL - SOCKET);
const SOCKET_POS: Record<string, { x: number; y: number }> = {};
QWERTZ_ROWS.forEach((row, ri) => {
  const rowWidth = row.length * CELL - (CELL - SOCKET);
  const startX = (boardWidth - rowWidth) / 2;
  row.forEach((ch, ci) => {
    SOCKET_POS[ch] = {
      x: startX + ci * CELL + SOCKET / 2,
      y: ri * ROW_H + SOCKET / 2,
    };
  });
});
const boardHeight = QWERTZ_ROWS.length * ROW_H;

const Plugboard: React.FC<PlugboardProps> = ({
  plugPairs,
  onPlugPairsChange,
}) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const narrow = useMediaQuery('(max-width: 760px)');
  const stripRef = useRef<HTMLDivElement>(null);
  const [stripW, setStripW] = useState(1024);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStripW(el.clientWidth));
    ro.observe(el);
    setStripW(el.clientWidth);
    return () => ro.disconnect();
  }, [narrow]);

  const validPairs = useMemo(
    () => plugPairs.filter((p) => p.from && p.to && p.from !== p.to),
    [plugPairs]
  );
  const used = useMemo(() => {
    const s = new Set<string>();
    validPairs.forEach((p) => {
      s.add(p.from);
      s.add(p.to);
    });
    return s;
  }, [validPairs]);

  const handleSocket = (letter: string) => {
    setError('');
    if (used.has(letter)) {
      onPlugPairsChange(
        plugPairs.filter((p) => p.from !== letter && p.to !== letter)
      );
      setPending(null);
      return;
    }
    if (pending === null) {
      setPending(letter);
      return;
    }
    if (pending === letter) {
      setPending(null);
      return;
    }
    if (validPairs.length >= MAX_PAIRS) {
      setError(t('plugboard.error.max', { max: MAX_PAIRS }));
      setPending(null);
      return;
    }
    onPlugPairsChange([...plugPairs, { from: pending, to: letter }]);
    setPending(null);
  };

  /* Narrow-screen fallback: legacy three-row layout. */
  if (narrow) {
    return (
      <section className="plugboard mat-wood">
        <div className="plugboard-rim">
          <span className="plugboard-title emboss">{t('plugboard.title')}</span>
          <span className="plugboard-count engrave">
            {t('plugboard.count', {
              count: validPairs.length,
              max: MAX_PAIRS,
            })}
          </span>
        </div>
        {error && (
          <div className="plugboard-error" role="alert">
            {error}
          </div>
        )}
        <div
          className="plugboard-panel mat-bakelite"
          style={{ width: boardWidth, height: boardHeight }}
        >
          <svg
            className="plugboard-cables"
            width={boardWidth}
            height={boardHeight}
            aria-hidden="true"
          >
            {validPairs.map((p, i) => {
              const a = SOCKET_POS[p.from];
              const b = SOCKET_POS[p.to];
              if (!a || !b) return null;
              const sag = Math.max(a.y, b.y) + 38;
              const midX = (a.x + b.x) / 2;
              const color = CABLE_COLORS[i % CABLE_COLORS.length];
              return (
                <path
                  key={`${p.from}-${p.to}`}
                  d={`M ${a.x} ${a.y} Q ${midX} ${sag} ${b.x} ${b.y}`}
                  stroke={color}
                  strokeWidth={6}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          {QWERTZ_ROWS.flat().map((ch) => {
            const pos = SOCKET_POS[ch];
            const isUsed = used.has(ch);
            const isPending = pending === ch;
            return (
              <button
                key={ch}
                type="button"
                className={`plug-socket focus-brass${
                  isUsed ? ' plug-socket--wired' : ''
                }${isPending ? ' plug-socket--pending' : ''}`}
                style={{ left: pos.x - SOCKET / 2, top: pos.y - SOCKET / 2 }}
                onClick={() => handleSocket(ch)}
                aria-label={t(
                  isUsed ? 'plugboard.aria.wired' : 'plugboard.aria.open',
                  { letter: ch }
                )}
              >
                {ch}
              </button>
            );
          })}
        </div>
        <p className="plugboard-hint">{t('plugboard.hint')}</p>
      </section>
    );
  }

  /* Desktop: single-row 26-socket strip. */
  const STRIP_H = 112;
  const SOCKET_Y = 30;
  const ARC_SAG = 96;
  const colX = (i: number) => ((i + 0.5) * stripW) / 26;

  return (
    <section className="plug-strip mat-wood" ref={stripRef}>
      <div className="plug-strip-badge">
        <span className="plug-strip-count engrave">
          {t('plugboard.compact', {
            count: validPairs.length,
            max: MAX_PAIRS,
          })}
        </span>
        {error && <span className="plug-strip-error">{error}</span>}
      </div>

      <svg
        className="plug-strip-cables"
        width={stripW}
        height={STRIP_H}
        viewBox={`0 0 ${stripW} ${STRIP_H}`}
        aria-hidden="true"
      >
        {validPairs.map((p, i) => {
          const ax = colX(ALPHA.indexOf(p.from));
          const bx = colX(ALPHA.indexOf(p.to));
          const midX = (ax + bx) / 2;
          const color = CABLE_COLORS[i % CABLE_COLORS.length];
          return (
            <path
              key={`${p.from}-${p.to}`}
              d={`M ${ax} ${SOCKET_Y + 16} Q ${midX} ${ARC_SAG} ${bx} ${
                SOCKET_Y + 16
              }`}
              stroke={color}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      <div className="plug-strip-row">
        {ALPHA.map((ch) => {
          const isUsed = used.has(ch);
          const isPending = pending === ch;
          return (
            <button
              key={ch}
              type="button"
              className={`plug-strip-socket focus-brass${
                isUsed ? ' plug-strip-socket--wired' : ''
              }${isPending ? ' plug-strip-socket--pending' : ''}`}
              onClick={() => handleSocket(ch)}
              aria-label={t(
                isUsed ? 'plugboard.aria.wired' : 'plugboard.aria.open',
                { letter: ch }
              )}
            >
              {ch}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default Plugboard;
