import type { EncryptResponse } from '../../services/api';

export type StageKind = 'key' | 'plug' | 'rotor' | 'reflector' | 'lamp';

export type StageLabelKey =
  | 'signal.stage.key'
  | 'signal.stage.plug'
  | 'signal.stage.rotor'
  | 'signal.stage.rotorPlain'
  | 'signal.stage.reflector'
  | 'signal.stage.lamp';

export interface TraceStage {
  /** i18n key for the stage label; translated where the trace is rendered. */
  labelKey: StageLabelKey;
  /** Interpolation values for `labelKey` (e.g. the rotor model). */
  labelParams?: Record<string, string>;
  kind: StageKind;
  letter: string;
}

const rotorStage = (model: string, letter: string): TraceStage =>
  model
    ? {
        labelKey: 'signal.stage.rotor',
        labelParams: { model },
        kind: 'rotor',
        letter,
      }
    : { labelKey: 'signal.stage.rotorPlain', kind: 'rotor', letter };

/**
 * Split one encryption's API result into 11 current-path segments:
 * keyboard -> plugboard -> rotors x3 -> reflector -> rotors x3 -> plugboard -> lampboard
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

  // forwardResult order is reversed(rotors) = [slot2, slot1, slot0]
  const fLabels = [rotorModels[2], rotorModels[1], rotorModels[0]];
  // backwardResult order is rotors = [slot0, slot1, slot2]
  const bLabels = [rotorModels[0], rotorModels[1], rotorModels[2]];

  return [
    { labelKey: 'signal.stage.key', kind: 'key', letter: plaintext },
    { labelKey: 'signal.stage.plug', kind: 'plug', letter: plugResult[0] },
    rotorStage(fLabels[0], forwardResult[0].to),
    rotorStage(fLabels[1], forwardResult[1].to),
    rotorStage(fLabels[2], forwardResult[2].to),
    { labelKey: 'signal.stage.reflector', kind: 'reflector', letter: backwardResult[0].from },
    rotorStage(bLabels[0], backwardResult[0].to),
    rotorStage(bLabels[1], backwardResult[1].to),
    rotorStage(bLabels[2], backwardResult[2].to),
    { labelKey: 'signal.stage.plug', kind: 'plug', letter: plugResult[1] },
    { labelKey: 'signal.stage.lamp', kind: 'lamp', letter: ciphertext },
  ];
}
