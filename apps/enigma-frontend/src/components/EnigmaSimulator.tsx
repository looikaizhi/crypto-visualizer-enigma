import React, { useState, useEffect } from 'react';
import KeyboardInput from './KeyboardInput';
import LampBoard from './LampBoard';
import RotorSelector from './RotorSelector';
import ReflectorSelector from './ReflectorSelector';
import PlugboardConfig from './PlugboardConfig';
import api, { Rotor, PlugPair, Reflector, RotorSelection } from '../services/api';
import './EnigmaSimulator.css';

type ValidationResult = { ok: true } | { ok: false; message: string };

const VALID_ROTOR_INDICES = ['I', 'II', 'III', 'IV', 'V'];
const VALID_REFLECTORS = ['A', 'B', 'C'];

function validateConfig(
  rotors: RotorSelection[],
  reflector: string,
  plugPairs: PlugPair[],
): ValidationResult {
  if (rotors.length !== 3 || rotors.some((r) => !r.index)) {
    return { ok: false, message: '请先选择全部三个转子 (rotor)' };
  }
  if (rotors.some((r) => !VALID_ROTOR_INDICES.includes(r.index))) {
    return { ok: false, message: '转子选择无效 (rotor index)' };
  }
  if (!VALID_REFLECTORS.includes(reflector)) {
    return { ok: false, message: '请选择反射器 (reflector)' };
  }
  const seen = new Set<string>();
  for (const p of plugPairs) {
    if (!p.from || !p.to) continue;
    if (p.from === p.to) {
      return { ok: false, message: '插线板不能自连同一字母' };
    }
    if (seen.has(p.from) || seen.has(p.to)) {
      return { ok: false, message: '插线板字母重复使用' };
    }
    seen.add(p.from);
    seen.add(p.to);
  }
  return { ok: true };
}

function extractApiError(err: any): string {
  const data = err?.response?.data;
  if (data?.detail) {
    if (typeof data.detail === 'string') return `配置错误: ${data.detail}`;
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      const loc = Array.isArray(first?.loc) ? first.loc.join('.') : '';
      return `配置错误: ${first?.msg || '请求被拒绝'}${loc ? ` (${loc})` : ''}`;
    }
  }
  return '请求失败，请检查转子配置';
}

const EnigmaSimulator: React.FC = () => {
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
  const [outputText, setOutputText] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initializeEnigma = async () => {
      try {
        // 获取可用的转子和反射器
        const [rotors, reflectors] = await Promise.all([
          api.getRotors(),
          api.getReflectors(),
        ]);
        console.log(rotors, reflectors);
        // 转换 rotors 数据为数组
        const rotorArray = Object.entries(rotors).map(([index, wiring]) => ({
          index,
          wiring: wiring as string,
        }));

        // 转换 reflectors 数据为数组
        const reflectorArray = Object.entries(reflectors).map(([index, wiring]) => ({
          index,
          wiring: wiring as string,
        }));

        setAvailableRotors(rotorArray);
        setAvailableReflectors(reflectorArray);
        setIsLoading(false);
      } catch (err) {
        setError('初始化失败，请刷新页面重试');
        setIsLoading(false);
      }
    };

    initializeEnigma();
  }, []);

  // 处理键盘输入
  const handleKeyPress = async (letter: string) => {
    if (isEncrypting) return;

    const result = validateConfig(selectedRotors, selectedReflector, plugPairs);
    if (!result.ok) {
      setError(result.message);
      return;
    }

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
      setError('');
      setTimeout(() => {
        setActiveLetter(null);
      }, 500);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleRotorChange = (index1: number, index: string) => {
    const wiring = availableRotors.find((rotor) => rotor.index === index)?.wiring;
    setSelectedRotors((prev) =>
      prev.map((rotor, i) => (i === index1 ? { ...rotor, index, wiring: wiring || '' } : rotor))
    );
  };

  const handlePositionChange = (index: number, position: string) => {
    setSelectedRotors((prev) =>
      prev.map((rotor, i) => (i === index ? { ...rotor, position } : rotor))
    );
  };

  const handleRingSettingChange = (index: number, ringSetting: string) => {
    setSelectedRotors((prev) =>
      prev.map((rotor, i) => (i === index ? { ...rotor, ringSetting } : rotor))
    );
  };

  const handleReflectorChange = (reflector: string) => {
    setSelectedReflector(reflector);
  };

  const handlePlugPairsChange = (pairs: PlugPair[]) => {
    setPlugPairs(pairs);
  };

  const handleReset = () => {
    setSelectedRotors((prev) =>
      prev.map((rotor) => ({ ...rotor, position: 'A' }))
    );
    setOutputText('');
    setInputText('');
    setActiveLetter(null);
    setError('');
    setIsEncrypting(false);
  };

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="enigma-simulator">
      <h1>Enigma 密码机模拟器</h1>
      {error && <div className="error-message">{error}</div>}
      
      <div className="config-section">
        <div className="rotor-reflector-container">
          <RotorSelector
            rotors={selectedRotors}
            availableRotors={availableRotors}
            onRotorChange={handleRotorChange}
            onPositionChange={handlePositionChange}
            onRingSettingChange={handleRingSettingChange}
          />
          <ReflectorSelector
            selectedReflector={selectedReflector}
            availableReflectors={availableReflectors}
            onReflectorChange={handleReflectorChange}
          />
        </div>
        <PlugboardConfig
          plugPairs={plugPairs}
          onPlugPairsChange={handlePlugPairsChange}
        />
      </div>

      <div className="display-section">
        <div className="rotor-display">
          {selectedRotors.map((rotor, index) => (
            <div key={index} className="rotor-window">
              {rotor.index || '—'}: {rotor.position}
            </div>
          ))}
        </div>
        <div className="output-display">
          <div className="input-section">
            <h3>输入文本</h3>
            <div className="input-output-text">{inputText || '等待输入...'}</div>
          </div>
          <div className="output-section">
            <h3>输出文本</h3>
            <div className="input-output-text">{outputText || '等待输入...'}</div>
          </div>
        </div>
      </div>

      <LampBoard activeLetter={activeLetter} />
      <KeyboardInput onKeyPress={handleKeyPress} disabled={isEncrypting} />

      <button onClick={handleReset} className="reset-button">
        重置
      </button>
    </div>
  );
};

export default EnigmaSimulator;