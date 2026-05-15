import React, { useState, useEffect, useMemo, useRef } from 'react';
import './PlugboardConfig.css';

interface PlugPair {
  from: string;
  to: string;
}

interface PlugboardConfigProps {
  plugPairs: PlugPair[];
  onPlugPairsChange: (pairs: PlugPair[]) => void;
}

const MAX_PAIRS = 10;

const PlugboardConfig: React.FC<PlugboardConfigProps> = ({
  plugPairs,
  onPlugPairsChange,
}) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [error, setError] = useState<string>('');
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [tempPos, setTempPos] = useState<[number, number] | null>(null);
  const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragStartRef = useRef<string | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const plugPairsRef = useRef<PlugPair[]>(plugPairs);
  plugPairsRef.current = plugPairs;
  const usedLettersRef = useRef<Set<string>>(new Set());

  const usedLetters = useMemo(
    () =>
      new Set(
        plugPairs
          .filter((p) => p.from && p.to)
          .flatMap((p) => [p.from, p.to])
      ),
    [plugPairs]
  );
  usedLettersRef.current = usedLetters;

  const centerOf = (letter: string) => {
    const el = boxRefs.current.get(letter);
    if (!el) return [0, 0];
    const r = el.getBoundingClientRect();
    const svg = document.querySelector('svg.lines');
    if (!svg) return [0, 0];
    const svgRect = svg.getBoundingClientRect();
    return [r.left + r.width / 2 - svgRect.left, r.top + r.height / 2 - svgRect.top];
  };

  const letterFromEvent = (e: Event): string | null => {
    const target = e.target as HTMLElement | null;
    const box = target?.closest('[data-plug-letter]') as HTMLElement | null;
    return box?.dataset.plugLetter ?? null;
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const letter = letterFromEvent(e);
      if (!letter) return;
      e.preventDefault();
      dragStartRef.current = letter;
      setDragStart(letter);
      setTempPos(null);
    };

    const onUp = (e: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const letter = letterFromEvent(e);
      // Whether click-to-remove fires depends on target. If mouseup is on the
      // same letter as mousedown, native click will fire — let onClick handle it.
      if (letter && letter !== start) {
        const used = usedLettersRef.current;
        const pairs = plugPairsRef.current;
        if (used.has(start) || used.has(letter)) {
          setError(`字母 ${used.has(start) ? start : letter} 已在其它对中使用`);
        } else if (pairs.filter((p) => p.from && p.to).length >= MAX_PAIRS) {
          setError(`插线板最多 ${MAX_PAIRS} 对`);
        } else {
          onPlugPairsChange([...pairs, { from: start, to: letter }]);
          setError('');
        }
      }
      dragStartRef.current = null;
      setDragStart(null);
      setTempPos(null);
    };

    const onMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const svg = document.querySelector('svg.lines');
      if (!svg) return;
      const svgRect = svg.getBoundingClientRect();
      setTempPos([e.clientX - svgRect.left, e.clientY - svgRect.top]);
    };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [onPlugPairsChange]);

  const removePair = (letter: string) => () => {
    const next = plugPairs.filter(
      (pair) => pair.from !== letter && pair.to !== letter
    );
    if (next.length !== plugPairs.length) {
      onPlugPairsChange(next);
      setError('');
    }
  };

  const renderLines = () => {
    const validPairs = plugPairs.filter(
      (p) => p.from && p.to && p.from !== p.to
    );
    const lines = validPairs.map(({ from, to }, i) => {
      const [x1, y1] = centerOf(from);
      const [x2, y2] = centerOf(to);
      return (
        <line
          key={`${from}-${to}-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          className="solid"
        />
      );
    });
    if (dragStart && tempPos) {
      const [x1, y1] = centerOf(dragStart);
      const [x2, y2] = tempPos;
      lines.push(
        <line
          key="preview"
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          className="preview"
        />
      );
    }
    return lines;
  };

  return (
    <div className="plugboard-container">
      <h3>插线板配置</h3>
      {error && <div className="error-message">{error}</div>}
      <div className="wrapper">
        <svg className="lines">{renderLines()}</svg>

        <div className="grid" ref={gridRef}>
          {alphabet.map((ch) => (
            <div
              key={ch}
              ref={(el) => {
                if (el) {
                  boxRefs.current.set(ch, el);
                }
              }}
              className={`box${usedLetters.has(ch) ? ' connected' : ''}`}
              data-plug-letter={ch}
              onClick={removePair(ch)}
            >
              {ch}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlugboardConfig;
