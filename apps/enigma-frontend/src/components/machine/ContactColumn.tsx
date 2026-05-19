import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './ContactColumn.css';

export type ColumnId = 'PB' | 'R3' | 'R2' | 'R1' | 'UKW';

export interface ContactColumnHandle {
  getPoint(side: 'L' | 'R', i: number): { x: number; y: number };
}

interface ContactColumnProps {
  id: ColumnId;
  x: number;
  width: number;
  contactsTop: number;
  contactsHeight: number;
  mapping: number[];
  leftLabels: string[];
  rightLabels?: string[];
  /* Wire-roll offset in row units (rotor columns only). */
  rollRows?: number;
  /* Disable the roll transition for the instant-offset frame. */
  rollInstant?: boolean;
  /* This column's rotor stepped this round (drives the step-time highlight). */
  active?: boolean;
  onContactHover?: (side: 'L' | 'R', i: number) => void;
  onContactLeave?: () => void;
}

const DOT_R = 3;
const HIT_R = 11;
const EDGE = 13;
/* Extra wrapped rows above/below so the periodic wire bundle rolls seamlessly. */
const WRAP = 3;

const ContactColumn = forwardRef<ContactColumnHandle, ContactColumnProps>(
  (
    {
      id,
      x,
      width,
      contactsTop,
      contactsHeight,
      mapping,
      leftLabels,
      rightLabels,
      rollRows = 0,
      rollInstant = false,
      active = false,
      onContactHover,
      onContactLeave,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const isReflector = id === 'UKW';
    /* Rotor columns (R1/R2/R3) get the periodic, rollable wire bundle. */
    const isRotor = !isReflector && id !== 'PB';
    const rowH = contactsHeight / 26;
    const leftX = x + EDGE;
    const rightX = x + width - EDGE;
    const yOf = (i: number) => contactsTop + rowH * (i + 0.5);

    useImperativeHandle(
      ref,
      () => ({
        getPoint: (side, i) => ({
          x: side === 'L' ? leftX : rightX,
          y: yOf(i),
        }),
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [leftX, rightX, contactsTop, rowH]
    );

    /* Static intra-column wires */
    const wires = useMemo(() => {
      const out: React.ReactNode[] = [];
      if (isReflector) {
        for (let i = 0; i < 26; i++) {
          const j = mapping[i];
          if (j <= i) continue;
          const y1 = yOf(i);
          const y2 = yOf(j);
          const bulge = leftX + Math.min(38, width * 0.55);
          out.push(
            <path
              key={`a${i}`}
              d={`M ${leftX} ${y1} C ${bulge} ${y1} ${bulge} ${y2} ${leftX} ${y2}`}
              className="cc-wire cc-wire--ukw"
            />
          );
        }
      } else if (isRotor) {
        /* Periodic bundle: rows -WRAP..25+WRAP, period 26. Each wire keeps a
           fixed row delta so wrapped copies stay parallel — translating by
           one rowH then clipping gives a seamless roll. */
        for (let i = -WRAP; i < 26 + WRAP; i++) {
          const m = ((i % 26) + 26) % 26;
          const d = mapping[m] - m;
          out.push(
            <line
              key={`w${i}`}
              x1={leftX}
              y1={yOf(i)}
              x2={rightX}
              y2={yOf(i + d)}
              className="cc-wire"
            />
          );
        }
      } else {
        for (let i = 0; i < 26; i++) {
          const j = mapping[i];
          const plugged = id === 'PB' && j !== i;
          out.push(
            <line
              key={`w${i}`}
              x1={leftX}
              y1={yOf(i)}
              x2={rightX}
              y2={yOf(j)}
              className={`cc-wire${plugged ? ' cc-wire--plugged' : ''}`}
            />
          );
        }
      }
      return out;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isReflector, isRotor, mapping, leftX, rightX, contactsTop, rowH, width]);

    const rows = Array.from({ length: 26 }, (_, i) => i);

    return (
      <g className="cc-group" data-col={id}>
        {isRotor && (
          <clipPath id={`cc-clip-${id}`}>
            <rect
              x={x}
              y={contactsTop - 4}
              width={width}
              height={contactsHeight + 8}
            />
          </clipPath>
        )}
        <rect
          x={x}
          y={contactsTop - 4}
          width={width}
          height={contactsHeight + 8}
          rx={6}
          className="cc-bg"
        />
        <g clipPath={isRotor ? `url(#cc-clip-${id})` : undefined}>
          <g
            className={`cc-wires${active ? ' cc-wires--active' : ''}${
              rollInstant ? ' cc-wires--instant' : ''
            }`}
            transform={
              isRotor ? `translate(0 ${rollRows * rowH})` : undefined
            }
          >
            {wires}
          </g>
        </g>

        {/* Left contacts + labels */}
        {rows.map((i) => (
          <g key={`L${i}`}>
            <circle cx={leftX} cy={yOf(i)} r={DOT_R} className="cc-dot" />
            <text
              x={leftX + 7}
              y={yOf(i)}
              className="cc-label"
              dominantBaseline="middle"
            >
              {leftLabels[i]}
            </text>
          </g>
        ))}

        {/* Right contacts + labels */}
        {!isReflector &&
          rows.map((i) => (
            <g key={`R${i}`}>
              <circle cx={rightX} cy={yOf(i)} r={DOT_R} className="cc-dot" />
              {rightLabels && (
                <text
                  x={rightX - 7}
                  y={yOf(i)}
                  className="cc-label"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {rightLabels[i]}
                </text>
              )}
            </g>
          ))}

        {/* Hit areas (tab-focusable / hoverable) */}
        {rows.map((i) => (
          <circle
            key={`HL${i}`}
            cx={leftX}
            cy={yOf(i)}
            r={HIT_R}
            className="cc-hit"
            tabIndex={0}
            role="button"
            aria-label={t('contact.aria.left', { id, label: leftLabels[i] })}
            onMouseEnter={() => onContactHover?.('L', i)}
            onMouseLeave={onContactLeave}
            onFocus={() => onContactHover?.('L', i)}
            onBlur={onContactLeave}
          />
        ))}
        {!isReflector &&
          rows.map((i) => (
            <circle
              key={`HR${i}`}
              cx={rightX}
              cy={yOf(i)}
              r={HIT_R}
              className="cc-hit"
              tabIndex={0}
              role="button"
              aria-label={t('contact.aria.right', {
                id,
                label: rightLabels ? rightLabels[i] : '',
              })}
              onMouseEnter={() => onContactHover?.('R', i)}
              onMouseLeave={onContactLeave}
              onFocus={() => onContactHover?.('R', i)}
              onBlur={onContactLeave}
            />
          ))}
      </g>
    );
  }
);

ContactColumn.displayName = 'ContactColumn';

export default ContactColumn;
