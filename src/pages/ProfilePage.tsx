import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import VerifiedIcon from '@mui/icons-material/Verified';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import { PriorityGauge } from '../components/shared/PriorityGauge';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardUser {
  id: string;
  full_name: string | null;
  email: string;
  trust_score: number;
  role: string;
  issue_count?: number;
}

interface UserBadge {
  id: string;
  badge_type: string;
  awarded_at: string;
}

// ─── Badge display config ─────────────────────────────────────────────────────

const BADGE_META: Record<string, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  first_report:      { label: 'First Reporter',   icon: <StarIcon />,                    color: '#f59e0b', desc: 'Submitted first civic issue' },
  verified_citizen:  { label: 'Verified Citizen',  icon: <VerifiedIcon />,                color: '#3b82f6', desc: 'Verified 10+ reports' },
  top_reporter:      { label: 'Top Reporter',      icon: <MilitaryTechIcon />,            color: '#7c3aed', desc: 'Top 10% of reporters' },
  streak:            { label: '7-Day Streak',      icon: <LocalFireDepartmentIcon />,     color: '#ef4444', desc: 'Active for 7 days in a row' },
};

// Civic score = trust_score weighted with issue count
function civicScore(trust: number, issues: number) {
  return Math.min(99, Math.round(trust * 0.7 + Math.min(issues * 2, 30)));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [issueCounts, setIssueCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // 1. Get top users by trust score
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email, trust_score, role')
        .order('trust_score', { ascending: false })
        .limit(10);

      // 2. Get current auth user
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;

      // 3. Count issues per user (get all issues with reporter_id)
      const { data: issueRows } = await supabase
        .from('issues')
        .select('reporter_id')
        .not('reporter_id', 'is', null);

      const counts: Record<string, number> = {};
      for (const row of issueRows ?? []) {
        if (row.reporter_id) counts[row.reporter_id] = (counts[row.reporter_id] ?? 0) + 1;
      }
      setIssueCounts(counts);

      if (users) {
        const enriched = users.map(u => ({ ...u, issue_count: counts[u.id] ?? 0 }));
        setLeaderboard(enriched);
        if (uid) {
          const me = enriched.find(u => u.id === uid) ?? null;
          setCurrentUser(me);
        }
      }

      // 4. Get badges — for current user if logged in, else show none
      if (uid) {
        const { data: badgeRows } = await supabase
          .from('badges')
          .select('id, badge_type, awarded_at')
          .eq('user_id', uid);
        setBadges(badgeRows ?? []);
      }

      setLoading(false);
    }

    void load();
  }, []);

  // Display info for the profile card
  const displayName = currentUser?.full_name ?? currentUser?.email?.split('@')[0] ?? 'Citizen Reporter';
  const displayEmail = currentUser?.email ?? 'Not signed in';
  const displayInitial = displayName[0]?.toUpperCase() ?? 'C';
  const trustScore = currentUser?.trust_score ?? 0;
  const myIssues = currentUser ? (issueCounts[currentUser.id] ?? 0) : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>

        {/* ── Profile card ────────────────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            {loading ? (
              <>
                <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
                <Skeleton width="60%" sx={{ mx: 'auto', mb: 1 }} />
                <Skeleton width="80%" sx={{ mx: 'auto', mb: 2 }} />
              </>
            ) : (
              <>
                <Avatar sx={{
                  width: 80, height: 80, mx: 'auto', mb: 2,
                  background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                  fontSize: '2rem',
                }}>
                  {displayInitial}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>{displayName}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, fontSize: '0.82rem' }}>
                  {displayEmail}
                </Typography>
                <Chip
                  label={currentUser?.role ?? 'Guest'}
                  size="small"
                  sx={{ backgroundColor: 'rgba(124,58,237,0.12)', color: '#a78bfa', mb: 2, textTransform: 'capitalize' }}
                />
              </>
            )}

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Trust Score</Typography>
                <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                  {loading ? '—' : `${trustScore}/100`}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={loading ? 0 : trustScore}
                sx={{ height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { backgroundColor: '#f59e0b' } }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
              {[
                [loading ? '—' : String(myIssues), 'Reports'],
                [loading ? '—' : '—', 'Verified'],
                [loading ? '—' : '—', 'Resolved'],
              ].map(([v, l]) => (
                <Box key={l} sx={{ p: 1, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>{v}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>{l}</Typography>
                </Box>
              ))}
            </Box>
          </Card>

          {/* ── Badges ──────────────────────────────────────────────────────── */}
          <Card sx={{ p: 2, mt: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 700, mb: 1.5 }}>Badges</Typography>
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} height={40} sx={{ mb: 0.5 }} />)
            ) : badges.length === 0 ? (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {currentUser ? 'No badges earned yet — keep reporting!' : 'Sign in to see your badges.'}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {badges.map(badge => {
                  const meta = BADGE_META[badge.badge_type] ?? {
                    label: badge.badge_type,
                    icon: <StarIcon />,
                    color: '#6b7280',
                    desc: `Awarded ${new Date(badge.awarded_at).toLocaleDateString()}`,
                  };
                  return (
                    <Box key={badge.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <Box sx={{ color: meta.color, '& svg': { fontSize: 20 } }}>{meta.icon}</Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.8rem', display: 'block' }}>
                          {meta.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
                          {meta.desc}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Card>
        </Grid>

        {/* ── Leaderboard ─────────────────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EmojiEventsIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                <Typography variant="body1" sx={{ fontWeight: 700 }}>Community Leaderboard</Typography>
                {!loading && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', ml: 'auto' }}>
                    {leaderboard.length} citizens
                  </Typography>
                )}
              </Box>

              {loading ? (
                [1,2,3,4,5].map(i => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)
              ) : leaderboard.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    No citizens registered yet. Be the first to sign up!
                  </Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Rank', 'Citizen', 'Issues', 'Trust Score', 'Civic Score'].map(h => (
                        <TableCell key={h} sx={{ color: 'text.disabled', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', borderColor: 'rgba(255,255,255,0.06)' }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboard.map((user, idx) => {
                      const rank = idx + 1;
                      const issues = issueCounts[user.id] ?? 0;
                      const score = civicScore(user.trust_score, issues);
                      const isMe = currentUser?.id === user.id;
                      return (
                        <TableRow key={user.id} sx={{
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' },
                          backgroundColor: isMe ? 'rgba(124,58,237,0.06)' : 'transparent',
                        }}>
                          <TableCell sx={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: rank === 1 ? '#f59e0b' : rank === 2 ? 'rgba(255,255,255,0.6)' : 'text.disabled' }}>
                              #{rank}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', backgroundColor: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                                {(user.full_name ?? user.email)[0]?.toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '0.85rem' }}>
                                  {user.full_name ?? user.email.split('@')[0]}
                                  {isMe && <Chip label="You" size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem', backgroundColor: 'rgba(124,58,237,0.2)', color: '#a78bfa' }} />}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.85rem', borderColor: 'rgba(255,255,255,0.04)' }}>
                            {issues}
                          </TableCell>
                          <TableCell sx={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={user.trust_score} sx={{ flex: 1, height: 4, '& .MuiLinearProgress-bar': { backgroundColor: '#f59e0b' } }} />
                              <Typography variant="caption" sx={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700, minWidth: 24 }}>
                                {user.trust_score}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <PriorityGauge score={score} size={32} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ── How trust score works ──────────────────────────────────────── */}
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <GroupOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body1" sx={{ fontWeight: 700 }}>How Trust Score Works</Typography>
              </Box>
              {[
                ['Submit verified reports', '+5 pts'],
                ['Report gets resolved', '+10 pts'],
                ['Community upvotes your report', '+2 pts'],
                ['Verify another report', '+3 pts'],
                ['False report flagged', '-15 pts'],
              ].map(([action, pts]) => (
                <Box key={action} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>{action}</Typography>
                  <Typography variant="caption" sx={{ color: pts.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '0.82rem' }}>{pts}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
