import { motion, AnimatePresence } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import MicIcon from '@mui/icons-material/Mic';
import TranslateIcon from '@mui/icons-material/Translate';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import CategoryIcon from '@mui/icons-material/Category';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RouteIcon from '@mui/icons-material/Route';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { useReasoningStream } from '../../hooks/useReasoningStream';
import type { AIResult } from '../../hooks/useReasoningStream';

interface AgentMeta {
  label: string;
  icon: React.ReactNode;
  description: string;
}

const AGENT_META: Record<string, AgentMeta> = {
  speech_agent:         { label: 'Transcribing voice',      icon: <MicIcon sx={{ fontSize: 14 }} />,          description: 'faster-whisper' },
  vision_agent:         { label: 'Analysing image',         icon: <ImageSearchIcon sx={{ fontSize: 14 }} />,  description: 'Qwen2.5-VL' },
  translation_agent:    { label: 'Translating to English',  icon: <TranslateIcon sx={{ fontSize: 14 }} />,    description: 'IndicTrans2' },
  classification_agent: { label: 'Classifying issue',       icon: <CategoryIcon sx={{ fontSize: 14 }} />,     description: 'Qwen3 + CoT' },
  dedup_agent:          { label: 'Checking duplicates',     icon: <ContentCopyIcon sx={{ fontSize: 14 }} />,  description: 'Qdrant + bge-small' },
  routing_agent:        { label: 'Routing to department',   icon: <RouteIcon sx={{ fontSize: 14 }} />,        description: 'Rule engine' },
  priority_agent:       { label: 'Calculating priority',    icon: <PriorityHighIcon sx={{ fontSize: 14 }} />, description: 'Scoring formula' },
};

const AGENT_ORDER = [
  'speech_agent', 'vision_agent', 'translation_agent',
  'classification_agent', 'dedup_agent', 'routing_agent', 'priority_agent',
];

interface ReasoningStreamProps {
  reportId: string;
  userText?: string;
  hasImages?: boolean;
  onComplete?: (issueId: string, result: AIResult) => void;
}

export function ReasoningStream({ reportId, userText = '', hasImages = false, onComplete }: ReasoningStreamProps) {
  const { thoughts, activeAgent, completed, isDone, issueId, aiResult } =
    useReasoningStream(reportId, userText, hasImages);

  if (isDone && issueId && aiResult && onComplete) {
    setTimeout(() => onComplete(issueId, aiResult), 0);
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box sx={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: isDone ? '#10b981' : '#7c3aed',
          animation: isDone ? 'none' : 'pulse 1s infinite',
        }} />
        <Typography variant="caption" sx={{ color: isDone ? 'success.main' : 'primary.light', fontWeight: 600, fontSize: '0.75rem' }}>
          {isDone ? 'AI Processing Complete' : 'AI Agents Processing...'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {AGENT_ORDER.map((agentName) => {
          const meta = AGENT_META[agentName];
          const isActive = activeAgent === agentName;
          const isDoneAgent = completed.includes(agentName);
          const agentThoughts = thoughts.filter(t => t.agent === agentName);

          return (
            <motion.div key={agentName} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Box sx={{
                borderRadius: '12px',
                border: '1px solid',
                borderColor: isActive ? 'rgba(124,58,237,0.5)' : isDoneAgent ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)',
                backgroundColor: isActive ? 'rgba(124,58,237,0.06)' : isDoneAgent ? 'rgba(16,185,129,0.04)' : 'transparent',
                p: 1.5,
                transition: 'all 0.3s ease',
                opacity: !isActive && !isDoneAgent ? 0.4 : 1,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: agentThoughts.length > 0 ? 1 : 0 }}>
                  {isActive ? (
                    <CircularProgress size={14} sx={{ color: '#7c3aed' }} />
                  ) : isDoneAgent ? (
                    <CheckCircleIcon sx={{ fontSize: 14, color: '#10b981' }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }} />
                  )}
                  <Box sx={{ color: isActive ? '#a78bfa' : isDoneAgent ? '#6ee7b7' : 'rgba(255,255,255,0.4)' }}>
                    {meta.icon}
                  </Box>
                  <Typography variant="caption" sx={{
                    fontWeight: 600, fontSize: '0.78rem',
                    color: isActive ? 'rgba(255,255,255,0.9)' : isDoneAgent ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                  }}>
                    {meta.label}
                  </Typography>
                  <Typography variant="caption" sx={{ ml: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem' }}>
                    {meta.description}
                  </Typography>
                </Box>

                <AnimatePresence>
                  {agentThoughts.length > 0 && (
                    <Box sx={{ ml: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {agentThoughts.map((t, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                          <Typography sx={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: '0.7rem',
                            color: 'rgba(255,255,255,0.45)',
                            lineHeight: 1.5,
                            '&::before': { content: '"→ "', color: 'rgba(124,58,237,0.6)' },
                          }}>
                            {t.thought}
                          </Typography>
                        </motion.div>
                      ))}
                    </Box>
                  )}
                </AnimatePresence>
              </Box>
            </motion.div>
          );
        })}
      </Box>
    </Box>
  );
}
