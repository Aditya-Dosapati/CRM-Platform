import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, BookOpen, FileText, HelpCircle, User, Cpu, X, ArrowRight, Sparkles, Code2, Terminal } from 'lucide-react';
import academicDataService from '../../services/academicDataService';
import ragDocumentService from '../../services/ragDocumentService';
import authService from '../../services/authService';
import useEscapeKey from '../../hooks/useEscapeKey';

export default function CommandPalette({ isOpen, onClose, onNavigate, onOpenRagQuery, activeRole = 'student' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const inputRef = useRef(null);

  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      
      // Load live searchable items
      Promise.all([
        academicDataService.getSubjects(),
        ragDocumentService.getDocuments(),
        Promise.resolve(authService.getAllUsers())
      ]).then(([subRes, docRes, userList]) => {
        setSubjects(subRes?.data || []);
        setDocuments(docRes?.data || []);
        setUsers(Array.isArray(userList) ? userList : []);
      }).catch(err => {
        console.warn('Error loading command palette data:', err);
      });

      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const query = searchQuery.toLowerCase().trim();

  // Aggregate searchable items with useMemo to avoid re-indexing on every render
  const results = useMemo(() => {
    const items = [];

    // 1. Subjects (Visible to all)
    subjects.forEach(s => {
      const name = s.name || '';
      const code = s.code || '';
      if (!query || name.toLowerCase().includes(query) || code.toLowerCase().includes(query)) {
        items.push({
          id: `sub_${s.id}`,
          type: 'Subject',
          title: name,
          subtitle: `${code} • Credits: ${s.credits || 3}`,
          icon: BookOpen,
          action: () => {
            onNavigate('subjects');
            onClose();
          }
        });
      }
    });

    // 2. RAG Documents & PYQs (Visible to all)
    documents.forEach(d => {
      const title = d.title || d.document || d.fileName || '';
      const subj = d.subject || '';
      const type = d.documentType || 'Document';
      if (!query || title.toLowerCase().includes(query) || subj.toLowerCase().includes(query) || type.toLowerCase().includes(query)) {
        items.push({
          id: `doc_${d.id}`,
          type: type === 'pyq' ? 'PYQ Exam Paper' : type === 'syllabus' ? 'Syllabus Document' : 'Academic Resource',
          title: title,
          subtitle: `${subj} • ${d.status || 'Indexed'}`,
          icon: type === 'pyq' ? HelpCircle : FileText,
          action: () => {
            if (type === 'pyq') onNavigate('pyqs');
            else if (type === 'syllabus') onNavigate('syllabus');
            else onNavigate('resources');
            onClose();
          }
        });
      }
    });

    // 3. Students & Faculty Roster - RESTRICTED: Faculty and Admin only
    if (activeRole === 'faculty' || activeRole === 'admin') {
      users.forEach(u => {
        const name = u.name || u.full_name || '';
        const id = u.userId || u.email || '';
        if (!query || name.toLowerCase().includes(query) || id.toLowerCase().includes(query)) {
          items.push({
            id: `usr_${u.id || u.userId}`,
            type: `${u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'User'} Record`,
            title: `${name} (${id})`,
            subtitle: `${u.department || 'CSE'} • ${u.role || 'User'}`,
            icon: User,
            action: () => {
              if (activeRole === 'admin') onNavigate('users');
              else onNavigate('students');
              onClose();
            }
          });
        }
      });
    }

    // 4. Coding Practice & Assessments Navigation Items
    if (!query || 'coding practice problems leetcode dsa'.includes(query) || query.includes('cod')) {
      items.push({
        id: 'nav_coding_practice',
        type: 'Academic Module',
        title: 'Coding Practice & Problem Solving',
        subtitle: 'Problem sets • Compiler Sandbox',
        icon: Code2,
        action: () => {
          onNavigate('coding-practice');
          onClose();
        }
      });
    }

    if (!query || 'coding assessments exams test quiz practical'.includes(query) || query.includes('assess')) {
      items.push({
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

    return items;
  }, [query, subjects, documents, users, activeRole, onNavigate, onClose]);

  if (!isOpen) return null;

  const handleInputKeyDown = (e) => {
    const cappedLength = Math.min(results.length, 10);
    if (cappedLength === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % cappedLength);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + cappedLength) % cappedLength);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const topResults = results.slice(0, 10);
      if (topResults[selectedIndex]) {
        topResults[selectedIndex].action();
      } else if (searchQuery.length > 3 && onOpenRagQuery) {
        onOpenRagQuery(searchQuery);
        onClose();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)', background: 'rgba(43, 33, 24, 0.4)' }}>
      <div 
        className="modal-content"
        style={{
          maxWidth: '640px',
          padding: 0,
          overflow: 'hidden',
          background: 'var(--color-surface)',
          borderRadius: '14px',
          boxShadow: '0 20px 45px -10px rgba(43, 33, 24, 0.15)',
          border: '1px solid var(--color-border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)'
        }}>
          <Search size={18} color="var(--color-primary)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a subject, syllabus topic, roll number, or question..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text)',
              fontSize: '15px',
              fontFamily: 'inherit',
              fontWeight: 500
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--color-text)', opacity: 0.6, cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
          <span style={{
            fontSize: '11px',
            color: 'var(--color-text)',
            opacity: 0.7,
            fontFamily: 'JetBrains Mono, monospace',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
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
              background: 'var(--color-bg)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.18s var(--ease-spring)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--color-primary)" />
              <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}>
                Ask GMRIT RAG AI: "{searchQuery}"
              </span>
            </div>
            <ArrowRight size={14} color="var(--color-primary)" />
          </div>
        )}

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '10px' }} role="listbox">
          {results.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--color-text)', opacity: 0.7 }}>
              <p style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>No academic records found</p>
              <p style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.6 }}>Try searching "Machine Learning", "Data Structures", or course codes</p>
            </div>
          ) : (
            results.slice(0, 10).map((res, index) => {
              const Icon = res.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={res.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={res.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--color-bg)' : 'transparent',
                    border: isSelected ? '1px solid var(--color-border)' : '1px solid transparent',
                    transition: 'all 0.18s var(--ease-spring)'
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    transition: 'transform 0.2s var(--ease-spring)'
                  }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {res.title}
                      </span>
                      <span className="badge badge-gray" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {res.type}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.6, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {res.subtitle}
                    </p>
                  </div>
                  <ArrowRight size={14} color="var(--color-text)" style={{ opacity: 0.5 }} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--color-text)',
          opacity: 0.8
        }}>
          <span>Navigate with mouse or keyboard</span>
          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>GMRIT Semantic AI Search</span>
        </div>
      </div>
    </div>
  );
}
