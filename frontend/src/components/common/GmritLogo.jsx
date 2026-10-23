import React from 'react';

export default function GmritLogo({ size = 'medium', showSubtitle = true, collapsed = false }) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const boxSize = isLarge ? '48px' : isSmall ? '32px' : '38px';
  const svgSize = isLarge ? '30' : isSmall ? '20' : '24';

  return (
    <div className="gmrit-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      {/* Clean Modern GMRIT Emblem */}
      <div 
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)',
          boxShadow: '0 2px 10px rgba(234, 88, 12, 0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle gold accent corner */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '12px',
          height: '12px',
          background: '#F59E0B',
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
        }} />
        <svg viewBox="0 0 40 40" width={svgSize} height={svgSize}>
          {/* Hexagonal Geometry */}
          <polygon
            points="20,5 33,12 33,28 20,35 7,28 7,12"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inner Crest G */}
          <path
            d="M25 15 H16 C13.8 15 12 16.8 12 19 V21 C12 23.2 13.8 25 16 25 H24 C24.8 25 25 24.5 25 23.5 V20 H19"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="20" r="2.2" fill="#FED7AA" />
        </svg>
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontWeight: 800,
              fontSize: isLarge ? '18px' : isSmall ? '14px' : '15px',
              letterSpacing: '-0.2px',
              color: '#14171F',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              GMR <span style={{ color: '#EA580C' }}>CRM</span>
            </span>
          </div>
          {showSubtitle && (
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#6B7280',
              letterSpacing: '0.1px',
              whiteSpace: 'nowrap'
            }}>
              Academic Management Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
}
