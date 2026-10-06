import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, Sparkles, Filter, ChevronDown, ChevronUp, Layers, 
  GraduationCap, CheckCircle2, Briefcase, Award 
} from 'lucide-react';
import SemesterAccordion from './SemesterAccordion';
import { getSyllabusByBranch } from '../../../data/syllabus/index.js';

export default function SyllabusViewer({
  studentProfile,
  onOpenRagQuery
}) {
  const branch = studentProfile?.branch || studentProfile?.branchCode || 'CSE';

  // Load syllabus based on branch from decoupled registry
  const { syllabus, branchCode, isFallback } = useMemo(() => {
    return getSyllabusByBranch(branch);
  }, [branch]);

  // Initial state: open 1st semester or student's current semester by default
  const [openSemesters, setOpenSemesters] = useState(() => {
    const defaultSem = studentProfile?.semester || 1;
    return new Set([defaultSem]);
  });

  // Career Path filter: 'all' | 'aiml' | 'fsd' | 'cloud'
  const [selectedCareerPath, setSelectedCareerPath] = useState(
    () => studentProfile?.careerPath || 'all'
  );

  // FSI Status state: defaults to student's verified profile status, with live toggle for inspection
  const [isFSI, setIsFSI] = useState(() => Boolean(studentProfile?.isFSI));

  // Reset career path filter if invalid for active syllabus
  useEffect(() => {
    if (selectedCareerPath !== 'all') {
      const validIds = (syllabus?.careerPaths || []).map(p => p.id);
      if (!validIds.includes(selectedCareerPath)) {
        setSelectedCareerPath('all');
      }
    }
  }, [syllabus, selectedCareerPath]);

  // Toggle single semester open/close
  const toggleSemester = (semNumber) => {
    setOpenSemesters(prev => {
      const next = new Set(prev);
      if (next.has(semNumber)) {
        next.delete(semNumber);
      } else {
        next.add(semNumber);
      }
      return next;
    });
  };

  // Expand all semesters
  const expandAll = () => {
    const all = new Set((syllabus?.semesters || []).map(s => s.semester));
    setOpenSemesters(all);
  };

  // Collapse all semesters
  const collapseAll = () => {
    setOpenSemesters(new Set());
  };

  const handleAskAi = (subject) => {
    if (typeof onOpenRagQuery === 'function') {
      onOpenRagQuery(
        `Provide an overview, key exam topics, and study guide for ${subject.name} (Code: ${subject.code}, Credits: ${subject.credits || 'N/A'}) in the ${branchCode} AR23 curriculum.`
      );
    }
  };

  return (
    <div>
      {/* Top Header & Branch Identifier */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.4px',
                margin: 0
              }}
            >
              My Subjects
            </h1>
            <span className="badge badge-blue" style={{ fontSize: '12px', fontWeight: 700 }}>
              Academic Syllabus
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--primary-blue)',
                backgroundColor: 'var(--pastel-blue-bg)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--pastel-blue-border)'
              }}
            >
              <span>Branch:</span>
              <strong style={{ letterSpacing: '0.5px' }}>{branchCode}</strong>
            </div>

            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {syllabus?.branchName || 'Computer Science and Engineering'}
            </span>

            <span className="badge badge-gray" style={{ fontSize: '11px' }}>
              Regulation: {syllabus?.regulation || 'AR23'}
            </span>

            {studentProfile?.rollNumber && (
              <span className="badge badge-gray" style={{ fontSize: '11px' }}>
                Roll No: {studentProfile.rollNumber}
              </span>
            )}
          </div>
        </div>

        {/* Global Action: AI Tutor */}
        {onOpenRagQuery && (
          <button
            onClick={() => onOpenRagQuery(`Summarize the complete AR23 syllabus requirements and core subjects for ${branchCode} branch`)}
            className="btn btn-primary"
          >
            <Sparkles size={14} />
            <span>Ask AI Curriculum Tutor</span>
          </button>
        )}
      </div>

      {/* Notice if future branch fallback active */}
      {isFallback && (
        <div
          className="card"
          style={{
            padding: '12px 18px',
            backgroundColor: '#FFFBEB',
            borderColor: '#FDE68A',
            color: '#92400E',
            fontSize: '12.5px',
            marginBottom: '18px'
          }}
        >
          <strong>Notice:</strong> Specific syllabus data for <strong>{branch}</strong> is currently being prepared for the next phase. Displaying the finalized CSE academic structure as the reference curriculum.
        </div>
      )}

      {/* Control Bar: Expand/Collapse, Career Path Filter, and 7th Sem FSI Toggle */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-light)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          {/* Left Controls: Career Path Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Filter size={13} />
              Career Path:
            </span>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Paths' },
                ...(syllabus?.careerPaths || []).map(p => ({
                  id: p.id,
                  label: p.shortName || p.name
                }))
              ].map(path => (
                <button
                  key={path.id}
                  onClick={() => setSelectedCareerPath(path.id)}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: selectedCareerPath === path.id ? 700 : 500,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: selectedCareerPath === path.id ? '1px solid var(--primary-blue)' : '1px solid var(--border-light)',
                    backgroundColor: selectedCareerPath === path.id ? 'var(--pastel-blue-bg)' : '#FFFFFF',
                    color: selectedCareerPath === path.id ? 'var(--primary-blue)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {path.label}
                </button>
              ))}
            </div>
          </div>

          {/* Center/Right Controls: 7th Sem FSI Track Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Briefcase size={13} />
              7th Sem FSI Track:
            </span>

            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--bg-canvas)',
                padding: '2px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)'
              }}
            >
              <button
                onClick={() => setIsFSI(false)}
                style={{
                  fontSize: '11.5px',
                  fontWeight: !isFSI ? 700 : 500,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: !isFSI ? '#FFFFFF' : 'transparent',
                  color: !isFSI ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: !isFSI ? 'var(--shadow-xs)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Non-FSI (Elective V)
              </button>

              <button
                onClick={() => setIsFSI(true)}
                style={{
                  fontSize: '11.5px',
                  fontWeight: isFSI ? 700 : 500,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: isFSI ? 'var(--primary-blue)' : 'transparent',
                  color: isFSI ? '#FFFFFF' : 'var(--text-muted)',
                  boxShadow: isFSI ? 'var(--shadow-xs)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                FSI (DevOps)
              </button>
            </div>
          </div>

          {/* Right Controls: Expand / Collapse All */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={expandAll}
              className="btn btn-secondary btn-xs"
              style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronDown size={13} />
              <span>Expand All</span>
            </button>

            <button
              onClick={collapseAll}
              className="btn btn-subtle btn-xs"
              style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronUp size={13} />
              <span>Collapse All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accordion Semesters: 1st Semester to 8th Semester */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {(syllabus?.semesters || []).map(sem => (
          <SemesterAccordion
            key={sem.semester}
            semesterData={sem}
            isOpen={openSemesters.has(sem.semester)}
            onToggle={() => toggleSemester(sem.semester)}
            isFSI={isFSI}
            selectedCareerPath={selectedCareerPath}
            onAskAi={handleAskAi}
          />
        ))}
      </div>
    </div>
  );
}
