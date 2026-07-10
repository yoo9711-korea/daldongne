'use client';

import { useState, type CSSProperties } from 'react';

type Props = {
  label: string;
  title: string;
  description: string;
  steps: string[];
  note?: string;
};

export default function PageGuideBox({
  label,
  title,
  description,
  steps,
  note,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section style={boxStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={labelStyle}>{label}</p>

          <h2 style={titleStyle}>{title}</h2>

          <p style={descriptionStyle}>{description}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          style={helpButtonStyle}
        >
          ? 처음이라면
        </button>
      </div>

      {isOpen ? (
        <div style={detailStyle}>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 14,
              fontWeight: 900,
              color: '#9a6a24',
            }}
          >
            이용 순서
          </p>

          <ol
            style={{
              margin: 0,
              paddingLeft: 20,
              display: 'grid',
              gap: 8,
              color: '#4f4032',
              fontSize: 14,
              lineHeight: 1.7,
              fontWeight: 700,
            }}
          >
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          {note ? <p style={noteStyle}>{note}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

const boxStyle: CSSProperties = {
  margin: '0 0 28px',
  padding: 24,
  borderRadius: 28,
  border: '1px solid #ead7b7',
  background: '#fffaf0',
  boxShadow: '0 14px 34px rgba(80, 55, 20, 0.08)',
};

const labelStyle: CSSProperties = {
  margin: '0 0 8px',
  color: '#9a6a24',
  fontSize: 14,
  fontWeight: 900,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'Noto Serif KR, serif',
  fontSize: 28,
  lineHeight: 1.35,
  letterSpacing: '-0.04em',
  color: '#24170f',
};

const descriptionStyle: CSSProperties = {
  margin: '12px 0 0',
  color: '#6b5a46',
  fontSize: 16,
  lineHeight: 1.75,
};

const helpButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 40,
  padding: '0 16px',
  borderRadius: 999,
  border: '1px solid #c18a23',
  background: '#f3d28a',
  color: '#24170f',
  fontSize: 14,
  fontWeight: 900,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const detailStyle: CSSProperties = {
  marginTop: 18,
  padding: 18,
  borderRadius: 20,
  border: '1px solid #e1c99f',
  background: '#fffdf6',
};

const noteStyle: CSSProperties = {
  margin: '14px 0 0',
  padding: 14,
  borderRadius: 16,
  background: '#f7eddc',
  color: '#5a3a18',
  fontSize: 13,
  lineHeight: 1.7,
  fontWeight: 800,
};