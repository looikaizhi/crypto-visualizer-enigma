import React, { useState, useEffect, useRef } from 'react';
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
  const [dragStart, setDragStart] = useState<string | null>(null); // 起点字母
  const [tempPos, setTempPos] = useState<[number, number] | null>(null); // 鼠标实时位置
  const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map()); // 用于存储字母格子的引用

  const getAvailableLetters = (currentPair: PlugPair): string[] => {
    const usedLetters = plugPairs
      .filter((pair) => pair !== currentPair)
      .flatMap((pair) => [pair.from, pair.to]);
    return alphabet.filter((letter) => !usedLetters.includes(letter));
  };

  const usedLetters = new Set<string>();
  const handlePairChange = (index: number, field: 'from' | 'to', value: string) => {
    const newPairs = [...plugPairs];
    newPairs[index] = { ...newPairs[index], [field]: value };

    // 验证配对
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
    usedLetters.delete(plugPairs[index].from);
    usedLetters.delete(plugPairs[index].to);
    setError('');
  };

  const removePair1 = (letter: string) => () => {
    plugPairs.forEach((pair) => {
      if (pair.from === letter || pair.to === letter) {
        usedLetters.delete(pair.from);
        usedLetters.delete(pair.to);
      }
    });
    const newPairs = plugPairs.filter((pair) => pair.from === letter || pair.to === letter);
    onPlugPairsChange(newPairs);
    setError('');
  }

  /** ------------------可视化------------------------ */
  /** 返回某字母格子的中心坐标，修正滚动偏移和 SVG 坐标系 */
  const centerOf = (letter: string) => {
    const el = boxRefs.current.get(letter);
    if (!el) return [0, 0];
    const r = el.getBoundingClientRect();
    const svg = document.querySelector('svg.lines');
    if (!svg) return [0, 0];
    const svgRect = svg.getBoundingClientRect();

    // 修正为相对于 SVG 的坐标
    return [r.left + r.width / 2 - svgRect.left, r.top + r.height / 2 - svgRect.top];
  };

  /* ---------------- 拖拽逻辑 ---------------- */
  // PointerDown：记录起点
  const onPointerDown = (letter: string) => (e: React.PointerEvent) => {
    e.preventDefault(); // 防止默认行为
    setDragStart(letter);
    setTempPos(null);
  };

  // PointerUp：如果松手时在另一格子上则建立连线
  const onPointerUp = (letter: string) => (e: React.PointerEvent) => {
    e.preventDefault(); // 防止默认行为
    if (dragStart && dragStart !== letter) {
      const newPairs = [...plugPairs, { from: dragStart, to: letter }, { from: letter, to: dragStart }];
      onPlugPairsChange(newPairs);
    }
    setDragStart(null);
    setTempPos(null);
  };

  /* ---- 全局监听 pointermove / pointerup 以便拖到空白也能取消 ---- */
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragStart) {
        const svg = document.querySelector("svg.lines");
        if (!svg) return;
        const svgRect = svg.getBoundingClientRect();

        // 修正为相对于 SVG 的坐标
        setTempPos([e.clientX - svgRect.left, e.clientY - svgRect.top]);
      }
    };
    const up = () => {
      setDragStart(null);
      setTempPos(null);
    };

    if (dragStart) {
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    }
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragStart]);

  /* ---------------- 画线 ---------------- */
  const renderLines = () => {
    const lines = plugPairs.map(({ from, to }, i) => {
      const [x1, y1] = centerOf(from);
      const [x2, y2] = centerOf(to);
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          className="solid"
        />
      );
    });

    // 临时预览线
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

        <div className="grid">
          {alphabet.map((ch) => (
            <div
              key={ch}
              ref={(el) => {
                if (el) {
                  boxRefs.current.set(ch, el);
                }
              }}
              className="box"
              onPointerDown={onPointerDown(ch)}
              onPointerUp={onPointerUp(ch)}
              onClick={removePair1(ch)}
            >
              {ch}
            </div>
          ))}
        </div>
      </div>
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