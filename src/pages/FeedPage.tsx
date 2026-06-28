import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { IssueCard } from '../components/issue/IssueCard';
import type { Issue } from '../types/issue';

export function FeedPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('issues').select('*').order('created_at', { ascending: false }).limit(50);
      if (data) setIssues(data as Issue[]);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel('feed-issues')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'issues' }, (payload) => {
        setIssues(prev => [payload.new as Issue, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'issues' }, (payload) => {
        setIssues(prev => prev.map(i => i.id === (payload.new as Issue).id ? payload.new as Issue : i));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 2s infinite' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Community Feed</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Live stream of civic issues — updates in real time.
        </Typography>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Box sx={{ height: 220, borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          <AnimatePresence>
            {issues.map((issue) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={issue.id}>
                <IssueCard issue={issue} />
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}
    </Container>
  );
}
