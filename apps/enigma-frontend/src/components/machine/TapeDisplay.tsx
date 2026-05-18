import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyOutput = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Stay silent when the clipboard is unavailable. */
    }
  };

  return (
    <section className="tape-display">
      <div className="tape">
        <span className="tape-label engrave">{t('tape.input.label')}</span>
        <div className="tape-strip tape-strip--in">
          {inputText ? (
            <span className="tape-text">{group5(inputText)}</span>
          ) : (
            <span className="tape-empty">{t('tape.input.empty')}</span>
          )}
        </div>
      </div>

      <div className="tape">
        <div className="tape-label-row">
          <span className="tape-label engrave">{t('tape.output.label')}</span>
          <button
            type="button"
            className="tape-copy focus-brass"
            onClick={copyOutput}
            disabled={!outputText}
          >
            {copied ? t('tape.copy.done') : t('tape.copy.idle')}
          </button>
        </div>
        <div className="tape-strip tape-strip--out">
          {outputText ? (
            <span className="tape-text">{group5(outputText)}</span>
          ) : (
            <span className="tape-empty">{t('tape.output.empty')}</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default TapeDisplay;
