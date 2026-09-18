import React from 'react';
import { X, User, Mail, Shield, BookOpen, Award, CheckCircle, Calendar, Hash, Building } from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose, currentUser, activeRole }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.4)' }}>
      <div 
        className="modal-content"
        style={{
          maxWidth: '520px',
          padding: 0,
          overflow: 'hidden',
          background: '#FFFFFF',
          borderRadius: '14px',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.15)',
          border: '1px solid var(--border-light)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with clean vibrant gradient */}
        <div style={{
          height: '96px',
          background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Profile Avatar & Title */}
        <div style={{ padding: '0 24px 24px', marginTop: '-35px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
              border: '3px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}>
              {currentUser.avatar}
            </div>

            <span className={`badge ${
              activeRole === 'student' ? 'badge-blue' :
              activeRole === 'faculty' ? 'badge-green' : 'badge-purple'
            }`} style={{ textTransform: 'capitalize', fontSize: '11.5px', padding: '3px 10px' }}>
              {activeRole} Profile
            </span>
          </div>

          <h2 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {currentUser.name}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {currentUser.designation || currentUser.program + ' in ' + currentUser.department}
          </p>

          {/* Key Attribute Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '20px',
            padding: '16px',
            background: '#F8FAFC',
            borderRadius: '10px',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hash size={14} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Identifier / Roll No</p>
                <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {currentUser.rollNumber || currentUser.employeeId || currentUser.userId || 'GMR-ADM-001'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building size={14} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Department</p>
                <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentUser.department}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={14} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GMRIT Email</p>
                <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentUser.email}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={14} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Academic Cycle</p>
                <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentUser.academicYear || '2025-2026 Active'}
                </p>
              </div>
            </div>
          </div>

          {/* Role specific highlight */}
          {activeRole === 'student' && (
            <div style={{
              marginTop: '16px',
              padding: '14px 16px',
              background: 'var(--pastel-blue-bg)',
              border: '1px solid var(--pastel-blue-border)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--primary-blue)', fontWeight: 700, textTransform: 'uppercase' }}>CURRENT CGPA</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{currentUser.cgpa}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: 'var(--primary-blue)', fontWeight: 700, textTransform: 'uppercase' }}>ATTENDANCE STATUS</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>{currentUser.attendanceStatus} ({currentUser.attendance}%)</p>
              </div>
            </div>
          )}

          {activeRole === 'faculty' && (
            <div style={{
              marginTop: '16px',
              padding: '14px 16px',
              background: 'var(--pastel-green-bg)',
              border: '1px solid var(--pastel-green-border)',
              borderRadius: '10px'
            }}>
              <p style={{ fontSize: '11.5px', color: 'var(--pastel-green-text)', fontWeight: 700, textTransform: 'uppercase' }}>TEACHING ASSIGNMENTS (R20 REGULATION)</p>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px', fontWeight: 500 }}>
                Machine Learning (20CS401) • Artificial Intelligence (20CS602) • Deep Learning Elective
              </p>
            </div>
          )}

          {activeRole === 'admin' && (
            <div style={{
              marginTop: '16px',
              padding: '14px 16px',
              background: 'var(--pastel-orange-bg)',
              border: '1px solid var(--pastel-orange-border)',
              borderRadius: '10px'
            }}>
              <p style={{ fontSize: '11.5px', color: 'var(--pastel-orange-text)', fontWeight: 700, textTransform: 'uppercase' }}>ADMINISTRATIVE PRIVILEGES</p>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px', fontWeight: 500 }}>
                Full Control • User Provisioning • RAG Vector Pipeline Ingestion • Global Audit Logs
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ background: '#F8FAFC', borderTop: '1px solid var(--border-light)' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
