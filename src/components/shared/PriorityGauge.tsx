import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface PriorityGaugeProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

function getPriorityColor(score: number): string {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f97316';
  if (score >= 40) return '#f59e0b';
  return '#10b981';
}

export function PriorityGauge({ score, size = 60, showLabel = true }: PriorityGaugeProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getPriorityColor(score);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
        />
      </svg>
      {showLabel && (
        <Box sx={{ position: 'absolute', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color, fontWeight: 700, fontSize: '0.65rem', lineHeight: 1 }}>
            {score}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
