import { useEffect, useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from 'recharts';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { supabase } from '../lib/supabase';
import { KPICard } from '../components/analytics/KPICard';
import type { Issue, Department } from '../types/issue';

const COLORS: Record<string, string> = {
  potholes: '#f97316', garbage: '#84cc16', streetlight: '#f59e0b',
  water: '#3b82f6', flood: '#0ea5e9', tree: '#10b981', animal: '#8b5cf6',
  construction: '#6366f1', other: 'rgba(255,255,255,0.4)',
};

const CUSTOM_TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' },
  labelStyle: { color: 'rgba(255,255,255,0.7)' },
};

export function AnalyticsPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    async function load() {
      const [{ data: iss }, { data: deps }] = await Promise.all([
        supabase.from('issues').select('*'),
        supabase.from('departments').select('*').order('resolution_rate', { ascending: false }),
      ]);
      if (iss) setIssues(iss as Issue[]);
      if (deps) setDepartments(deps as Department[]);
    }
    load();
  }, []);

  const totalOpen = issues.filter(i => i.status === 'open').length;
  const resolvedThisWeek = issues.filter(i => {
    if (i.status !== 'resolved' || !i.resolved_at) return false;
    return Date.now() - new Date(i.resolved_at).getTime() < 7 * 24 * 3600000;
  }).length;

  const categoryData = Object.entries(
    issues.reduce<Record<string, number>>((acc, i) => {
      const cat = i.category ?? 'other';
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count, fill: COLORS[name] ?? '#7c3aed' })).sort((a, b) => b.count - a.count);

  // Simulated trend over 7 days
  const trendData = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      reported: Math.floor(Math.random() * 8 + 2),
      resolved: Math.floor(Math.random() * 6 + 1),
    };
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Analytics Dashboard</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        City-wide civic issue intelligence
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard title="Total Open" value={totalOpen} icon={AssignmentOutlinedIcon} color="#7c3aed" subtitle="active issues" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard title="Resolved This Week" value={resolvedThisWeek} icon={CheckCircleOutlineIcon} color="#10b981" subtitle="last 7 days" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard title="Total Reported" value={issues.length} icon={TrendingUpIcon} color="#3b82f6" subtitle="all time" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard title="Avg. Resolution" value="8.5 days" icon={AccessTimeIcon} color="#f59e0b" subtitle="department average" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Category breakdown */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>Issues by Category</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Trend */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>7-Day Trend</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                  <Line type="monotone" dataKey="reported" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Department table */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>Department Performance</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Department', 'Avg. Days', 'Resolution Rate', 'Performance'].map(h => (
                  <TableCell key={h} sx={{ color: 'text.disabled', fontSize: '0.72rem', fontWeight: 600, borderColor: 'rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.map(dept => (
                <TableRow key={dept.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 500, fontSize: '0.85rem', borderColor: 'rgba(255,255,255,0.04)' }}>
                    {dept.name}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem', borderColor: 'rgba(255,255,255,0.04)' }}>
                    {dept.avg_resolution_days?.toFixed(1) ?? '—'} days
                  </TableCell>
                  <TableCell sx={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <Typography variant="body2" sx={{ color: (dept.resolution_rate ?? 0) >= 0.8 ? '#10b981' : (dept.resolution_rate ?? 0) >= 0.6 ? '#f59e0b' : '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>
                      {dept.resolution_rate ? `${Math.round(dept.resolution_rate * 100)}%` : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ width: 140, borderColor: 'rgba(255,255,255,0.04)' }}>
                    <LinearProgress
                      variant="determinate"
                      value={(dept.resolution_rate ?? 0) * 100}
                      sx={{
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: (dept.resolution_rate ?? 0) >= 0.8 ? '#10b981' : (dept.resolution_rate ?? 0) >= 0.6 ? '#f59e0b' : '#ef4444',
                        },
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Container>
  );
}
