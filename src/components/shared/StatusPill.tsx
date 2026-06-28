import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';
import type { IssueStatus, IssueUrgency } from '../../types/issue';

const STATUS_CONFIG: Record<IssueStatus, { label: string; color: string; bg: string; pulse?: boolean }> = {
  open: { label: 'Open', color: '#7c3aed', bg: 'rgba(124,58,237,0.15)' },
  in_progress: { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  resolved: { label: 'Resolved', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  closed: { label: 'Closed', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' },
  duplicate: { label: 'Duplicate', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' },
};

const URGENCY_CONFIG: Record<IssueUrgency, { label: string; color: string; bg: string; pulse?: boolean }> = {
  low: { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  high: { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', pulse: true },
};

interface StatusPillProps extends Omit<ChipProps, 'color'> {
  status?: IssueStatus;
  urgency?: IssueUrgency;
}

export function StatusPill({ status, urgency, size = 'small', ...props }: StatusPillProps) {
  const cfg = status
    ? STATUS_CONFIG[status]
    : urgency
    ? URGENCY_CONFIG[urgency]
    : null;

  if (!cfg) return null;

  return (
    <Chip
      label={cfg.label}
      size={size}
      sx={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.color}30`,
        fontWeight: 600,
        fontSize: '0.7rem',
        letterSpacing: '0.04em',
        height: 22,
        animation: cfg.pulse ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      }}
      {...props}
    />
  );
}
