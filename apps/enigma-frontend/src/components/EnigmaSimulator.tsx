import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import MachinePlate from './machine/MachinePlate';
import RotorBank from './machine/RotorBank';
import LampBoard from './machine/LampBoard';
import Keyboard from './machine/Keyboard';
import Plugboard from './machine/Plugboard';
import TapeDisplay from './machine/TapeDisplay';
import SignalPath from './machine/SignalPath';
import ConfigRail from './machine/ConfigRail';
import MachineCore from './machine/MachineCore';
import { buildTrace, TraceStage } from './machine/signal';
import Onboarding from './onboarding/Onboarding';
import { usePhysicalKeyboard } from '../hooks/usePhysicalKeyboard';
import { useSound } from '../hooks/useSound';
import { useMediaQuery } from '../hooks/useMediaQuery';
import api, { Rotor, PlugPair, Reflector, RotorSelection } from '../services/api';
import './EnigmaSimulator.css';

type ErrorKey =
  | 'error.rotors.incomplete'
  | 'error.rotors.invalid'
  | 'error.reflector.missing'
  | 'error.plug.selfLoop'
  | 'error.plug.duplicate';

type ValidationResult = { ok: true } | { ok: false; messageKey: ErrorKey };

const VALID_ROTOR_INDICES = ['I', 'II', 'III', 'IV', 'V'];
const VALID_REFLECTORS = ['A', 'B', 'C'];
const REFLECTOR_CYCLE = ['A', 'B', 'C'];

function validateConfig(
  rotors: RotorSelection[],
  reflector: string,
  plugPairs: PlugPair[],
): ValidationResult {
  if (rotors.length !== 3 || rotors.some((r) => !r.index)) {
    return { ok: false, messageKey: 'error.rotors.incomplete' };
  }
  if (rotors.some((r) => !VALID_ROTOR_INDICES.includes(r.index))) {
    return { ok: false, messageKey: 'error.rotors.invalid' };
  }
  if (!VALID_REFLECTORS.includes(reflector)) {
    return { ok: false, messageKey: 'error.reflector.missing' };
  }
  const seen = new Set<string>();
  for (const p of plugPairs) {
    if (!p.from || !p.to) continue;
    if (p.from === p.to) {
      return { ok: false, messageKey: 'error.plug.selfLoop' };
    }
    if (seen.has(p.from) || seen.has(p.to)) {
      return { ok: false, messageKey: 'error.plug.duplicate' };
    }
    seen.add(p.from);
    seen.add(p.to);
  }
  return { ok: true };
}

function extractApiError(err: any, t: TFunction): string {
  const data = err?.response?.data;
  if (data?.detail) {
    if (typeof data.detail === 'string') {
      return t('error.api.detail', { detail: data.detail });
    }
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      const loc = Array.isArray(first?.loc) ? first.loc.join('.') : '';
      const msg = first?.msg || t('error.api.rejected');
      return t('error.api.detail', {
        detail: `${msg}${loc ? ` (${loc})` : ''}`,
      });
    }
  }
  return t('error.api.fallback');
}

const EnigmaSimulator: React.FC = () => {
  const { t } = useTranslation();
  const [availableRotors, setAvailableRotors] = useState<Rotor[]>([]);
  const [availableReflectors, setAvailableReflectors] = useState<Reflector[]>([]);
  const [selectedRotors, setSelectedRotors] = useState<RotorSelection[]>([
    { index: '', wiring: '', position: 'A', ringSetting: 'A' },
    { index: '', wiring: '', position: 'A', ringSetting: 'A' },
    { index: '', wiring: '', position: 'A', ringSetting: 'A' },
  ]);
  const [selectedReflector, setSelectedReflector] = useState<string>('B');
  const [plugPairs, setPlugPairs] = useState<PlugPair[]>([]);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [outputText, setOutputText] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [trace, setTrace] = useState<TraceStage[] | null>(null);
  const [traceVersion, setTraceVersion] = useState<number>(0);
  const [announcement, setAnnouncement] = useState<string>('');
  const [speed, setSpeed] = useState<'normal' | 'slow'>('normal');
  const [stepMode, setStepMode] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const sound = useSound();
  const narrow = useMediaQuery('(max-width: 760px)');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => !localStorage.getItem('enigma-onboarded')
  );

  const dismissOnboarding = () => {
    localStorage.setItem('enigma-onboarded', '1');
    setShowOnboarding(false);
  };

  useEffect(() => {
    const initializeEnigma = async () => {
      try {
        const [rotors, reflectors] = await Promise.all([
          api.getRotors(),
          api.getReflectors(),
        ]);
        const rotorArray = Object.entries(rotors).map(([index, wiring]) => ({
          index,
          wiring: wiring as string,
        }));
        const reflectorArray = Object.entries(reflectors).map(
          ([index, wiring]) => ({ index, wiring: wiring as string })
        );
        setAvailableRotors(rotorArray);
        setAvailableReflectors(reflectorArray);
        setIsLoading(false);
      } catch (err) {
        setError(t('error.init.failed'));
        setIsLoading(false);
      }
    };
    initializeEnigma();
  }, [t]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 3200);
    return () => clearTimeout(t);
  }, [error]);

  const handleKeyPress = useCallback(
    async (letter: string) => {
      if (isEncrypting) return;

      const result = validateConfig(selectedRotors, selectedReflector, plugPairs);
      if (!result.ok) {
        setError(t(result.messageKey));
        return;
      }

      setPressedKey(letter);
      sound.playKey();
      setTimeout(() => setPressedKey((cur) => (cur === letter ? null : cur)), 160);

      const plugboardPairs = plugPairs
        .filter((pair) => pair.from && pair.to)
        .map((pair) => [pair.from, pair.to] as [string, string]);

      setIsEncrypting(true);
      try {
        const response = await api.encrypt({
          plaintext: letter,
          rotors: selectedRotors,
          reflector: selectedReflector,
          plugboard: plugboardPairs,
        });

        setInputText((prev) => prev + letter);
        setOutputText((prev) => prev + response.ciphertext);
        setSelectedRotors((prev) =>
          prev.map((rotor, index) => ({
            ...rotor,
            position: response.rotor_positions[index],
          }))
        );
        setActiveLetter(response.ciphertext);
        sound.playLamp();
        setAnnouncement(
          t('announce.encrypted', {
            plain: letter,
            cipher: response.ciphertext,
          })
        );
        setTrace(
          buildTrace(letter, response, [
            selectedRotors[0].index,
            selectedRotors[1].index,
            selectedRotors[2].index,
          ])
        );
        setTraceVersion((v) => v + 1);
        setError('');
        setTimeout(() => setActiveLetter(null), 500);
      } catch (err) {
        setError(extractApiError(err, t));
      } finally {
        setIsEncrypting(false);
      }
    },
    [isEncrypting, selectedRotors, selectedReflector, plugPairs, sound, t]
  );

  usePhysicalKeyboard(handleKeyPress, !isLoading && !isEncrypting);

  const handleRotorChange = (slot: number, index: string) => {
    const wiring = availableRotors.find((r) => r.index === index)?.wiring;
    setSelectedRotors((prev) =>
      prev.map((rotor, i) =>
        i === slot ? { ...rotor, index, wiring: wiring || '' } : rotor
      )
    );
  };

  const handlePositionChange = (slot: number, position: string) => {
    setSelectedRotors((prev) =>
      prev.map((rotor, i) => (i === slot ? { ...rotor, position } : rotor))
    );
  };

  const handleRingSettingChange = (slot: number, ringSetting: string) => {
    setSelectedRotors((prev) =>
      prev.map((rotor, i) => (i === slot ? { ...rotor, ringSetting } : rotor))
    );
  };

  const handleReset = () => {
    setSelectedRotors((prev) => prev.map((rotor) => ({ ...rotor, position: 'A' })));
    setOutputText('');
    setInputText('');
    setActiveLetter(null);
    setPressedKey(null);
    setTrace(null);
    setError('');
    setIsEncrypting(false);
  };

  const handlePreset = () => {
    const pick = (idx: string) =>
      availableRotors.find((r) => r.index === idx)?.wiring || '';
    setSelectedRotors([
      { index: 'I', wiring: pick('I'), position: 'A', ringSetting: 'A' },
      { index: 'II', wiring: pick('II'), position: 'A', ringSetting: 'A' },
      { index: 'III', wiring: pick('III'), position: 'A', ringSetting: 'A' },
    ]);
    setSelectedReflector('B');
    setPlugPairs([
      { from: 'A', to: 'M' },
      { from: 'F', to: 'I' },
      { from: 'N', to: 'V' },
    ]);
    setOutputText('');
    setInputText('');
    setActiveLetter(null);
    setTrace(null);
    setError('');
  };

  const handleReflectorCycle = () => {
    const cur = REFLECTOR_CYCLE.indexOf(selectedReflector);
    setSelectedReflector(REFLECTOR_CYCLE[(cur + 1) % REFLECTOR_CYCLE.length]);
  };

  if (isLoading) {
    return (
      <div className="enigma-loading">
        <div className="enigma-loading-disc" />
        <span>{t('loading.assembling')}</span>
      </div>
    );
  }

  const onboarding = showOnboarding && (
    <Onboarding
      onClose={dismissOnboarding}
      onLoadPreset={() => {
        handlePreset();
        dismissOnboarding();
      }}
    />
  );

  const liveRegion = (
    <div className="sr-only" aria-live="polite">
      {announcement}
    </div>
  );

  const faultToast = error && (
    <div className="machine-fault-toast" role="alert">
      <span className="fault-lamp" aria-hidden="true" />
      {error}
    </div>
  );

  /* Narrow screen: legacy vertical fallback. */
  if (narrow) {
    return (
      <div className="enigma-machine enigma-machine--narrow">
        {onboarding}
        <MachinePlate
          onReset={handleReset}
          onPreset={handlePreset}
          onHelp={() => setShowOnboarding(true)}
          soundOn={sound.enabled}
          onToggleSound={sound.toggle}
        />
        {liveRegion}
        {faultToast}
        <RotorBank
          rotors={selectedRotors}
          availableRotors={availableRotors}
          selectedReflector={selectedReflector}
          availableReflectors={availableReflectors}
          onRotorChange={handleRotorChange}
          onPositionChange={handlePositionChange}
          onRingSettingChange={handleRingSettingChange}
          onReflectorChange={setSelectedReflector}
        />
        <LampBoard activeLetter={activeLetter} />
        <Keyboard
          onKeyPress={handleKeyPress}
          disabled={isEncrypting}
          pressedKey={pressedKey}
        />
        <SignalPath trace={trace} version={traceVersion} />
        <Plugboard plugPairs={plugPairs} onPlugPairsChange={setPlugPairs} />
        <TapeDisplay inputText={inputText} outputText={outputText} />
      </div>
    );
  }

  /* Desktop: single-viewport bento layout. */
  return (
    <div className="enigma-machine">
      {onboarding}
      {liveRegion}
      {faultToast}

      <MachinePlate
        onReset={handleReset}
        onPreset={handlePreset}
        onHelp={() => setShowOnboarding(true)}
        soundOn={sound.enabled}
        onToggleSound={sound.toggle}
      />

      <ConfigRail
        rotors={selectedRotors}
        selectedReflector={selectedReflector}
        plugPairCount={plugPairs.filter((p) => p.from && p.to).length}
        showAdvanced={showAdvanced}
        stepMode={stepMode}
        slowMode={speed === 'slow'}
        onPreset={handlePreset}
        onReset={handleReset}
        onReflectorCycle={handleReflectorCycle}
        onToggleAdvanced={() => setShowAdvanced((v) => !v)}
        onToggleStep={() => setStepMode((v) => !v)}
        onToggleSlow={() => setSpeed((s) => (s === 'slow' ? 'normal' : 'slow'))}
      />

      <MachineCore
        rotors={selectedRotors}
        availableRotors={availableRotors}
        selectedReflector={selectedReflector}
        availableReflectors={availableReflectors}
        plugPairs={plugPairs}
        trace={trace}
        traceVersion={traceVersion}
        showAdvanced={showAdvanced}
        speed={speed}
        stepMode={stepMode}
        onSetSpeed={setSpeed}
        onSetStepMode={setStepMode}
        onRotorChange={handleRotorChange}
        onPositionChange={handlePositionChange}
        onRingSettingChange={handleRingSettingChange}
      />

      <div className="machine-side">
        <LampBoard
          activeLetter={activeLetter}
          compact
          outputText={outputText}
        />
        <Keyboard
          onKeyPress={handleKeyPress}
          disabled={isEncrypting}
          pressedKey={pressedKey}
          compact
          inputText={inputText}
        />
      </div>

      <Plugboard plugPairs={plugPairs} onPlugPairsChange={setPlugPairs} />
    </div>
  );
};

export default EnigmaSimulator;
