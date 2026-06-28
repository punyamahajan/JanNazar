import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import { motion } from 'framer-motion';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import SpeedIcon from '@mui/icons-material/Speed';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { supabase } from '../lib/supabase';
import { IssueCard } from '../components/issue/IssueCard';
import type { Issue } from '../types/issue';

const FEATURES = [
  { icon: <AutoAwesomeIcon />, title: 'Autonomous AI Agents', desc: 'Speech, vision, classification, dedup, routing, and priority agents work in parallel — you see their reasoning live.', color: '#7c3aed' },
  { icon: <VisibilityOutlinedIcon />, title: 'Live Chain-of-Thought', desc: 'Watch every agent think in real time. Not a progress bar — actual AI reasoning streaming to your screen.', color: '#3b82f6' },
  { icon: <AccountTreeOutlinedIcon />, title: 'DAG Pipeline', desc: 'Speech and Vision run in parallel. Classification and Dedup run in parallel. The orchestrator manages the dependency graph.', color: '#10b981' },
  { icon: <MapOutlinedIcon />, title: 'Live Civic Map', desc: 'Heatmap of all civic issues across the city. Real-time updates via Supabase Realtime as new issues come in.', color: '#f59e0b' },
  { icon: <SmartToyOutlinedIcon />, title: 'CivicGPT', desc: 'Ask anything about civic data in natural language. RAG-powered answers with source citations from real issues.', color: '#ec4899' },
  { icon: <VerifiedOutlinedIcon />, title: 'Community Intelligence', desc: 'Citizens verify issues, vote on priority, and confirm resolutions. Trust scores grow with civic participation.', color: '#f97316' },
];

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h3" sx={{ fontWeight: 800, color, lineHeight: 1, mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
        {label}
      </Typography>
    </Box>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, open: 0 });

  useEffect(() => {
    async function load() {
      const { data: issues } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      if (issues) setRecentIssues(issues as Issue[]);

      const { data: all } = await supabase.from('issues').select('status');
      if (all) {
        setStats({
          total: all.length,
          resolved: all.filter(i => i.status === 'resolved').length,
          open: all.filter(i => i.status === 'open').length,
        });
      }
    }
    load();

    const channel = supabase
      .channel('landing-issues')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'issues' }, (payload) => {
        setRecentIssues(prev => [payload.new as Issue, ...prev.slice(0, 5)]);
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  return (
    <Box>
      {/* Hero */}
      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: 8, textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Chip
            label="AI-Powered Civic Intelligence"
            size="small"
            icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important' }} />}
            sx={{
              mb: 3,
              backgroundColor: 'rgba(124,58,237,0.15)',
              color: '#a78bfa',
              border: '1px solid rgba(124,58,237,0.3)',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
              fontWeight: 800,
              lineHeight: 1.1,
              mb: 2,
              background: 'linear-gradient(135deg, #ffffff 30%, rgba(124,58,237,0.8) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            जन<span style={{ color: '#7c3aed' }}>नज़र</span>
          </Typography>

          <Typography
            variant="h5"
            sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: { xs: '0.8rem', md: '1rem' } }}
          >
            AI Powered Civic Intelligence Platform
          </Typography>

          <Typography
            variant="body1"
            sx={{ maxWidth: 600, mx: 'auto', mb: 5, mt: 2, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontSize: '1.05rem' }}
          >
            Report civic issues with voice, photos, or text — and watch autonomous AI agents process, classify, and route them to the right department in real time.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate('/report')}
              sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
            >
              Report an Issue
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<MapOutlinedIcon />}
              onClick={() => navigate('/map')}
              sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
            >
              View Live Map
            </Button>
          </Box>
        </motion.div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <Box
            sx={{
              mt: 8,
              p: 3,
              borderRadius: '20px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 4, md: 8 },
              flexWrap: 'wrap',
            }}
          >
            <StatCard value={stats.total.toString()} label="Total Issues Reported" color="#7c3aed" />
            <StatCard value={stats.resolved.toString()} label="Issues Resolved" color="#10b981" />
            <StatCard value={stats.open.toString()} label="Open Issues" color="#f59e0b" />
            <StatCard value="8.5" label="Avg. Resolution Days" color="#3b82f6" />
          </Box>
        </motion.div>
      </Container>

      {/* Features */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
          Not a complaint app. An AI system.
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', mb: 5, color: 'text.secondary' }}>
          Every report flows through a DAG of autonomous agents. Their thinking is visible. Their work is auditable.
        </Typography>
        <Grid container spacing={2}>
          {FEATURES.map((f, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card sx={{ p: 2.5, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ color: f.color, '& svg': { fontSize: 22 } }}>{f.icon}</Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                      {f.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65, fontSize: '0.85rem' }}>
                    {f.desc}
                  </Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Recent Issues */}
      {recentIssues.length > 0 && (
        <Container maxWidth="lg" sx={{ pb: 10 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Live from the City
            </Typography>
            <Button variant="text" onClick={() => navigate('/feed')} sx={{ color: 'primary.main', fontSize: '0.85rem' }}>
              View All →
            </Button>
          </Box>
          <Grid container spacing={2}>
            {recentIssues.slice(0, 6).map((issue) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={issue.id}>
                <IssueCard issue={issue} compact />
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* CTA */}
      <Box sx={{ backgroundColor: 'rgba(124,58,237,0.06)', borderTop: '1px solid rgba(124,58,237,0.1)', borderBottom: '1px solid rgba(124,58,237,0.1)', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <SpeedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Your city. Your AI. Your data.
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
            JanNazar makes civic intelligence transparent. Every agent explains itself. Every decision is logged. Every citizen is heard.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/report')}
            sx={{ px: 5, py: 1.5 }}
          >
            Start Reporting
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
