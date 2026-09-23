import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, X, Send, Bot, FileText, Cpu, CheckCircle } from 'lucide-react';
import { queryRagEngine } from '../../data/ragKnowledge';
import useEscapeKey from '../../hooks/useEscapeKey';
import useSafeTimeout from '../../hooks/useSafeTimeout';

export default function RagChatbot({
  isOpen,
  onToggle,
  initialQuery = '',
  onSelectSource,
  activeRole = 'student',
  currentUser
}) {
  const userName = currentUser?.name?.split(' ')[0] || (activeRole === 'admin' ? 'Administrator' : activeRole === 'faculty' ? 'Professor' : 'Rahul');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hello ${userName}! 👋 I am your **GMRIT AI Assistant**, your intelligent academic companion.

I can assist you with your **R20/R23 syllabus PDFs, faculty lecture notes, PYQs (2020-2025), and personal gradebook**.

What would you like to explore today?`,
      sources: [
        { title: "GMRIT R20 Academic Regulations", doc: "GMRIT_Curriculum_R20.pdf", page: 1 },
        { title: "CSE Course Catalog 2025-26", doc: "CSE_Catalog.pdf", page: 3 }
      ],
      retrievalSteps: ["Connected to GMRIT Vector Store", "Loaded active semester syllabus"]
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeStep, setActiveStep] = useState('');
  const messagesEndRef = useRef(null);
  const setSafeTimeout = useSafeTimeout();

  useEscapeKey(() => {
    if (isOpen) onToggle();
  }, isOpen);

  const sampleChips = [
    "Explain Unit 3 of Machine Learning",
    "Show important PYQs for DBMS",
    "Analyze my performance",
    "What should I study next?",
    "Explain this syllabus",
    "Find questions related to Neural Networks"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = useCallback((textToSend = inputVal) => {
    const query = typeof textToSend === 'string' ? textToSend.trim() : inputVal.trim();
    if (!query || isThinking) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsThinking(true);
    setActiveStep('Scanning GMRIT Academic Knowledge Base...');

    setSafeTimeout(() => {
      setActiveStep('Matching query vectors with course syllabi & notes...');
    }, 600);

    setSafeTimeout(() => {
      const ragResult = queryRagEngine(query, activeRole, currentUser);
      const botMsg = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: ragResult.text,
        sources: ragResult.sources,
        retrievalSteps: ragResult.retrievalSteps
      };
      setMessages(prev => [...prev, botMsg]);
      setIsThinking(false);
      setActiveStep('');
    }, 1400);
  }, [inputVal, isThinking, activeRole, currentUser, setSafeTimeout]);

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
    }
  }, [initialQuery, isOpen, handleSend]);

  return (
    <>
      {/* Floating Action Button (Clean bright blue with subtle shadow) */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '28px',
          zIndex: 900,
          backgroundColor: 'var(--primary-blue)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-full)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
          border: 'none',
          cursor: 'pointer',
          transition: 'transform var(--transition-spring), box-shadow var(--transition-spring)',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.35)';
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.94)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      >
        <Sparkles size={16} />
        <span style={{ fontWeight: 700, fontSize: '13.5px' }}>
          GMRIT AI
        </span>
      </button>

      {/* Right-Side AI Assistant Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '28px',
            width: '440px',
            maxWidth: 'calc(100vw - 40px)',
            height: '620px',
            maxHeight: 'calc(100vh - 110px)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-modal)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 950,
            overflow: 'hidden',
            animation: 'modalSlideSpring 0.25s var(--ease-spring) both'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--pastel-blue-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-blue)'
              }}>
                <Bot size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    GMRIT AI Assistant
                  </h3>
                  <span className="badge badge-blue" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                    RAG Connected
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Your academic assistant
                </p>
              </div>
            </div>

            <button
              onClick={onToggle}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backgroundColor: '#FFFFFF'
          }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '100%'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  flexDirection: m.sender === 'user' ? 'row-reverse' : 'row',
                  animation: 'messageSlideIn 0.2s var(--ease-spring) both'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    backgroundColor: m.sender === 'user' ? 'var(--pastel-blue-bg)' : '#F1F5F9',
                    color: m.sender === 'user' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    {m.sender === 'user' ? 'RK' : <Bot size={15} />}
                  </div>

                  <div style={{
                    backgroundColor: m.sender === 'user' ? 'var(--primary-blue)' : '#F8FAFC',
                    color: m.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                    border: `1px solid ${m.sender === 'user' ? 'var(--primary-blue)' : 'var(--border-light)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 14px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    maxWidth: '340px'
                  }}>
                    <div 
                      dangerouslySetInnerHTML={{
                        __html: m.text
                          .replace(/\n\n/g, '<br/><br/>')
                          .replace(/\n/g, '<br/>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/### (.*?)(<br\/>|$)/g, '<div style="font-weight:800; color:' + (m.sender === 'user' ? '#FFFFFF' : '#111827') + '; margin-bottom:4px; font-size:13.5px;">$1</div>')
                          .replace(/#### (.*?)(<br\/>|$)/g, '<div style="font-weight:700; color:' + (m.sender === 'user' ? '#FFFFFF' : '#374151') + '; margin-top:6px; margin-bottom:2px;">$1</div>')
                      }}
                    />

                    {/* Verified Sources References */}
                    {m.sources && m.sources.length > 0 && (
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '8px',
                        borderTop: '1px solid #E2E8F0'
                      }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--primary-blue)',
                          display: 'block',
                          marginBottom: '4px'
                        }}>
                          📄 Sources:
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {m.sources.map((src, sIdx) => (
                            <div
                              key={sIdx}
                              onClick={() => onSelectSource && onSelectSource(src)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid var(--border-light)',
                                fontSize: '11.5px',
                                color: 'var(--primary-blue)',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--pastel-blue-bg)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                            >
                              <span>{src.title}</span>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>View ↗</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                <Cpu size={14} className="spin" color="var(--primary-blue)" />
                <span>{activeStep}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Example Suggestions Chips */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {sampleChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'transform var(--transition-spring), border-color var(--transition-smooth), color var(--transition-smooth), background-color var(--transition-smooth), box-shadow var(--transition-spring)',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-blue)';
                  e.currentTarget.style.color = 'var(--primary-blue)';
                  e.currentTarget.style.backgroundColor = 'var(--pastel-blue-bg)';
                  e.currentTarget.style.transform = 'translateY(-1.5px)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(37, 99, 235, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-1.5px)'}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="Ask about Unit 3, exam questions, or performance..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '9px 12px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color var(--transition-smooth), box-shadow var(--transition-smooth)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary-blue)';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-light)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputVal.trim() || isThinking}
              className="btn btn-primary btn-sm"
              style={{ opacity: (!inputVal.trim() || isThinking) ? 0.5 : 1 }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
