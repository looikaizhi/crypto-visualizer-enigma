import type { EncryptResponse } from '../../services/api';

export type StageKind = 'key' | 'plug' | 'rotor' | 'reflector' | 'lamp';

export interface TraceStage {
  label: string;
  kind: StageKind;
  letter: string;
}

const roman = (model: string, fallback: string) =>
  model ? `转子 ${model}` : fallback;

/**
 * 把一次加密的 API 结果拆成 11 段电流路径：
 * 键盘 → 插线板 → 转子×3 → 反射器 → 转子×3 → 插线板 → 灯板
 */
export function buildTrace(
  plaintext: string,
  response: EncryptResponse,
  rotorModels: [string, string, string],
): TraceStage[] | null {
  const { ciphertext, plugResult, forwardResult, backwardResult } = response;
  if (
    !plugResult ||
    plugResult.length < 2 ||
    !forwardResult ||
    forwardResult.length < 3 ||
    !backwardResult ||
    backwardResult.length < 3
  ) {
    return null;
  }

  // forwardResult 顺序为 reversed(rotors) = [slot2, slot1, slot0]
  const fLabels = [rotorModels[2], rotorModels[1], rotorModels[0]];
  // backwardResult 顺序为 rotors = [slot0, slot1, slot2]
  const bLabels = [rotorModels[0], rotorModels[1], rotorModels[2]];

  return [
    { label: '键盘', kind: 'key', letter: plaintext },
    { label: '插线板', kind: 'plug', letter: plugResult[0] },
    { label: roman(fLabels[0], '转子'), kind: 'rotor', letter: forwardResult[0].to },
    { label: roman(fLabels[1], '转子'), kind: 'rotor', letter: forwardResult[1].to },
    { label: roman(fLabels[2], '转子'), kind: 'rotor', letter: forwardResult[2].to },
    { label: '反射器', kind: 'reflector', letter: backwardResult[0].from },
    { label: roman(bLabels[0], '转子'), kind: 'rotor', letter: backwardResult[0].to },
    { label: roman(bLabels[1], '转子'), kind: 'rotor', letter: backwardResult[1].to },
    { label: roman(bLabels[2], '转子'), kind: 'rotor', letter: backwardResult[2].to },
    { label: '插线板', kind: 'plug', letter: plugResult[1] },
    { label: '灯板', kind: 'lamp', letter: ciphertext },
  ];
}
