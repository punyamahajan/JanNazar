import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SvgIconComponent } from '@mui/icons-material';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: SvgIconComponent;
  color?: string;
  trend?: { value: number; label: string };
}

export function KPICard({ title, value, subtitle, icon: Icon, color = '#7c3aed', trend }: KPICardProps) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem' }}>
          {title}
        </Typography>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ fontSize: 18, color }} />
        </Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1, mb: 0.5 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
          {subtitle}
        </Typography>
      )}
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: trend.value >= 0 ? '#10b981' : '#ef4444',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
            {trend.label}
          </Typography>
        </Box>
      )}
    </Card>
  );
}
