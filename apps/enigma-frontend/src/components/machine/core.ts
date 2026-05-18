import type { PlugPair } from '../../services/api';

export const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const idx = (c: string): number => c.charCodeAt(0) - 65;
export const chr = (i: number): string =>
  String.fromCharCode(65 + ((i % 26) + 26) % 26);

/** Notch letter for each rotor model. */
export const NOTCHES: Record<string, string> = {
  I: 'Q',
  II: 'E',
  III: 'V',
  IV: 'J',
  V: 'Z',
};

/** Plugboard column mapping: i -> plug(i). */
export function plugboardMapping(pairs: PlugPair[]): number[] {
  const m = Array.from({ length: 26 }, (_, i) => i);
  pairs.forEach((p) => {
    if (!p.from || !p.to) return;
    const a = idx(p.from);
    const b = idx(p.to);
    if (a < 0 || a > 25 || b < 0 || b > 25) return;
    m[a] = b;
    m[b] = a;
  });
  return m;
}

/** Rotor column (forward direction): accounts for position and ringSetting. */
export function rotorForwardMapping(
  wiring: string,
  pos: string,
  ring: string
): number[] {
  const m = Array.from({ length: 26 }, (_, i) => i);
  if (!wiring || wiring.length < 26) return m;
  const p = idx(pos || 'A');
  const r = idx(ring || 'A');
  for (let i = 0; i < 26; i++) {
    const inIdx = (i + p - r + 26) % 26;
    const outChr = wiring[inIdx];
    const outIdx = (idx(outChr) - p + r + 26) % 26;
    m[i] = ((outIdx % 26) + 26) % 26;
  }
  return m;
}

/** Reflector mapping derived directly from the wiring string. */
export function reflectorMapping(wiring: string): number[] {
  if (!wiring || wiring.length < 26) {
    return Array.from({ length: 26 }, (_, i) => i);
  }
  return wiring.split('').map(idx);
}
