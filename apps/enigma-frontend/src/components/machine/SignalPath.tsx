import React, { useEffect, useRef, useState } from 'react';
import type { TraceStage } from './signal';
import './SignalPath.css';

interface SignalPathProps {
  trace: TraceStage[] | null;
  version: number;
}

type Speed = 'normal' | 'slow';
const SPEED_MS: Record<Speed, number> = { normal: 170, slow: 640 };

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SignalPath: React.FC<SignalPathProps> = ({ trace, version }) => {
  const [speed, setSpeed] = useState<Speed>('normal');
  const [stepMode, setStepMode] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [replay, setReplay] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!trace) {
      setRevealed(0);
      return;
    }
    if (prefersReducedMotion()) {
      setRevealed(trace.length);
      return;
    }
    if (stepMode) {
      setRevealed(1);
      return;
    }
    setRevealed(0);
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= trace.length && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, SPEED_MS[speed]);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [trace, version, speed, stepMode, replay]);

  if (!trace) {
    return (
      <section className="signal-path mat-wood">
        <div className="signal-rim">
          <span className="signal-title emboss">信号路径 · Stromweg</span>
        </div>
        <p className="signal-empty">敲击键盘后，这里会逐段点亮电流穿过机器的路径。</p>
      </section>
    );
  }

  const total = trace.length;
  const stepBack = () => setRevealed((r) => Math.max(1, r - 1));
  const stepFwd = () => setRevealed((r) => Math.min(total, r + 1));

  return (
    <section className="signal-path mat-wood">
      <div className="signal-rim">
        <span className="signal-title emboss">信号路径 · Stromweg</span>
        <div className="signal-controls">
          {stepMode ? (
            <>
              <button
                type="button"
                className="signal-btn focus-brass"
                onClick={stepBack}
                disabled={revealed <= 1}
                aria-label="上一段"
              >
                ◀
              </button>
              <span className="signal-step-count engrave">
                {revealed} / {total}
              </span>
              <button
                type="button"
                className="signal-btn focus-brass"
                onClick={stepFwd}
                disabled={revealed >= total}
                aria-label="下一段"
              >
                ▶
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`signal-btn focus-brass${
                  speed === 'normal' ? ' signal-btn--on' : ''
                }`}
                onClick={() => setSpeed('normal')}
              >
                正常
              </button>
              <button
                type="button"
                className={`signal-btn focus-brass${
                  speed === 'slow' ? ' signal-btn--on' : ''
                }`}
                onClick={() => setSpeed('slow')}
              >
                慢放
              </button>
              <button
                type="button"
                className="signal-btn focus-brass"
                onClick={() => setReplay((r) => r + 1)}
              >
                重播
              </button>
            </>
          )}
          <button
            type="button"
            className={`signal-btn focus-brass${
              stepMode ? ' signal-btn--on' : ''
            }`}
            onClick={() => setStepMode((v) => !v)}
          >
            单步
          </button>
        </div>
      </div>

      <div className="signal-flow" role="list">
        {trace.map((stage, i) => {
          const lit = i < revealed;
          const isHead = i === revealed - 1;
          return (
            <div className="signal-stage" role="listitem" key={i}>
              {i > 0 && (
                <span
                  className={`signal-wire${lit ? ' signal-wire--live' : ''}`}
                  aria-hidden="true"
                />
              )}
              <div
                className={`signal-node signal-node--${stage.kind}${
                  lit ? ' signal-node--live' : ''
                }${isHead ? ' signal-node--head' : ''}`}
              >
                <span className="signal-node-label">{stage.label}</span>
                <span className="signal-node-letter">{stage.letter}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SignalPath;
