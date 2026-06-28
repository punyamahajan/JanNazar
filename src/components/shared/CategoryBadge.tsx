import Box from '@mui/material/Box';
import type { SxProps } from '@mui/material/styles';
import type { IssueCategory } from '../../types/issue';

const CATEGORY_COLORS: Record<string, string> = {
  potholes: '#f97316',
  garbage: '#84cc16',
  streetlight: '#f59e0b',
  water: '#3b82f6',
  flood: '#0ea5e9',
  tree: '#10b981',
  animal: '#8b5cf6',
  construction: '#6366f1',
  other: 'rgba(255,255,255,0.4)',
};

const CATEGORY_LABELS: Record<string, string> = {
  potholes: 'Potholes',
  garbage: 'Garbage',
  streetlight: 'Streetlight',
  water: 'Water',
  flood: 'Flood',
  tree: 'Tree',
  animal: 'Animal',
  construction: 'Construction',
  other: 'Other',
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

interface CategoryBadgeProps {
  category: IssueCategory | string | null;
  sx?: SxProps;
}

export function CategoryBadge({ category, sx }: CategoryBadgeProps) {
  const cat = category ?? 'other';
  const color = getCategoryColor(cat);
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1,
        py: 0.25,
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        color,
        backgroundColor: `${color}20`,
        border: `1px solid ${color}30`,
        textTransform: 'capitalize',
        ...sx,
      }}
    >
      {getCategoryLabel(cat)}
    </Box>
  );
}
