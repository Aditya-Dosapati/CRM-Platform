import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Institutional React ErrorBoundary to capture runtime UI errors gracefully
 * without crashing the entire Academic Hub interface.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for diagnostics
    if (typeof console !== 'undefined' && console.error) {
      console.error("GMRIT ErrorBoundary captured error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          width: '100%'
        }}>
          <div className="card" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '32px 28px',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            border: '1px solid #FECDD3',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FFF1F2',
              color: 'var(--error, #E11D48)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Something went wrong in this view
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              An unexpected component error occurred. The application state has been preserved.
            </p>

            {this.state.error?.message && (
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontFamily: 'JetBrains Mono, monospace',
                marginBottom: '20px',
                textAlign: 'left',
                overflowX: 'auto',
                maxHeight: '100px'
              }}>
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={14} />
              <span>Reload View</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
