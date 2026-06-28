import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import DepartmentIcon from '@mui/icons-material/AccountBalance';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { StatusPill } from '../components/shared/StatusPill';
import { CategoryBadge } from '../components/shared/CategoryBadge';
import { PriorityGauge } from '../components/shared/PriorityGauge';
import type { Issue, Comment } from '../types/issue';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data } = await supabase.from('issues').select('*').eq('id', id).maybeSingle();
      if (data) setIssue(data as Issue);

      const { data: coms } = await supabase.from('comments').select('*').eq('issue_id', id).order('created_at');
      if (coms) setComments(coms as Comment[]);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`issue-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'issues', filter: `id=eq.${id}` }, (payload) => {
        setIssue(payload.new as Issue);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `issue_id=eq.${id}` }, (payload) => {
        setComments(prev => [...prev, payload.new as Comment]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [id]);

  const submitComment = async () => {
    if (!newComment.trim() || !id) return;
    const { data: user } = await supabase.auth.getUser();
    await supabase.from('comments').insert({
      issue_id: id,
      user_id: user.user?.id ?? null,
      body: newComment.trim(),
      is_official: false,
    });
    setNewComment('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (!issue) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>Issue not found</Typography>
        <Button onClick={() => navigate('/feed')} sx={{ mt: 2 }}>Back to Feed</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ color: 'text.secondary', mb: 2, '&:hover': { color: 'text.primary' } }}
      >
        Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <CategoryBadge category={issue.category} />
          <StatusPill status={issue.status} />
          {issue.urgency === 'critical' || issue.urgency === 'high' ? <StatusPill urgency={issue.urgency} /> : null}
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5, lineHeight: 1.3 }}>
          {issue.title}
        </Typography>

        {issue.ai_summary && (
          <Card sx={{ mb: 2, borderColor: 'rgba(124,58,237,0.2)' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: 'primary.light', fontWeight: 600, fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                AI SUMMARY
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                {issue.ai_summary}
              </Typography>
            </CardContent>
          </Card>
        )}

        {issue.media_urls?.[0] && (
          <Box
            component="img"
            src={issue.media_urls[0]}
            alt={issue.title}
            sx={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: '16px', mb: 2, opacity: 0.9 }}
          />
        )}

        {/* Stats grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1.5, mb: 3 }}>
          {[
            { label: 'Department', value: issue.department ?? '—', icon: <DepartmentIcon sx={{ fontSize: 14 }} /> },
            { label: 'Location', value: issue.address ?? '—', icon: <LocationOnOutlinedIcon sx={{ fontSize: 14 }} /> },
            { label: 'Estimated ETA', value: issue.estimated_eta ?? '—', icon: <ScheduleIcon sx={{ fontSize: 14 }} /> },
            { label: 'Reported', value: timeAgo(issue.created_at), icon: <AccessTimeIcon sx={{ fontSize: 14 }} /> },
          ].map(({ label, value, icon }) => (
            <Card key={label}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, color: 'text.disabled' }}>
                  {icon}
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>{label}</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.82rem' }}>
                  {value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Priority + Votes */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2, display: 'flex', gap: 3, alignItems: 'center', '&:last-child': { pb: 2 } }}>
            <Box sx={{ textAlign: 'center' }}>
              <PriorityGauge score={issue.priority_score} size={64} />
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block', mt: 0.5 }}>
                PRIORITY
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#7c3aed' }}>{issue.upvotes}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                  <ThumbUpOutlinedIcon sx={{ fontSize: 12 }} />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Upvotes</Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>{issue.verified_count}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                  <VerifiedOutlinedIcon sx={{ fontSize: 12 }} />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Verified</Typography>
                </Box>
              </Box>
              {issue.confidence && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                    {Math.round(issue.confidence * 100)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>AI Confidence</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CommentOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Comments ({comments.length})
              </Typography>
            </Box>

            {comments.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.disabled', mb: 2 }}>
                No comments yet.
              </Typography>
            )}

            {comments.map((comment) => (
              <Box key={comment.id} sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {comment.is_official && (
                  <Chip label="Official Response" size="small" sx={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#6ee7b7', mb: 0.5, fontSize: '0.65rem' }} />
                )}
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, fontSize: '0.875rem' }}>
                  {comment.body}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                  {timeAgo(comment.created_at)}
                </Typography>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submitComment(); } }}
              />
              <Button variant="contained" size="small" onClick={() => void submitComment()} disabled={!newComment.trim()}>
                Post
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}
