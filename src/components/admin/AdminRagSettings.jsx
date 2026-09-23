import React, { useState } from 'react';
import { Sliders, Cpu, Shield, Save, CheckCircle2, RotateCcw } from 'lucide-react';
import useSafeTimeout from '../../hooks/useSafeTimeout';

export default function AdminRagSettings() {
  const [topK, setTopK] = useState(4);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.78);
  const [chunkSize, setChunkSize] = useState(512);
  const [aiModel, setAiModel] = useState('GPT-4o Academic Fine-tune');
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(1024);

  // Access control toggles
  const [studentAccess, setStudentAccess] = useState(true);
  const [facultyAccess, setFacultyAccess] = useState(true);
  const [adminAccess, setAdminAccess] = useState(true);

  // Knowledge sources toggles
  const [enableSyllabus, setEnableSyllabus] = useState(true);
  const [enablePYQs, setEnablePYQs] = useState(true);
  const [enableFacultyResources, setEnableFacultyResources] = useState(true);
  const [enableLectureNotes, setEnableLectureNotes] = useState(true);

  const [saved, setSaved] = useState(false);
  const setSafeTimeout = useSafeTimeout();

  const handleSave = () => {
    setSaved(true);
    setSafeTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            RAG & AI Configuration Settings
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tune retrieval parameters, model weights, and role-based knowledge access
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSave} className="btn btn-primary">
            {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
            <span>{saved ? 'Settings Synced' : 'Save Configurations'}</span>
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '24px'
      }}>
        {/* Section 1: Retrieval Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Sliders size={16} color="var(--primary-blue)" />
              <span>Retrieval Parameters</span>
            </h3>
            <span className="badge badge-blue">Vector Search</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            {/* Top K */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Top-K Retrieved Documents
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-blue)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {topK} Chunks
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary-blue)' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Determines how many chunks are fed into the prompt context for synthesis.
              </p>
            </div>

            {/* Similarity Threshold */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Cosine Similarity Cutoff Threshold
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-blue)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {similarityThreshold}
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.01"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary-blue)' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Chunks below this threshold will be filtered out to eliminate irrelevant citations.
              </p>
            </div>

            {/* Chunk Size */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Document Chunk Partition Size
              </label>
              <select
                className="input-field"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
              >
                <option value="256">256 Tokens (Precise, Fine-grained)</option>
                <option value="512">512 Tokens (Recommended Standard)</option>
                <option value="1024">1024 Tokens (Broad Context)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: AI Model Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Cpu size={16} color="var(--purple)" />
              <span>AI Synthesis Model Settings</span>
            </h3>
            <span className="badge badge-purple">LLM Provider</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Core Language Model
              </label>
              <select
                className="input-field"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
              >
                <option value="GPT-4o Academic Fine-tune">GPT-4o (GMRIT Autonomous Custom Weights)</option>
                <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (High Accuracy Derivations)</option>
                <option value="Llama 3.3 70B Private On-Premise">Llama 3.3 70B (GMRIT Campus Server)</option>
              </select>
            </div>

            {/* Temperature */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Temperature (Factuality vs Creativity)
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {temperature} (Strict Academic)
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--purple)' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Lower values guarantee deterministic, factually grounded answers from course syllabi.
              </p>
            </div>

            {/* Max Output Length */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Maximum Response Length
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {maxTokens} Tokens
                </span>
              </div>
              <input
                type="range"
                min="512"
                max="2048"
                step="128"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--purple)' }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Role-Based Access Control */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Shield size={16} color="var(--pastel-orange-text)" />
              <span>Role-Based Access Control</span>
            </h3>
            <span className="badge badge-orange">Permission Matrix</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Student Access</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Can query enrolled subjects and syllabus materials</p>
              </div>
              <input
                type="checkbox"
                checked={studentAccess}
                onChange={(e) => setStudentAccess(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-blue)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Faculty Access</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Full query access plus cohort analytics and question generators</p>
              </div>
              <input
                type="checkbox"
                checked={facultyAccess}
                onChange={(e) => setFacultyAccess(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-blue)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Admin Command Privileges</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Vector inspection, document deletion, and index re-building</p>
              </div>
              <input
                type="checkbox"
                checked={adminAccess}
                onChange={(e) => setAdminAccess(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-blue)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Grounding Knowledge Sources */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <CheckCircle2 size={16} color="#059669" />
              <span>Grounding Knowledge Sources</span>
            </h3>
            <span className="badge badge-green">4 Active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Official Course Syllabi</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>BOS approved handouts (R20/R23)</p>
              </div>
              <input
                type="checkbox"
                checked={enableSyllabus}
                onChange={(e) => setEnableSyllabus(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Previous Year Question Papers (PYQs)</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SEE & Mid exam papers from 2020-2025</p>
              </div>
              <input
                type="checkbox"
                checked={enablePYQs}
                onChange={(e) => setEnablePYQs(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Faculty-Uploaded Lecture Notes</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Annotated derivations and slides</p>
              </div>
              <input
                type="checkbox"
                checked={enableFacultyResources}
                onChange={(e) => setEnableFacultyResources(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Lab Manuals & Code Templates</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Verified practical solutions</p>
              </div>
              <input
                type="checkbox"
                checked={enableLectureNotes}
                onChange={(e) => setEnableLectureNotes(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
