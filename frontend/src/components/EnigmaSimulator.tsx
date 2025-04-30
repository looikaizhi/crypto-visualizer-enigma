import React, { useState, useEffect } from 'react';
import KeyboardInput from './KeyboardInput';
import LampBoard from './LampBoard';
import RotorSelector from './RotorSelector';
import ReflectorSelector from './ReflectorSelector';
import PlugboardConfig from './PlugboardConfig';
import api, { Rotor, PlugPair } from '../services/api';
import './EnigmaSimulator.css';

const EnigmaSimulator: React.FC = () => {
  const [availableRotors, setAvailableRotors] = useState<string[]>([]);
  const [availableReflectors, setAvailableReflectors] = useState<string[]>([]);
  const [selectedRotors, setSelectedRotors] = useState<Rotor[]>([
    { name: 'I', position: 'A' },
    { name: 'II', position: 'A' },
    { name: 'III', position: 'A' },
  ]);
  const [selectedReflector, setSelectedReflector] = useState<string>('B');
  const [plugPairs, setPlugPairs] = useState<PlugPair[]>([{ from: '', to: '' }]);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initializeEnigma = async () => {
      try {
        const [rotors, reflectors] = await Promise.all([
          api.getRotors(),
          api.getReflectors(),
        ]);
        setAvailableRotors(rotors);
        setAvailableReflectors(reflectors);
        setIsLoading(false);
      } catch (err) {
        setError('初始化失败，请刷新页面重试');
        setIsLoading(false);
      }
    };

    initializeEnigma();
  }, []);

  const handleKeyPress = async (letter: string) => {
    try {
      const plugboardPairs = plugPairs
        .filter((pair) => pair.from && pair.to)
        .map((pair) => [pair.from, pair.to] as [string, string]);

      const response = await api.encrypt({
        plaintext: letter,
        rotors: selectedRotors,
        reflector: selectedReflector,
        plugboard: plugboardPairs,
      });

      setActiveLetter(response.ciphertext);
      setOutputText((prev) => prev + response.ciphertext);
      
      // 更新转子位置
      setSelectedRotors((prev) =>
        prev.map((rotor, index) => ({
          ...rotor,
          position: response.rotor_positions[index],
        }))
      );

      // 500ms 后熄灭灯泡
      setTimeout(() => {
        setActiveLetter(null);
      }, 500);
    } catch (err) {
      setError('加密过程出错，请重试');
    }
  };

  const handleRotorChange = (index: number, name: string) => {
    setSelectedRotors((prev) =>
      prev.map((rotor, i) => (i === index ? { ...rotor, name } : rotor))
    );
  };

  const handlePositionChange = (index: number, position: string) => {
    setSelectedRotors((prev) =>
      prev.map((rotor, i) => (i === index ? { ...rotor, position } : rotor))
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
    setActiveLetter(null);
    setError('');
  };

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="enigma-simulator">
      <h1>Enigma 密码机模拟器</h1>
      {error && <div className="error-message">{error}</div>}
      
      <div className="config-section">
        <RotorSelector
          rotors={selectedRotors}
          availableRotors={availableRotors}
          onRotorChange={handleRotorChange}
          onPositionChange={handlePositionChange}
        />
        <ReflectorSelector
          selectedReflector={selectedReflector}
          availableReflectors={availableReflectors}
          onReflectorChange={handleReflectorChange}
        />
        <PlugboardConfig
          plugPairs={plugPairs}
          onPlugPairsChange={handlePlugPairsChange}
        />
      </div>

      <div className="display-section">
        <div className="rotor-display">
          {selectedRotors.map((rotor, index) => (
            <div key={index} className="rotor-window">
              {rotor.name}: {rotor.position}
            </div>
          ))}
        </div>
        <div className="output-display">
          <h3>输出文本</h3>
          <div className="output-text">{outputText || '等待输入...'}</div>
        </div>
      </div>

      <LampBoard activeLetter={activeLetter} />
      <KeyboardInput onKeyPress={handleKeyPress} />

      <button onClick={handleReset} className="reset-button">
        重置
      </button>
    </div>
  );
};

export default EnigmaSimulator; 