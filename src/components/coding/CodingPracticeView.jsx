import React, { useState } from 'react';
import {
  Code2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Flame,
  Search,
  Filter,
  Layers,
  FileText,
  GitCommit,
  GitFork,
  Share2,
  ArrowUpDown,
  Repeat,
  Grid,
  Zap,
  Hash,
  Box,
  Database,
  Cpu,
  Trophy,
  Award,
  ChevronRight,
  Play,
  RotateCcw,
  Check,
  AlignLeft,
  X
} from 'lucide-react';
import {
  supportedLanguagesList,
  studentCodingKPIs,
  codingTopicCategories,
  codingProblemsList,
  codingLeaderboardData,
  codingAchievements
} from '../../data/codingData.js';
import CodingWorkspaceModal from './CodingWorkspaceModal.jsx';

export default function CodingPracticeView({ onOpenRagQuery }) {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Active workspace modal state
  const [activeProblem, setActiveProblem] = useState(null);

  // Tabs for sub-views
  const [activeViewTab, setActiveViewTab] = useState('problems'); // 'problems' | 'leaderboard' | 'achievements'

  // Filter logic
  const filteredProblems = codingProblemsList.filter(p => {
    if (selectedDifficulty !== 'all' && p.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) {
      return false;
    }
    if (selectedTopic !== 'all' && p.topic.toLowerCase() !== selectedTopic.toLowerCase()) {
      return false;
    }
    if (selectedStatus !== 'all' && p.status.toLowerCase() !== selectedStatus.toLowerCase()) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q);
    }
    return true;
  });

  const getTopicIcon = (iconName) => {
    switch (iconName) {
      case 'Layers': return <Layers size={16} />;
      case 'FileText': return <FileText size={16} />;
      case 'GitCommit': return <GitCommit size={16} />;
      case 'GitFork': return <GitFork size={16} />;
      case 'Share2': return <Share2 size={16} />;
      case 'ArrowUpDown': return <ArrowUpDown size={16} />;
      case 'Search': return <Search size={16} />;
      case 'Repeat': return <Repeat size={16} />;
      case 'Grid': return <Grid size={16} />;
      case 'Zap': return <Zap size={16} />;
      case 'Hash': return <Hash size={16} />;
      case 'Box': return <Box size={16} />;
      case 'Database': return <Database size={16} />;
      default: return <Code2 size={16} />;
    }
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '22px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span className="badge badge-blue" style={{ fontSize: '11px', padding: '2px 8px' }}>
              ONLINE JUDGE & SANDBOX
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>C, C++, Java, Python, JS, R, Ruby</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Coding Practice
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Build your programming skills through hands-on problems and challenges.
          </p>
        </div>

        {/* View Switchers: Problems, Leaderboard, Achievements */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveViewTab('problems')}
            className={`btn ${activeViewTab === 'problems' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12.5px' }}
          >
            <Code2 size={14} />
            <span>Problem Library</span>
          </button>
          <button
            onClick={() => setActiveViewTab('leaderboard')}
            className={`btn ${activeViewTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12.5px' }}
          >
            <Trophy size={14} />
            <span>Leaderboard</span>
          </button>
          <button
            onClick={() => setActiveViewTab('achievements')}
            className={`btn ${activeViewTab === 'achievements' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12.5px' }}
          >
            <Award size={14} />
            <span>Badges</span>
          </button>
        </div>
      </div>

      {/* 4 Colorful KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '26px'
      }}>
        {/* Solved Card */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--pastel-blue-bg)',
            color: 'var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Code2 size={20} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Problems Solved</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {studentCodingKPIs.problemsSolved}
            </div>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
              {studentCodingKPIs.solvedThisMonth}
            </span>
          </div>
        </div>

        {/* Attempted Card */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--pastel-purple-bg)',
            color: 'var(--pastel-purple-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Problems Attempted</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {studentCodingKPIs.problemsAttempted}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Across 12 topics
            </span>
          </div>
        </div>

        {/* Success Rate Card */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--pastel-green-bg)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Success Rate</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {studentCodingKPIs.successRate}
            </div>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
              Top 10% in CSE Section A
            </span>
          </div>
        </div>

        {/* Streak Card */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--pastel-orange-bg)',
            color: 'var(--pastel-orange-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flame size={20} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Current Streak</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {studentCodingKPIs.currentStreak} days 🔥
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Longest: {studentCodingKPIs.longestStreak} days
            </span>
          </div>
        </div>
      </div>

      {/* VIEW 1: PROBLEMS & TOPICS */}
      {activeViewTab === 'problems' && (
        <>
          {/* Topic Categories Cards Slider/Grid */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Problem Categories ({codingTopicCategories.length})
              </h3>
              {selectedTopic !== 'all' && (
                <button
                  onClick={() => setSelectedTopic('all')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear topic filter ({selectedTopic})
                </button>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              {codingTopicCategories.map(cat => {
                const isSelected = selectedTopic.toLowerCase() === cat.name.toLowerCase();
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedTopic(isSelected ? 'all' : cat.name)}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: isSelected ? 'var(--pastel-blue-bg)' : '#FFFFFF',
                      border: isSelected ? '1px solid var(--primary-blue)' : '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.18s var(--ease-spring)',
                      boxShadow: isSelected ? 'var(--shadow-xs)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--pastel-blue-border)';
                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                      }
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-light)';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }
                      e.currentTarget.style.transform = 'none';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: cat.color }}>{getTopicIcon(cat.icon)}</span>
                        <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>{cat.name}</strong>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {cat.percentage}%
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {cat.solved} / {cat.problems} Solved
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: '100%', height: '4px', backgroundColor: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${cat.percentage}%`,
                        height: '100%',
                        backgroundColor: cat.percentage > 70 ? '#10B981' : cat.percentage > 40 ? '#3B82F6' : '#F59E0B'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search problems by name or concept (e.g. Two Sum, Substring, Graph)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                />
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Language Filter */}
                <select
                  className="input-field"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  style={{ width: '115px', height: '38px', fontSize: '12px', padding: '4px 6px' }}
                >
                  <option value="all">Language: All</option>
                  {supportedLanguagesList.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>

                {/* Difficulty Filter */}
                <select
                  className="input-field"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  style={{ width: '125px', height: '38px', fontSize: '12px', padding: '4px 6px' }}
                >
                  <option value="all">Difficulty: All</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                {/* Status Filter */}
                <select
                  className="input-field"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ width: '135px', height: '38px', fontSize: '12px', padding: '4px 6px' }}
                >
                  <option value="all">Status: All</option>
                  <option value="solved">✓ Solved</option>
                  <option value="attempted">Attempted</option>
                  <option value="not attempted">Not Attempted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Problem List Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '13px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</th>
                    <th style={{ padding: '13px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Problem Title</th>
                    <th style={{ padding: '13px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Difficulty</th>
                    <th style={{ padding: '13px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Topic</th>
                    <th style={{ padding: '13px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Acceptance</th>
                    <th style={{ padding: '13px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Attempts</th>
                    <th style={{ padding: '13px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center' }}>
                        <div style={{ maxWidth: '340px', margin: '0 auto' }}>
                          <Code2 size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px', display: 'block' }} />
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            No problems match your filters
                          </h4>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                            Try adjusting your search query, difficulty, or topic filters.
                          </p>
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedDifficulty('all');
                              setSelectedTopic('all');
                              setSelectedStatus('all');
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            Clear All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProblems.map(p => {
                      const isSolved = p.status === 'Solved';
                      const isAttempted = p.status === 'Attempted';
                      const diffColor =
                        p.difficulty === 'Easy' ? '#059669' :
                        p.difficulty === 'Medium' ? '#EA580C' : '#DC2626';

                      return (
                        <tr
                          key={p.id}
                          style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background-color 0.16s ease, transform 0.16s ease' }}
                          onClick={() => setActiveProblem(p)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td style={{ padding: '13px 18px', width: '60px' }}>
                            {isSolved && (
                              <span title="Solved" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--pastel-green-bg)', color: 'var(--success)' }}>
                                <Check size={13} strokeWidth={3} />
                              </span>
                            )}
                            {isAttempted && (
                              <span title="Attempted" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--pastel-orange-bg)', color: 'var(--pastel-orange-text)' }}>
                                <Clock size={13} />
                              </span>
                            )}
                            {!isSolved && !isAttempted && (
                              <span title="Not Attempted" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#F1F5F9', color: 'var(--text-muted)', fontSize: '10px' }}>
                                •
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '13px 18px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                              {p.title}
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Time limit: {p.timeLimit} • Memory: {p.memoryLimit}
                            </span>
                          </td>

                          <td style={{ padding: '13px 18px' }}>
                            <span style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: diffColor
                            }}>
                              {p.difficulty}
                            </span>
                          </td>

                          <td style={{ padding: '13px 18px' }}>
                            <span className="badge badge-blue" style={{ fontSize: '11px', padding: '2px 7px' }}>
                              {p.topic}
                            </span>
                          </td>

                          <td style={{ padding: '13px 18px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {p.acceptance}
                          </td>

                          <td style={{ padding: '13px 18px', color: 'var(--text-muted)' }}>
                            {p.attempts}
                          </td>

                          <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveProblem(p);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '11.5px', padding: '4px 10px' }}
                            >
                              <Play size={12} fill="#FFFFFF" />
                              <span>{isSolved ? 'Solve Again' : 'Solve Challenge'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: LEADERBOARD (WITH INSTITUTIONAL PRIVACY PROTECTION) */}
      {activeViewTab === 'leaderboard' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Institutional Coding Leaderboard
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Privacy Policy Enforced: Full names masked per institutional student privacy standards.
              </p>
            </div>
            <span className="badge badge-purple" style={{ fontSize: '11px', padding: '3px 8px' }}>
              Your Rank: #14 (Top 1%)
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Rank</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Student</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Department</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Problems Solved</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Points</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Current Streak</th>
                </tr>
              </thead>
              <tbody>
                {codingLeaderboardData.map(entry => (
                  <tr
                    key={entry.rank}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      backgroundColor: entry.name.includes('(You)') ? 'var(--pastel-blue-bg)' : 'transparent',
                      fontWeight: entry.name.includes('(You)') ? 700 : 500
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      {entry.rank === 1 ? '🥇 #1' : entry.rank === 2 ? '🥈 #2' : entry.rank === 3 ? '🥉 #3' : `#${entry.rank}`}
                    </td>
                    <td style={{ padding: '12px 16px', color: entry.name.includes('(You)') ? 'var(--primary-blue)' : 'var(--text-primary)' }}>
                      {entry.name}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{entry.department}</td>
                    <td style={{ padding: '12px 16px' }}>{entry.solved} solved</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{entry.points} pts</td>
                    <td style={{ padding: '12px 16px', color: '#EA580C' }}>{entry.streak} days 🔥</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: ACHIEVEMENTS & GAMIFICATION */}
      {activeViewTab === 'achievements' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Coding Milestones & Achievements
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Academic progress badges earned through continuous programming practice.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {codingAchievements.map(ach => (
              <div
                key={ach.id}
                className="card"
                style={{
                  padding: '18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  opacity: ach.unlocked ? 1 : 0.75
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: ach.unlocked ? 'var(--pastel-green-bg)' : '#F1F5F9',
                  color: ach.unlocked ? 'var(--success)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0
                }}>
                  {ach.unlocked ? <CheckCircle2 size={22} /> : <Award size={22} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {ach.title}
                    </h4>
                    {ach.unlocked ? (
                      <span className="badge badge-green" style={{ fontSize: '10px' }}>Unlocked</span>
                    ) : (
                      <span className="badge" style={{ fontSize: '10px', backgroundColor: '#F1F5F9', color: 'var(--text-muted)' }}>{ach.progress}</span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '6px' }}>
                    {ach.description}
                  </p>
                  {ach.date && (
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Earned on {ach.date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Split-Pane Workspace Modal */}
      {activeProblem && (
        <CodingWorkspaceModal
          isOpen={Boolean(activeProblem)}
          onClose={() => setActiveProblem(null)}
          problem={activeProblem}
          onProblemSolved={(probId) => {
            // mark solved in active session
            console.log(`Problem ${probId} marked solved.`);
          }}
          activeRole="student"
        />
      )}
    </div>
  );
}
