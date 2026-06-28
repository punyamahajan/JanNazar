import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import MemoryIcon from '@mui/icons-material/Memory';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { supabase } from '../lib/supabase';
import { StatusPill } from '../components/shared/StatusPill';
import { CategoryBadge } from '../components/shared/CategoryBadge';
import { PriorityGauge } from '../components/shared/PriorityGauge';
import type { Issue } from '../types/issue';

interface AgentLog {
  id: string;
  issue_id: string;
  agent_name: string;
  thoughts: string[];
  duration_ms: number;
  created_at?: string;
}

export function AdminPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [tab, setTab] = useState<'queue' | 'logs'>('queue');

  useEffect(() => {
    supabase.from('issues').select('*').order('priority_score', { ascending: false }).then(({ data }) => {
      if (data) setIssues(data as Issue[]);
    });
  }, []);

  // Load agent logs whenever the logs tab is opened
  useEffect(() => {
    if (tab !== 'logs') return;
    setLogsLoading(true);
    supabase
      .from('agent_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setAgentLogs(data as AgentLog[]);
        setLogsLoading(false);
      });
  }, [tab]);

  const updateStatus = async (issueId: string, status: string) => {
    await supabase.from('issues').update({ status }).eq('id', issueId);
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: status as Issue['status'] } : i));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <DashboardOutlinedIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Admin Dashboard</Typography>
      </Box>

      {/* Tab */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {[
          { key: 'queue', label: 'Issues Queue', icon: <AssignmentOutlinedIcon sx={{ fontSize: 16 }} /> },
          { key: 'logs', label: 'Agent Logs', icon: <MemoryIcon sx={{ fontSize: 16 }} /> },
        ].map(t => (
          <Chip
            key={t.key}
            icon={t.icon}
            label={t.label}
            onClick={() => setTab(t.key as 'queue' | 'logs')}
            sx={{
              backgroundColor: tab === t.key ? 'rgba(124,58,237,0.2)' : 'transparent',
              color: tab === t.key ? '#a78bfa' : 'text.secondary',
              border: `1px solid ${tab === t.key ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          />
        ))}
      </Box>

      {tab === 'queue' && (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  {['Priority', 'Issue', 'Category', 'Department', 'Status', 'Votes', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ color: 'text.disabled', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {issues.slice(0, 20).map(issue => (
                  <TableRow key={issue.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <PriorityGauge score={issue.priority_score} size={32} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 240, borderColor: 'rgba(255,255,255,0.04)' }}>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {issue.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                        {issue.address?.slice(0, 40) ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <CategoryBadge category={issue.category} />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem', borderColor: 'rgba(255,255,255,0.04)' }}>
                      {issue.department?.split(' ')[0] ?? '—'}
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <StatusPill status={issue.status} />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem', borderColor: 'rgba(255,255,255,0.04)' }}>
                      {issue.upvotes}
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <Select
                        size="small"
                        value={issue.status}
                        onChange={e => void updateStatus(issue.id, e.target.value)}
                        sx={{ fontSize: '0.75rem', '& .MuiSelect-select': { py: 0.5 } }}
                      >
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 'logs' && (
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Real agent logs written to Supabase after each report submission. Expand to see reasoning traces.
          </Typography>
          {logsLoading && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>Loading agent logs…</Typography>
          )}
          {!logsLoading && agentLogs.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                No agent logs yet — submit a report to see live traces here.
              </Typography>
            </Box>
          )}
          {agentLogs.map((log) => (
            <Accordion key={log.id} sx={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', mb: 1, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}>
                <Grid container alignItems="center" spacing={2}>
                  <Grid size="auto">
                    <Chip
                      label={log.agent_name.replace('_agent', '').replace('_', ' ')}
                      size="small"
                      sx={{ backgroundColor: 'rgba(124,58,237,0.12)', color: '#a78bfa', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}
                    />
                  </Grid>
                  <Grid size="auto">
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>
                      {(log.thoughts ?? []).length} thoughts · {log.duration_ms}ms
                    </Typography>
                  </Grid>
                  <Grid size="auto">
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.68rem' }}>
                      issue: {log.issue_id?.slice(0, 8)}…
                    </Typography>
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Box sx={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.75rem', lineHeight: 1.8 }}>
                  {(log.thoughts ?? []).map((t, j) => (
                    <Box key={j} sx={{ display: 'flex', gap: 1 }}>
                      <Typography sx={{ color: 'rgba(124,58,237,0.6)', fontFamily: 'inherit', fontSize: '0.7rem' }}>
                        [{String(j + 1).padStart(2, '0')}]
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: '0.7rem' }}>
                        {t}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Container>
  );
}
