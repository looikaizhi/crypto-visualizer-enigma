import React, { useMemo, useState } from 'react';
import { QWERTZ_ROWS } from './layout';
import type { PlugPair } from '../../services/api';
import './Plugboard.css';

interface PlugboardProps {
  plugPairs: PlugPair[];
  onPlugPairsChange: (pairs: PlugPair[]) => void;
}

const MAX_PAIRS = 10;
const CELL = 54;
const SOCKET = 44;
const ROW_H = 64;
const CABLE_COLORS = ['#c0563b', '#3f6f8c', '#8a7a3a', '#6e6256', '#7a4a5e'];

const boardWidth =
  Math.max(...QWERTZ_ROWS.map((r) => r.length)) * CELL - (CELL - SOCKET);

/* 计算每个字母插孔的中心坐标 */
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
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');

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
    // 已连接的孔：拔出整对
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
      setError(`插线板最多 ${MAX_PAIRS} 对跳线`);
      setPending(null);
      return;
    }
    onPlugPairsChange([...plugPairs, { from: pending, to: letter }]);
    setPending(null);
  };

  return (
    <section className="plugboard mat-wood">
      <div className="plugboard-rim">
        <span className="plugboard-title emboss">
          插线板 · Steckerbrett
        </span>
        <span className="plugboard-count engrave">
          {validPairs.length} / {MAX_PAIRS} 对
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
              style={{
                left: pos.x - SOCKET / 2,
                top: pos.y - SOCKET / 2,
              }}
              onClick={() => handleSocket(ch)}
              aria-label={
                isUsed
                  ? `字母 ${ch} 已接线，点击拔出`
                  : `字母 ${ch} 插孔，点击连线`
              }
            >
              {ch}
            </button>
          );
        })}
      </div>
      <p className="plugboard-hint">
        点击两个字母连成一对；点击已接线字母可拔出。
      </p>
    </section>
  );
};

export default Plugboard;
