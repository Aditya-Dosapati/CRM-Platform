import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Download, ShieldCheck, Cpu, Loader2, 
  ExternalLink, AlertCircle, RefreshCw, BookOpen, User 
} from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import ragDocumentService from '../../services/ragDocumentService';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export default function SourceViewerModal({ isOpen, onClose, source }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const activeBlobUrlRef = React.useRef(null);

  useEscapeKey(onClose, isOpen && Boolean(source));

  const loadDocumentUrl = React.useCallback(async () => {
    if (!source) return;
    setIsLoading(true);
    setError(null);

    // Clean up previous blob URL if any
    if (activeBlobUrlRef.current) {
      try {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      } catch (e) {}
      activeBlobUrlRef.current = null;
    }

    try {
      const targetPath = source.storagePath || source.storage_path || source.doc || source.fileName;

      // 1. If source already has a direct blob URL
      if (source.url && source.url.startsWith('blob:')) {
        setPdfUrl(source.url);
        setIsLoading(false);
        return;
      }

      // 2. Fetch reliable PDF Blob from ragDocumentService
      const blob = await ragDocumentService.getDocumentBlob(targetPath, source.id, source);

      if (blob && (blob instanceof Blob || typeof blob.arrayBuffer === 'function')) {
        const objectUrl = URL.createObjectURL(blob);
        activeBlobUrlRef.current = objectUrl;
        setPdfUrl(objectUrl);
        setIsLoading(false);
        return;
      }

      throw new Error('Unable to retrieve document content from storage.');
    } catch (err) {
      console.error('[SourceViewerModal] Failed to load PDF preview:', err);
      setError(err.message || 'Unable to load the requested document preview.');
      setIsLoading(false);
    }
  }, [source]);

  useEffect(() => {
    if (isOpen && source) {
      loadDocumentUrl();
    } else {
      setPdfUrl(null);
      setError(null);
      if (activeBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(activeBlobUrlRef.current);
        } catch (e) {}
        activeBlobUrlRef.current = null;
      }
    }

    return () => {
      if (activeBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(activeBlobUrlRef.current);
        } catch (e) {}
        activeBlobUrlRef.current = null;
      }
    };
  }, [isOpen, source, loadDocumentUrl]);

  const handleDownload = async () => {
    if (!source) return;
    setIsDownloading(true);
    try {
      const targetPath = source.storagePath || source.storage_path || source.doc || source.fileName;
      const fileName = source.fileName || (source.title ? `${source.title}.pdf` : 'document.pdf');
      await ragDocumentService.downloadDocument(targetPath, fileName, source);
    } catch (err) {
      alert(`Download Failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen || !source) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div 
        className="modal-content large"
        style={{ 
          padding: 0, 
          overflow: 'hidden', 
          maxWidth: '960px', 
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              color: 'var(--color-primary, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FileText size={20} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h3 style={{ 
                fontSize: '15px', 
                fontWeight: 800, 
                color: '#0f172a', 
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {source.title || source.fileName || source.doc || 'Verified Academic Document'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                <span>Official GMRIT Autonomous Curriculum</span>
                {source.subject && <span>• {source.subject}</span>}
                {source.uploaderName && <span>• By {source.uploaderName}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button 
              id="source-viewer-download-btn"
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
            </button>

            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-subtle btn-sm"
                title="Open in new browser tab"
                style={{ padding: '6px 8px' }}
              >
                <ExternalLink size={14} />
              </a>
            )}

            <button
              onClick={onClose}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#64748b', 
                cursor: 'pointer', 
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close Preview (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div style={{ 
          flex: 1, 
          backgroundColor: '#1e293b', 
          position: 'relative', 
          minHeight: '60vh',
          maxHeight: '75vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: '#ffffff',
              gap: '12px'
            }}>
              <Loader2 size={32} className="animate-spin" style={{ color: '#818cf8' }} />
              <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600 }}>
                Loading verified academic document from secure storage...
              </p>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: '#ffffff',
              padding: '30px',
              textAlign: 'center',
              gap: '14px'
            }}>
              <AlertCircle size={36} color="#ef4444" />
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700 }}>
                  Unable to Load Document Preview
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', maxWidth: '440px' }}>
                  {error}
                </p>
              </div>
              <button 
                onClick={loadDocumentUrl}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} />
                <span>Retry Loading</span>
              </button>
            </div>
          ) : pdfUrl ? (
            <iframe
              id="source-viewer-pdf-frame"
              src={pdfUrl}
              title={source.title || 'Document Preview'}
              style={{
                width: '100%',
                height: '100%',
                flex: 1,
                border: 'none',
                backgroundColor: '#ffffff'
              }}
            />
          ) : null}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} />
              Verified Authentic
            </span>
            <span>Document File: <strong>{source.fileName || source.doc || 'document.pdf'}</strong></span>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
