import React, { useState } from 'react';
import './PlugboardConfig.css';

interface PlugPair {
  from: string;
  to: string;
}

interface PlugboardConfigProps {
  plugPairs: PlugPair[];
  onPlugPairsChange: (pairs: PlugPair[]) => void;
}

const PlugboardConfig: React.FC<PlugboardConfigProps> = ({
  plugPairs,
  onPlugPairsChange,
}) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [error, setError] = useState<string>('');

  const getAvailableLetters = (currentPair: PlugPair): string[] => {
    const usedLetters = plugPairs
      .filter((pair) => pair !== currentPair)
      .flatMap((pair) => [pair.from, pair.to]);
    return alphabet.filter((letter) => !usedLetters.includes(letter));
  };

  const handlePairChange = (index: number, field: 'from' | 'to', value: string) => {
    const newPairs = [...plugPairs];
    newPairs[index] = { ...newPairs[index], [field]: value };

    // 验证配对
    const usedLetters = new Set<string>();
    let hasError = false;

    for (const pair of newPairs) {
      if (pair.from && pair.to) {
        if (usedLetters.has(pair.from) || usedLetters.has(pair.to)) {
          hasError = true;
          break;
        }
        usedLetters.add(pair.from);
        usedLetters.add(pair.to);
      }
    }

    if (hasError) {
      setError('每个字母只能使用一次');
    } else {
      setError('');
      onPlugPairsChange(newPairs);
    }
  };

  const addPair = () => {
    if (plugPairs.length < 10) {
      onPlugPairsChange([...plugPairs, { from: '', to: '' }]);
    }
  };

  const removePair = (index: number) => {
    const newPairs = plugPairs.filter((_, i) => i !== index);
    onPlugPairsChange(newPairs);
    setError('');
  };

  return (
    <div className="plugboard-container">
      <h3>插线板配置</h3>
      {error && <div className="error-message">{error}</div>}
      <div className="plug-pairs">
        {plugPairs.map((pair, index) => (
          <div key={index} className="plug-pair">
            <select
              value={pair.from}
              onChange={(e) => handlePairChange(index, 'from', e.target.value)}
              className="plug-select"
            >
              <option value="">选择字母</option>
              {getAvailableLetters(pair).map((letter) => (
                <option key={letter} value={letter}>
                  {letter}
                </option>
              ))}
            </select>
            <span className="connector">↔</span>
            <select
              value={pair.to}
              onChange={(e) => handlePairChange(index, 'to', e.target.value)}
              className="plug-select"
            >
              <option value="">选择字母</option>
              {getAvailableLetters(pair).map((letter) => (
                <option key={letter} value={letter}>
                  {letter}
                </option>
              ))}
            </select>
            <button
              onClick={() => removePair(index)}
              className="remove-pair-button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {plugPairs.length < 10 && (
        <button onClick={addPair} className="add-pair-button">
          添加配对
        </button>
      )}
    </div>
  );
};

export default PlugboardConfig; 