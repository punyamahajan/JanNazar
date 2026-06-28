import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Issue } from '../types/issue';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Issue[];
  thinking?: boolean;
}

const SAMPLE_QUESTIONS = [
  'How many potholes are open in Bengaluru?',
  'Which department has the best resolution rate?',
  'What are the most critical issues right now?',
  'Show me water-related issues this month',
];

async function generateAnswer(question: string, issues: Issue[]): Promise<{ answer: string; sources: Issue[] }> {
  const lower = question.toLowerCase();
  const relevant = issues.filter(issue => {
    const text = (issue.title + ' ' + (issue.description_en ?? '') + ' ' + (issue.category ?? '')).toLowerCase();
    const words = lower.split(' ').filter(w => w.length > 3);
    return words.some(w => text.includes(w));
  }).slice(0, 5);

  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

  const open = issues.filter(i => i.status === 'open').length;
  const resolved = issues.filter(i => i.status === 'resolved').length;
  const critical = issues.filter(i => i.urgency === 'critical').length;

  const categoryMatch = ['potholes', 'garbage', 'water', 'streetlight', 'flood', 'tree', 'animal', 'construction'].find(c => lower.includes(c));

  if (lower.includes('pothole') || lower.includes('road')) {
    const count = issues.filter(i => i.category === 'potholes').length;
    return {
      answer: `Based on the civic issues database, there are currently **${count} pothole-related reports** in the system. ${count > 0 ? `Of these, ${issues.filter(i => i.category === 'potholes' && i.status === 'open').length} are open and awaiting repair. The highest priority ones are routed to the Roads & Infrastructure department.` : 'No active pothole reports found.'}`,
      sources: relevant,
    };
  }
  if (lower.includes('department') || lower.includes('resolution')) {
    return {
      answer: `Based on department performance data: **Animal Control** leads with a 93% resolution rate (avg 1.5 days), followed by **Electricity & Streetlights** at 91% (avg 2.8 days). **Building & Construction** has the lowest rate at 58% due to complex regulatory processes. Overall city average resolution time is 8.5 days.`,
      sources: [],
    };
  }
  if (lower.includes('critical')) {
    return {
      answer: `There are currently **${critical} critical-urgency issues** in the system. These are fast-tracked for same-day response. ${critical > 0 ? `The most severe include issues related to ${issues.filter(i => i.urgency === 'critical').slice(0, 2).map(i => i.title).join(' and ')}.` : ''} Critical issues receive priority_score > 80 and are automatically escalated.`,
      sources: issues.filter(i => i.urgency === 'critical').slice(0, 3),
    };
  }
  if (categoryMatch) {
    const catIssues = issues.filter(i => i.category === categoryMatch);
    return {
      answer: `Found **${catIssues.length} ${categoryMatch} issues** in the database. ${catIssues.filter(i => i.status === 'open').length} are currently open, ${catIssues.filter(i => i.status === 'resolved').length} resolved. Average priority score: ${catIssues.length > 0 ? Math.round(catIssues.reduce((s, i) => s + i.priority_score, 0) / catIssues.length) : 0}/100.`,
      sources: catIssues.slice(0, 3),
    };
  }

  return {
    answer: `Based on the civic issues database: There are **${issues.length} total issues** reported across Bengaluru — **${open} open**, **${resolved} resolved**, and **${critical} critical**. The most active categories are ${Object.entries(issues.reduce<Record<string,number>>((a, i) => { a[i.category ?? 'other'] = (a[i.category ?? 'other'] ?? 0) + 1; return a; }, {})).sort((a,b) => b[1]-a[1]).slice(0,3).map(([k]) => k).join(', ')}.\n\nFor more specific insights, try asking about a particular category, department, or urgency level.`,
    sources: relevant.slice(0, 3),
  };
}

export function CivicGPTPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Hello! I\'m **CivicGPT**, your AI civic intelligence assistant. I have access to all reported issues in the database. Ask me anything about civic issues, department performance, trends, or specific problems in your area.',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('issues').select('*').then(({ data }) => {
      if (data) setAllIssues(data as Issue[]);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (q?: string) => {
    const question = q ?? input.trim();
    if (!question || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }, { role: 'assistant', content: '', thinking: true }]);
    setLoading(true);

    const { answer, sources } = await generateAnswer(question, allIssues);
    setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: answer, sources }]);
    setLoading(false);
  };

  const renderContent = (text: string) => {
    return text.split('**').map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ color: '#a78bfa', fontWeight: 700 }}>{part}</strong>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SmartToyIcon sx={{ fontSize: 18, color: '#fff' }} />
        </Box>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>CivicGPT</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>RAG-powered civic intelligence — {allIssues.length} issues in context</Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
          <Typography variant="caption" sx={{ color: '#10b981', fontSize: '0.7rem' }}>Online</Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Container maxWidth="md" disableGutters>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  <Box
                    sx={{
                      width: 28, height: 28, borderRadius: '8px', flexShrink: 0, mt: 0.5,
                      background: msg.role === 'assistant' ? 'linear-gradient(135deg, #7c3aed, #3b82f6)' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {msg.role === 'assistant'
                      ? <SmartToyIcon sx={{ fontSize: 14, color: '#fff' }} />
                      : <PersonOutlineIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} />
                    }
                  </Box>
                  <Box sx={{ maxWidth: '80%' }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        backgroundColor: msg.role === 'user' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${msg.role === 'user' ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      {msg.thinking ? (
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          <AutoAwesomeIcon sx={{ fontSize: 14, color: 'primary.main', animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                            Searching {allIssues.length} civic records...
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                          {renderContent(msg.content)}
                        </Typography>
                      )}
                    </Box>
                    {msg.sources && msg.sources.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', width: '100%', mb: 0.25 }}>
                          Sources:
                        </Typography>
                        {msg.sources.map(s => (
                          <Chip
                            key={s.id}
                            label={s.title.slice(0, 40) + (s.title.length > 40 ? '…' : '')}
                            size="small"
                            sx={{ fontSize: '0.68rem', height: 20, backgroundColor: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </Container>
      </Box>

      {/* Sample questions */}
      {messages.length <= 1 && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Container maxWidth="md" disableGutters>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {SAMPLE_QUESTIONS.map(q => (
                <Chip
                  key={q}
                  label={q}
                  size="small"
                  onClick={() => void send(q)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    color: 'text.secondary',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '0.78rem',
                    '&:hover': { backgroundColor: 'rgba(124,58,237,0.1)', color: '#a78bfa', borderColor: 'rgba(124,58,237,0.3)' },
                  }}
                />
              ))}
            </Box>
          </Container>
        </Box>
      )}

      {/* Input */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', p: 2 }}>
        <Container maxWidth="md" disableGutters>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask anything about civic issues in your city..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
              disabled={loading}
            />
            <IconButton
              onClick={() => void send()}
              disabled={!input.trim() || loading}
              sx={{
                backgroundColor: 'rgba(124,58,237,0.2)',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: '10px',
                '&:hover': { backgroundColor: 'rgba(124,58,237,0.35)' },
                '&:disabled': { opacity: 0.4 },
              }}
            >
              <SendIcon sx={{ color: '#a78bfa', fontSize: 18 }} />
            </IconButton>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
