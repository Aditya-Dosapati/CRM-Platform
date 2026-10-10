import React from 'react';

export default function GmritLogo({ size = 'medium', showSubtitle = true, collapsed = false }) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const boxSize = isLarge ? '44px' : isSmall ? '30px' : '36px';
  const svgSize = isLarge ? '26' : isSmall ? '18' : '22';

  return (
    <div 
      className="gmrit-logo-container" 
      title={collapsed ? "GMR CRM — Academic Management Platform" : undefined}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '9px', 
        userSelect: 'none',
        minWidth: 0,
        overflow: 'hidden'
      }}
    >
      {/* Clean Modern GMRIT Emblem */}
      <div 
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle orange accent stripe */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '10px',
          height: '10px',
          background: '#EA580C',
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
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.15 }}>
            <span style={{
              fontWeight: 800,
              fontSize: isLarge ? '17px' : isSmall ? '13.5px' : '14.5px',
              letterSpacing: '-0.2px',
              color: '#111827',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              whiteSpace: 'nowrap'
            }}>
              GMR <span style={{ color: '#2563EB' }}>CRM</span>
            </span>
          </div>
          {showSubtitle && (
            <span style={{
              fontSize: '10.5px',
              fontWeight: 500,
              color: '#6B7280',
              letterSpacing: '0.1px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.25,
              marginTop: '1.5px'
            }}>
              Academic Management Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
}
