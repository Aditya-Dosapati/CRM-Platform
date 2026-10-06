import React from 'react';
import { ChevronDown, ChevronRight, BookOpen, Layers, Sparkles, CheckCircle2, Award, Briefcase } from 'lucide-react';
import SubjectCard from './SubjectCard';

export default function SemesterAccordion({
  semesterData,
  isOpen,
  onToggle,
  isFSI = false,
  selectedCareerPath = 'all',
  onAskAi
}) {
  if (!semesterData) return null;

  const { semester, title, description, subjects = [], careerPathSubjects = [], electiveGroups = [], fsiConfig } = semesterData;

  // Filter career path subjects based on selectedCareerPath
  const filteredCareerPaths = careerPathSubjects.filter(sub => {
    if (selectedCareerPath === 'all') return true;
    return sub.careerPathId === selectedCareerPath;
  });

  // Calculate total visible subjects in this semester
  let subjectCount = subjects.length + filteredCareerPaths.length;
  if (electiveGroups.length > 0) {
    electiveGroups.forEach(g => {
      subjectCount += (g.options?.length || 0);
    });
  }
  if (fsiConfig) {
    if (isFSI && fsiConfig.fsiSubject) {
      subjectCount += 1;
    } else if (!isFSI) {
      if (fsiConfig.nonFsiCareerPathSubjects) {
        const visibleNonFsi = fsiConfig.nonFsiCareerPathSubjects.filter(sub =>
          selectedCareerPath === 'all' || sub.careerPathId === selectedCareerPath
        );
        subjectCount += visibleNonFsi.length;
      } else if (fsiConfig.nonFsiElectiveGroup?.options) {
        subjectCount += fsiConfig.nonFsiElectiveGroup.options.length;
      }
    }
  }

  return (
    <div
      className="card"
      style={{
        marginBottom: '14px',
        padding: 0,
        overflow: 'hidden',
        border: isOpen ? '1px solid var(--primary-blue)' : '1px solid var(--border-light)',
        boxShadow: isOpen ? 'var(--shadow-sm)' : 'none',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Accordion Header / Toggle */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: isOpen ? 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)' : '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isOpen ? 'var(--pastel-blue-bg)' : '#F1F5F9',
              color: isOpen ? 'var(--primary-blue)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '13px'
            }}
          >
            S{semester}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0
                }}
              >
                {title}
              </h2>

              <span className="badge badge-gray" style={{ fontSize: '11px', fontWeight: 600 }}>
                {subjectCount} {subjectCount === 1 ? 'Subject' : 'Subjects'}
              </span>

              {semester === 7 && (
                <span className={`badge ${isFSI ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: '10.5px' }}>
                  {isFSI ? 'FSI Track Active' : 'Non-FSI Track Active'}
                </span>
              )}
            </div>

            {description && (
              <p
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  margin: '3px 0 0 0'
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600 }}>
            {isOpen ? 'Collapse' : 'Expand'}
          </span>
          {isOpen ? <ChevronDown size={18} color="var(--primary-blue)" /> : <ChevronRight size={18} />}
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div
          style={{
            padding: '20px 22px',
            borderTop: '1px solid var(--border-light)',
            backgroundColor: '#FAFAFC',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* SECTION 1: Core Subjects & Labs */}
          {subjects.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <BookOpen size={16} color="var(--primary-blue)" />
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                  Core Technical Subjects & Laboratories
                </h4>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '12px'
                }}
              >
                {subjects.map(subject => (
                  <SubjectCard key={subject.code} subject={subject} onAskAi={onAskAi} />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: Career Path Electives (Semesters 5, 6, 7) */}
          {careerPathSubjects.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={16} color="#8B5CF6" />
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                    Career Path Elective Subjects
                  </h4>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Approved Tracks: AI & ML • Full Stack Developer • Cloud Computing
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '12px'
                }}
              >
                {filteredCareerPaths.map(subject => (
                  <SubjectCard key={subject.code} subject={subject} onAskAi={onAskAi} />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: 7th Semester FSI Logic */}
          {fsiConfig && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={16} color="var(--primary-blue)" />
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                    7th Semester Curriculum Allocation (Based on FSI Status)
                  </h4>
                </div>
                <span className={`badge ${isFSI ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '11px' }}>
                  {isFSI ? 'Student Status: FSI (Internship Track)' : 'Student Status: Non-FSI (Campus Track)'}
                </span>
              </div>

              {/* IF FSI === TRUE: Show Fundamentals of DevOps, HIDE Professional Elective V */}
              {isFSI ? (
                <div>
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--pastel-blue-bg)',
                      border: '1px solid var(--pastel-blue-border)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '12px',
                      fontSize: '12.5px',
                      color: 'var(--primary-blue)',
                      fontWeight: 600
                    }}
                  >
                    ✦ Enrolled in Full Semester Internship (FSI): Showing mandatory prerequisite <strong>Fundamentals of DevOps</strong>. Professional Elective V is not required.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                    <SubjectCard subject={fsiConfig.fsiSubject} onAskAi={onAskAi} />
                  </div>
                </div>
              ) : (
                /* IF FSI === FALSE: Show Professional Elective V, HIDE Fundamentals of DevOps */
                <div>
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '12px',
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    ✦ Non-FSI Campus Track: Showing <strong>Professional Elective V</strong> based on Career Path. Fundamentals of DevOps is scheduled for 8th Semester.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                    {fsiConfig.nonFsiCareerPathSubjects ? (
                      fsiConfig.nonFsiCareerPathSubjects
                        .filter(sub => selectedCareerPath === 'all' || sub.careerPathId === selectedCareerPath)
                        .map(option => (
                          <SubjectCard key={option.code} subject={option} onAskAi={onAskAi} />
                        ))
                    ) : (
                      (fsiConfig.nonFsiElectiveGroup?.options || []).map(option => (
                        <SubjectCard key={option.code} subject={option} onAskAi={onAskAi} />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: Professional Elective Groups (Semester 5 & 8) */}
          {electiveGroups.map(group => (
            <div key={group.groupName}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="var(--primary-blue)" />
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                    {group.groupName}
                  </h4>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {group.rule}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '12px'
                }}
              >
                {(group.options || []).map(option => (
                  <SubjectCard key={option.code} subject={option} onAskAi={onAskAi} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
