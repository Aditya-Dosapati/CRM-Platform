import React from 'react';
import { GraduationCap, Presentation, Shield, ArrowRight, Sparkles } from 'lucide-react';

export default function RoleSelectionCards({ onSelectRole }) {
  const roles = [
    {
      id: 'student',
      title: 'Student',
      icon: GraduationCap,
      description: 'Access your syllabus, PYQs, assessments and personalized academic performance.',
      buttonText: 'Continue as Student',
      bgColor: 'var(--pastel-blue-bg)',
      borderColor: 'var(--pastel-blue-border)',
      iconColor: 'var(--pastel-blue-text)',
      btnClass: 'btn-primary'
    },
    {
      id: 'faculty',
      title: 'Faculty',
      icon: Presentation,
      description: 'Monitor student performance, manage assessments and provide learning resources.',
      buttonText: 'Continue as Faculty',
      bgColor: 'var(--pastel-green-bg)',
      borderColor: 'var(--pastel-green-border)',
      iconColor: 'var(--pastel-green-text)',
      btnClass: 'btn-primary',
      btnStyle: { backgroundColor: '#16A34A', borderColor: '#16A34A' }
    },
    {
      id: 'admin',
      title: 'Administrator',
      icon: Shield,
      description: 'Manage users, academic content, resources and the RAG knowledge base.',
      buttonText: 'Continue as Admin',
      bgColor: 'var(--pastel-purple-bg)',
      borderColor: 'var(--pastel-purple-border)',
      iconColor: 'var(--pastel-purple-text)',
      btnClass: 'btn-primary',
      btnStyle: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }
    }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '1020px', margin: '0 auto 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Select Your Academic Portal
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Choose your role to access your personalized GMRIT workspace
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '20px'
      }}>
        {roles.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.id}
              style={{
                backgroundColor: r.bgColor,
                border: `1px solid ${r.borderColor}`,
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: r.iconColor,
                  marginBottom: '16px'
                }}>
                  <Icon size={24} />
                </div>

                <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {r.title}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, minHeight: '40px' }}>
                  {r.description}
                </p>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  onClick={() => onSelectRole(r.id)}
                  className={`btn ${r.btnClass}`}
                  style={{ width: '100%', ...(r.btnStyle || {}) }}
                >
                  <span>{r.buttonText}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
