import React, { useState } from 'react';
import './TapeDisplay.css';

interface TapeDisplayProps {
  inputText: string;
  outputText: string;
}

const group5 = (text: string): string =>
  text.replace(/(.{5})/g, '$1 ').trim();

const TapeDisplay: React.FC<TapeDisplayProps> = ({
  inputText,
  outputText,
}) => {
  const [copied, setCopied] = useState(false);

  const copyOutput = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  };

  return (
    <section className="tape-display">
      <div className="tape">
        <span className="tape-label engrave">输入 · KLARTEXT</span>
        <div className="tape-strip tape-strip--in">
          {inputText ? (
            <span className="tape-text">{group5(inputText)}</span>
          ) : (
            <span className="tape-empty">敲击键盘开始加密…</span>
          )}
        </div>
      </div>

      <div className="tape">
        <div className="tape-label-row">
          <span className="tape-label engrave">输出 · GEHEIMTEXT</span>
          <button
            type="button"
            className="tape-copy focus-brass"
            onClick={copyOutput}
            disabled={!outputText}
          >
            {copied ? '已复制' : '复制密文'}
          </button>
        </div>
        <div className="tape-strip tape-strip--out">
          {outputText ? (
            <span className="tape-text">{group5(outputText)}</span>
          ) : (
            <span className="tape-empty">密文将在此处逐字浮现…</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default TapeDisplay;
