import { useCallback, useRef, useState } from 'react';

interface SoundApi {
  enabled: boolean;
  toggle: () => void;
  playKey: () => void;
  playLamp: () => void;
}

/* 用 Web Audio 合成机械音，无需音频资源 */
export function useSound(): SoundApi {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = (): AudioContext | null => {
    if (!ctxRef.current) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    return ctxRef.current;
  };

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  /* 键帽落下的低沉机械声 */
  const playKey = useCallback(() => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(58, t + 0.07);
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.11);
  }, [enabled]);

  /* 灯泡通电的清脆短音 */
  const playLamp = useCallback(() => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.1, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }, [enabled]);

  return { enabled, toggle, playKey, playLamp };
}
