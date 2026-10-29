import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, BookOpen, FileText, HelpCircle, User, Cpu, X, ArrowRight, 
  Sparkles, Code2, Terminal, UserCheck, CheckCircle2, Award, ChevronRight, Hash 
} from 'lucide-react';
import academicDataService from '../../services/academicDataService';
import ragDocumentService from '../../services/ragDocumentService';
import authService from '../../services/authService';
import { codingProblemsList } from '../../data/codingData';
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

  // Aggregate searchable items categorized
  const categorizedResults = useMemo(() => {
    const subjectsCategory = [];
    const codingCategory = [];
    const pyqCategory = [];
    const resourcesCategory = [];
    const directoryCategory = [];

    // 1. Subjects
    subjects.forEach(s => {
      const name = s.name || '';
      const code = s.code || '';
      if (!query || name.toLowerCase().includes(query) || code.toLowerCase().includes(query)) {
        subjectsCategory.push({
          id: `sub_${s.id}`,
          category: 'Subjects',
          title: name,
          subtitle: `${code} • Credits: ${s.credits || 3}`,
          icon: BookOpen,
          badge: code,
          action: () => {
            onNavigate('subjects');
            onClose();
          }
        });
      }
    });

    // 2. Coding Practice Problems
    codingProblemsList.forEach(p => {
      const title = p.title || '';
      const topic = p.topic || '';
      const diff = p.difficulty || '';
      if (!query || title.toLowerCase().includes(query) || topic.toLowerCase().includes(query) || diff.toLowerCase().includes(query)) {
        codingCategory.push({
          id: `prob_${p.id}`,
          category: 'Practice',
          title: title,
          subtitle: `${topic} • Acceptance: ${p.acceptance || '75%'}`,
          icon: Code2,
          badge: diff,
          action: () => {
            onNavigate('coding-practice');
            onClose();
          }
        });
      }
    });

    // 3. Documents & PYQs
    documents.forEach(d => {
      const title = d.title || d.document || d.fileName || '';
      const subj = d.subject || '';
      const type = (d.documentType || '').toLowerCase();
      if (!query || title.toLowerCase().includes(query) || subj.toLowerCase().includes(query) || type.includes(query)) {
        const item = {
          id: `doc_${d.id}`,
          category: type === 'pyq' ? 'PYQs' : 'Resources',
          title: title,
          subtitle: `${subj} • ${d.status || 'Indexed in RAG'}`,
          icon: type === 'pyq' ? HelpCircle : FileText,
          badge: type === 'pyq' ? 'Exam Paper' : 'Syllabus',
          action: () => {
            if (type === 'pyq') onNavigate('pyqs');
            else if (type === 'syllabus') onNavigate('syllabus');
            else onNavigate('resources');
            onClose();
          }
        };

        if (type === 'pyq') pyqCategory.push(item);
        else resourcesCategory.push(item);
      }
    });

    // 4. Directory Roster (Faculty/Admin only)
    if (activeRole === 'faculty' || activeRole === 'admin') {
      users.forEach(u => {
        const name = u.name || u.full_name || '';
        const id = u.userId || u.email || '';
        if (!query || name.toLowerCase().includes(query) || id.toLowerCase().includes(query)) {
          directoryCategory.push({
            id: `usr_${u.id || u.userId}`,
            category: 'Directory',
            title: `${name}`,
            subtitle: `${u.department || 'CSE'} • ${u.role || 'Member'} • ${id}`,
            icon: User,
            badge: u.role || 'User',
            action: () => {
              if (activeRole === 'admin') onNavigate('users');
              else onNavigate('students');
              onClose();
            }
          });
        }
      });
    }

    // 5. Coding Practice & Assessments Navigation Items
    const navCategory = [];
    if (!query || 'coding practice problems leetcode dsa'.includes(query) || query.includes('cod')) {
      navCategory.push({
        id: 'nav_coding_practice',
        category: 'Quick Navigation',
        title: 'Coding Practice & Problem Solving',
        subtitle: 'Problem sets • Compiler Sandbox',
        icon: Code2,
        action: () => {
          onNavigate('coding-practice');
          onClose();
        }
      });
    }

    if (activeRole !== 'faculty' && (!query || 'coding assessments exams test quiz practical'.includes(query) || query.includes('assess'))) {
      navCategory.push({
        id: 'nav_coding_assessments',
        category: 'Quick Navigation',
        title: 'Coding Assessments & Examinations',
        subtitle: 'Autonomous Semester Exam Environment',
        icon: Terminal,
        action: () => {
          onNavigate('coding-assessments');
          onClose();
        }
      });
    }

    if (activeRole === 'admin' && (!query || 'faculty assignments classes sections scheduler teaching'.includes(query) || query.includes('fac') || query.includes('assign'))) {
      navCategory.push({
        id: 'nav_faculty_assignments',
        category: 'Quick Navigation',
        title: 'Faculty Assignments',
        subtitle: 'Assign faculty members to subjects, classes, and sections',
        icon: UserCheck,
        action: () => {
          onNavigate('faculty-assignments');
          onClose();
        }
      });
    }

    return [
      ...(navCategory.length > 0 ? [{ name: 'Quick Navigation', items: navCategory }] : []),
      { name: 'Subjects', items: subjectsCategory.slice(0, 4) },
      { name: 'Coding Practice Problems', items: codingCategory.slice(0, 5) },
      { name: 'Previous Questions (PYQs)', items: pyqCategory.slice(0, 3) },
      { name: 'Syllabus & Resources', items: resourcesCategory.slice(0, 3) },
      ...(directoryCategory.length > 0 ? [{ name: 'Institutional Directory', items: directoryCategory.slice(0, 4) }] : [])
    ].filter(g => g.items.length > 0);
  }, [query, subjects, documents, users, activeRole, onNavigate, onClose]);

  // Flattened list for keyboard selection
  const flatResults = useMemo(() => {
    return categorizedResults.flatMap(g => g.items);
  }, [categorizedResults]);

  if (!isOpen) return null;

  const handleInputKeyDown = (e) => {
    if (flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        flatResults[selectedIndex].action();
      } else if (searchQuery.length > 2 && onOpenRagQuery && activeRole !== 'faculty') {
        onOpenRagQuery(searchQuery);
        onClose();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.55)' }}>
      <div 
        className="modal-content"
        style={{
          maxWidth: '680px',
          padding: 0,
          overflow: 'hidden',
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          border: '1px solid rgba(226, 232, 240, 0.9)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-light)',
          background: '#FFFFFF'
        }}>
          <Search size={19} color="var(--primary-blue)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search subjects, problems, notes, PYQs, people..."
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
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontFamily: 'inherit',
              fontWeight: 500
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            >
              <X size={16} />
            </button>
          )}
          <span style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-light)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 700
          }}>
            ESC
          </span>
        </div>

        {/* AI Query Prompt Trigger (Students & Admin only) */}
        {searchQuery.length > 2 && activeRole !== 'faculty' && (
          <div
            onClick={() => {
              if (onOpenRagQuery) onOpenRagQuery(searchQuery);
              onClose();
            }}
            style={{
              padding: '11px 22px',
              background: '#FFF7ED',
              borderBottom: '1px solid #FED7AA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFEDD5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFF7ED'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: '#9A3412', fontWeight: 600 }}>
              <Sparkles size={16} color="#EA580C" />
              <span>Ask GMRIT AI Copilot: <strong style={{ color: '#7C2D12' }}>"{searchQuery}"</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#EA580C', fontWeight: 700 }}>
              <span>Press Enter</span>
              <ArrowRight size={13} />
            </div>
          </div>
        )}

        {/* Categorized Results List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '10px 14px' }}>
          {flatResults.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Search size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                No matching results found
              </p>
              <p style={{ fontSize: '12.5px', margin: 0 }}>
                Try searching for "Arrays", "Algorithms", "Machine Learning", "PYQ", or ask the AI Copilot.
              </p>
            </div>
          ) : (
            categorizedResults.map((group) => (
              <div key={group.name} style={{ marginBottom: '14px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: 'var(--text-muted)',
                  padding: '4px 10px 6px'
                }}>
                  {group.name}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {group.items.map((item) => {
                    const globalIdx = flatResults.findIndex(r => r.id === item.id);
                    const isSelected = selectedIndex === globalIdx;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={item.action}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? 'var(--pastel-blue-bg)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.12s ease'
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                          <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            backgroundColor: isSelected ? '#DBEAFE' : 'var(--bg-canvas)',
                            border: '1px solid var(--border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSelected ? 'var(--primary-blue)' : 'var(--text-secondary)',
                            flexShrink: 0
                          }}>
                            <Icon size={15} />
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: isSelected ? 'var(--primary-blue)' : 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.subtitle}
                            </div>
                          </div>
                        </div>

                        {item.badge && (
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: isSelected ? '#FFFFFF' : 'var(--bg-canvas)',
                            color: isSelected ? 'var(--primary-blue)' : 'var(--text-secondary)',
                            border: '1px solid var(--border-light)',
                            flexShrink: 0,
                            marginLeft: '10px'
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div style={{
          padding: '10px 18px',
          borderTop: '1px solid var(--border-light)',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11.5px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span><kbd style={{ padding: '1px 5px', borderRadius: '3px', background: '#FFFFFF', border: '1px solid var(--border-light)' }}>↑</kbd> <kbd style={{ padding: '1px 5px', borderRadius: '3px', background: '#FFFFFF', border: '1px solid var(--border-light)' }}>↓</kbd> to navigate</span>
            <span><kbd style={{ padding: '1px 5px', borderRadius: '3px', background: '#FFFFFF', border: '1px solid var(--border-light)' }}>↵</kbd> to select</span>
          </div>
          <span>GMRIT Academic Search Engine</span>
        </div>
      </div>
    </div>
  );
}
