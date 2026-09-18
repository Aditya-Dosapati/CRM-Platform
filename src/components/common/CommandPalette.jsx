import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, FileText, HelpCircle, User, Cpu, X, ArrowRight, Sparkles, Code2, Terminal } from 'lucide-react';
import { academicSubjects, pyqList, facultyStudentRoster, adminRagDocuments } from '../../data/mockData';

export default function CommandPalette({ isOpen, onClose, onNavigate, onOpenRagQuery, activeRole = 'student' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const query = searchQuery.toLowerCase().trim();

  // Aggregate searchable items
  const results = [];

  // 1. Subjects (Visible to all)
  academicSubjects.forEach(s => {
    if (!query || s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query)) {
      results.push({
        id: `sub_${s.id}`,
        type: 'Subject',
        title: s.name,
        subtitle: `${s.code} • ${s.faculty}`,
        icon: BookOpen,
        action: () => {
          onNavigate('subjects');
          onClose();
        }
      });
    }
    // Search units
    s.units.forEach(u => {
      if (query && (u.title.toLowerCase().includes(query) || u.number.toLowerCase().includes(query))) {
        results.push({
          id: `unit_${s.id}_${u.number}`,
          type: 'Syllabus Unit',
          title: `${s.name}: ${u.number} — ${u.title}`,
          subtitle: `RAG Indexed (${u.ragChunks} chunks)`,
          icon: FileText,
          action: () => {
            onNavigate('syllabus');
            onClose();
          }
        });
      }
    });
  });

  // 2. PYQs (Visible to all)
  pyqList.forEach(p => {
    if (!query || p.subject.toLowerCase().includes(query) || p.examType.toLowerCase().includes(query) || p.year.includes(query)) {
      results.push({
        id: `pyq_${p.id}`,
        type: 'PYQ Exam Paper',
        title: `${p.subject} — ${p.year} ${p.examType}`,
        subtitle: `${p.regulation} Regulation • ${p.questionCount} Questions`,
        icon: HelpCircle,
        action: () => {
          onNavigate('pyqs');
          onClose();
        }
      });
    }
  });

  // 3. Students Roster - RESTRICTED: Faculty and Admin only! (Data Privacy Protection)
  if (activeRole === 'faculty' || activeRole === 'admin') {
    facultyStudentRoster.forEach(std => {
      if (!query || std.name.toLowerCase().includes(query) || std.rollNumber.toLowerCase().includes(query)) {
        results.push({
          id: `std_${std.id}`,
          type: 'Student Record',
          title: `${std.name} (${std.rollNumber})`,
          subtitle: `${std.section} • Attendance: ${std.attendance}% • Score: ${std.averageMarks}%`,
          icon: User,
          action: () => {
            onNavigate('students');
            onClose();
          }
        });
      }
    });
  }

  // 4. Admin RAG Vector Docs - RESTRICTED: Admin only!
  if (activeRole === 'admin') {
    adminRagDocuments.forEach(doc => {
      if (query && doc.document.toLowerCase().includes(query)) {
        results.push({
          id: `rag_${doc.id}`,
          type: 'RAG Knowledge Vector',
          title: doc.document,
          subtitle: `${doc.subject} • ${doc.chunks} chunks • ${doc.status}`,
          icon: Cpu,
          action: () => {
            onNavigate('rag-base');
            onClose();
          }
        });
      }
    });
  }

  // 5. Coding Practice & Assessments Navigation Items
  if (!query || 'coding practice problems leetcode dsa'.includes(query) || query.includes('cod')) {
    results.push({
      id: 'nav_coding_practice',
      type: 'Academic Module',
      title: 'Coding Practice & Problem Solving',
      subtitle: '16 topic categories • 7 languages • Isolated Sandbox',
      icon: Code2,
      action: () => {
        onNavigate('coding-practice');
        onClose();
      }
    });
  }

  if (!query || 'coding assessments exams test quiz practical'.includes(query) || query.includes('assess')) {
    results.push({
      id: 'nav_coding_assessments',
      type: 'Academic Module',
      title: 'Coding Assessments & Examinations',
      subtitle: activeRole === 'faculty' ? 'Assessment Studio & Authoring' : 'Autonomous Semester Exam Environment',
      icon: Terminal,
      action: () => {
        onNavigate('coding-assessments');
        onClose();
      }
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.4)' }}>
      <div 
        className="modal-content"
        style={{
          maxWidth: '640px',
          padding: 0,
          overflow: 'hidden',
          background: '#FFFFFF',
          borderRadius: '14px',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.15)',
          border: '1px solid var(--border-light)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-light)',
          background: '#FFFFFF'
        }}>
          <Search size={18} color="var(--primary-blue)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a subject, syllabus topic, roll number, or question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontFamily: 'inherit',
              fontWeight: 500
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
          <span style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            fontFamily: 'JetBrains Mono, monospace',
            background: '#F1F5F9',
            border: '1px solid var(--border-subtle)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 600
          }}>
            ESC
          </span>
        </div>

        {/* Quick Action Hint if search query looks like an AI question */}
        {searchQuery.length > 3 && (
          <div
            onClick={() => {
              onOpenRagQuery(searchQuery);
              onClose();
            }}
            style={{
              padding: '12px 20px',
              background: 'var(--pastel-blue-bg)',
              borderBottom: '1px solid var(--pastel-blue-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.18s var(--ease-spring)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E0F2FE';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--pastel-blue-bg)';
              e.currentTarget.style.transform = 'none';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.99)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--primary-blue)" />
              <span style={{ fontSize: '13px', color: 'var(--primary-blue)', fontWeight: 600 }}>
                Ask GMRIT RAG AI: "{searchQuery}"
              </span>
            </div>
            <ArrowRight size={14} color="var(--primary-blue)" style={{ transition: 'transform 0.18s ease' }} />
          </div>
        )}

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '10px' }}>
          {results.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>No academic records found</p>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Try searching "Machine Learning", "Data Structures", "Rahul", or "2025"</p>
            </div>
          ) : (
            results.slice(0, 10).map((res) => {
              const Icon = res.icon;
              return (
                <div
                  key={res.id}
                  onClick={res.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.18s var(--ease-spring)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'none';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.985) translateX(4px)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--pastel-blue-bg)',
                    border: '1px solid var(--pastel-blue-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-blue)',
                    transition: 'transform 0.2s var(--ease-spring)'
                  }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {res.title}
                      </span>
                      <span className="badge badge-gray" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {res.type}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {res.subtitle}
                    </p>
                  </div>
                  <ArrowRight size={14} color="var(--text-muted)" style={{ transition: 'transform 0.18s ease' }} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-light)',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <span>Navigate with mouse or keyboard</span>
          <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>GMRIT Semantic AI Search</span>
        </div>
      </div>
    </div>
  );
}
