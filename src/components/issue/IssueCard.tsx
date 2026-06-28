import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { motion } from 'framer-motion';
import { StatusPill } from '../shared/StatusPill';
import { CategoryBadge } from '../shared/CategoryBadge';
import { PriorityGauge } from '../shared/PriorityGauge';
import type { Issue } from '../../types/issue';

interface IssueCardProps {
  issue: Issue;
  compact?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function IssueCard({ issue, compact = false }: IssueCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        onClick={() => navigate(`/issue/${issue.id}`)}
        sx={{ cursor: 'pointer', p: 0, overflow: 'hidden' }}
      >
        {issue.media_urls?.[0] && !compact && (
          <Box
            component="img"
            src={issue.media_urls[0]}
            alt={issue.title}
            sx={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', opacity: 0.8 }}
          />
        )}
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <CategoryBadge category={issue.category} />
            <StatusPill status={issue.status} />
            {issue.urgency === 'critical' && <StatusPill urgency={issue.urgency} />}
          </Box>

          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, lineHeight: 1.4, fontSize: '0.9rem' }}>
            {issue.title}
          </Typography>

          {!compact && issue.ai_summary && (
            <Typography variant="body2" sx={{ mb: 1.5, fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {issue.ai_summary}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
            <LocationOnOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
              {issue.address ?? `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ThumbUpOutlinedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
                  {issue.upvotes}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VerifiedOutlinedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
                  {issue.verified_count}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }} />
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                  {timeAgo(issue.created_at)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PriorityGauge score={issue.priority_score} size={36} />
              <IconButton
                size="small"
                onClick={(e) => e.stopPropagation()}
                sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'primary.main' } }}
              >
                <ThumbUpOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}
