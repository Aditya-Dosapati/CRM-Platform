import React from 'react';
import { Search } from 'lucide-react';

/**
 * Reusable EmptyState component for lists, tables, and search views.
 * Strictly complies with the minimal 6-color academic system.
 */
export default function EmptyState({
  icon: Icon = Search,
  title = "No records found",
  description = "Try adjusting your search criteria or filters.",
  message,
  actionText,
  onAction,
  isTableRow = false,
  colSpan = 6
}) {
  const displayDesc = message || description;

  const content = (
    <div style={{
      textAlign: 'center',
      padding: isTableRow ? '36px 20px' : '48px 24px',
      maxWidth: '380px',
      margin: '0 auto'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-muted)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 14px'
      }}>
        <Icon size={22} color="var(--color-primary)" />
      </div>

      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
        {displayDesc}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="btn btn-secondary btn-sm"
          style={{ marginTop: '16px' }}
        >
          {actionText}
        </button>
      )}
    </div>
  );

  if (isTableRow) {
    return (
      <tr>
        <td colSpan={colSpan} style={{ borderBottom: 'none', backgroundColor: 'transparent' }}>
          {content}
        </td>
      </tr>
    );
  }

  return content;
}

