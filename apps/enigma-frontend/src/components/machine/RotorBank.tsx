import React, { useState } from 'react';
import Rotor from './Rotor';
import Reflector from './Reflector';
import type {
  Rotor as RotorType,
  Reflector as ReflectorType,
  RotorSelection,
} from '../../services/api';
import './RotorBank.css';

interface RotorBankProps {
  rotors: RotorSelection[];
  availableRotors: RotorType[];
  selectedReflector: string;
  availableReflectors: ReflectorType[];
  onRotorChange: (slot: number, rotorIndex: string) => void;
  onPositionChange: (slot: number, position: string) => void;
  onRingSettingChange: (slot: number, ringSetting: string) => void;
  onReflectorChange: (reflector: string) => void;
}

const RotorBank: React.FC<RotorBankProps> = ({
  rotors,
  availableRotors,
  selectedReflector,
  availableReflectors,
  onRotorChange,
  onPositionChange,
  onRingSettingChange,
  onReflectorChange,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <section className={`rotor-bank mat-wood${open ? ' rotor-bank--open' : ''}`}>
      <div className="rotor-bank-rim">
        <span className="rotor-bank-title emboss">转子仓 · Walzenlage</span>
        <button
          type="button"
          className="lid-btn focus-brass"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? '合上盖板' : '掀盖 · 高级设置'}
        </button>
      </div>

      <div className="rotor-bank-tray">
        <Reflector
          selected={selectedReflector}
          available={availableReflectors}
          onChange={onReflectorChange}
        />
        {rotors.map((rotor, slot) => (
          <Rotor
            key={slot}
            slot={slot}
            rotor={rotor}
            availableRotors={availableRotors}
            showAdvanced={open}
            onRotorChange={onRotorChange}
            onPositionChange={onPositionChange}
            onRingSettingChange={onRingSettingChange}
          />
        ))}
      </div>
    </section>
  );
};

export default RotorBank;
