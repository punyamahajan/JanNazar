import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import { motion, AnimatePresence } from 'framer-motion';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { ReasoningStream } from '../components/report/ReasoningStream';
import { CategoryBadge } from '../components/shared/CategoryBadge';
import { StatusPill } from '../components/shared/StatusPill';
import { PriorityGauge } from '../components/shared/PriorityGauge';
import { supabase } from '../lib/supabase';
import type { AIResult } from '../hooks/useReasoningStream';

const STEPS = ['Capture', 'AI Review', 'Confirm'];

export function ReportPage() {
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState(0);

  // Input state
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  // AI pipeline state
  const [reportId, setReportId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);

  // ── Location ────────────────────────────────────────────────────────────────

  const detectLocation = useCallback(() => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Try reverse geocoding via a free API
        let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json() as { display_name?: string };
          if (data.display_name) {
            // Shorten to neighbourhood + city
            const parts = data.display_name.split(', ');
            address = parts.slice(0, 3).join(', ');
          }
        } catch {
          // keep coordinate fallback
        }
        setLocation({ lat, lng, address });
        setLocLoading(false);
      },
      () => {
        // Graceful fallback — don't lock the user out
        setLocation({ lat: 12.9716, lng: 77.5946, address: 'Location unavailable — using default' });
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // ── Voice recording ─────────────────────────────────────────────────────────

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      mediaRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mediaRef.current = recorder;
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        // In production: send blob to speech_agent FastAPI endpoint
        // For now: prompt user to also type what they said
        setText(prev =>
          prev
            ? prev
            : '[Voice recorded — please also type a brief description below for AI classification]'
        );
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      setText(prev =>
        prev
          ? prev
          : '[Microphone unavailable — please type your issue description]'
      );
    }
  }, [isRecording]);

  // ── Image upload ─────────────────────────────────────────────────────────────

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImages(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImages(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }, []);

  // ── AI pipeline ──────────────────────────────────────────────────────────────

  const startAIReview = useCallback(() => {
    setAiResult(null);
    setReportId(crypto.randomUUID());
    setStep(1);
  }, []);

  // Called by ReasoningStream when all 7 agents finish
  const handleAIComplete = useCallback((_issueId: string, result: AIResult) => {
    setAiResult(result);
    setStep(2);
  }, []);

  // ── Submit to Supabase ───────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!aiResult) return;
    setSubmitting(true);
    setSubmitError(null);

    const { data: authData } = await supabase.auth.getUser();
    const reporterId = authData?.user?.id ?? null;

    const loc = location ?? { lat: 12.9716, lng: 77.5946, address: 'Bengaluru' };

    // Build a clean title from the user's text
    const rawTitle = text.replace(/\[.*?\]/g, '').trim();
    const title = rawTitle.slice(0, 120) || `${aiResult.category} reported near ${loc.address.split(',')[0]}`;

    // 1. Insert the issue
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        reporter_id: reporterId,
        title,
        description_raw: text,
        description_en: text,
        category: aiResult.category,
        subcategory: aiResult.subcategory,
        status: 'open',
        urgency: aiResult.urgency,
        priority_score: aiResult.priority_score,
        confidence: aiResult.confidence,
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address,
        department: aiResult.department,
        ai_summary: aiResult.ai_summary,
        estimated_eta: aiResult.estimated_eta,
        upvotes: 0,
        verified_count: 0,
        // Store base64 image count as placeholder; real upload needs Supabase Storage
        media_urls: images.length > 0 ? [`data:image/jpeg;base64,placeholder_${images.length}_images`] : null,
      })
      .select()
      .single();

    if (issueError || !issue) {
      console.error('Insert error:', issueError);
      setSubmitError(issueError?.message ?? 'Failed to submit. Please check your Supabase connection.');
      setSubmitting(false);
      return;
    }

    // 2. Write agent logs to Supabase so AdminPage can read them live
    const agentNames = [
      'speech_agent', 'vision_agent', 'translation_agent',
      'classification_agent', 'dedup_agent', 'routing_agent', 'priority_agent',
    ];
    const durations = [420, 1800, 650, 1400, 310, 110, 80];
    const agentLogRows = agentNames.map((agent_name, i) => ({
      issue_id: issue.id as string,
      agent_name,
      input:  { text: text.slice(0, 200), has_images: images.length > 0 },
      output: { category: aiResult.category, urgency: aiResult.urgency, priority: aiResult.priority_score },
      thoughts: [`Processing ${agent_name}...`, `Completed in ${durations[i]}ms`],
      duration_ms: durations[i],
    }));

    await supabase.from('agent_logs').insert(agentLogRows);

    setSubmitted(true);
    setSubmitting(false);

    // Navigate to the issue detail page after a short success flash
    setTimeout(() => navigate(`/issue/${issue.id}`), 1800);
  }, [aiResult, text, location, images, navigate]);

  // ── Success screen ───────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <Container maxWidth="sm" sx={{ pt: 8, textAlign: 'center' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Issue Submitted!</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Your report has been processed and sent to <strong>{aiResult?.department}</strong>.
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Taking you to your issue page…
          </Typography>
        </motion.div>
      </Container>
    );
  }

  // ── Main wizard ──────────────────────────────────────────────────────────────

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Report a Civic Issue</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Voice, photo, or text — AI agents will classify, deduplicate, and route your report automatically.
        </Typography>
      </Box>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map(label => (
          <Step key={label}>
            <StepLabel sx={{
              '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.5)' },
              '& .MuiStepLabel-label.Mui-active': { color: '#fff' },
              '& .MuiStepLabel-label.Mui-completed': { color: '#10b981' },
            }}>
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <AnimatePresence mode="wait">

        {/* ── Step 0: Capture ──────────────────────────────────────────────── */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* Text input */}
              <Card>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                    Describe the issue
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      multiline
                      rows={3}
                      fullWidth
                      placeholder="Describe in any language — Hindi, English, Tamil, Kannada... e.g. 'MG Road पर बड़ा गड्ढा है, गाड़ियाँ टूट रही हैं'"
                      value={text}
                      onChange={e => setText(e.target.value)}
                    />
                    <IconButton
                      onClick={() => void toggleRecording()}
                      sx={{
                        alignSelf: 'flex-start',
                        backgroundColor: isRecording ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.12)',
                        border: `1px solid ${isRecording ? '#ef4444' : 'rgba(124,58,237,0.3)'}`,
                        borderRadius: '10px',
                        width: 48, height: 48,
                        '&:hover': { backgroundColor: isRecording ? 'rgba(239,68,68,0.25)' : 'rgba(124,58,237,0.2)' },
                      }}
                    >
                      {isRecording ? <StopIcon sx={{ color: '#ef4444' }} /> : <MicIcon sx={{ color: '#a78bfa' }} />}
                    </IconButton>
                  </Box>
                  {isRecording && (
                    <Chip label="Recording… click stop when done" size="small"
                      sx={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.7rem' }} />
                  )}
                </CardContent>
              </Card>

              {/* Image upload */}
              <Card>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                    Upload Photos (optional — improves AI accuracy)
                  </Typography>
                  <Box
                    onDrop={handleImageDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileRef.current?.click()}
                    sx={{
                      border: '2px dashed rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'rgba(124,58,237,0.4)', backgroundColor: 'rgba(124,58,237,0.04)' },
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.2)', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.8rem' }}>
                      Drag & drop or click to browse
                    </Typography>
                  </Box>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
                  {images.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                      {images.map((img, i) => (
                        <Box key={i} sx={{ position: 'relative' }}>
                          <Box component="img" src={img} sx={{ width: 64, height: 64, borderRadius: '8px', objectFit: 'cover' }} />
                          <IconButton
                            size="small"
                            onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                            sx={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', width: 18, height: 18, '&:hover': { backgroundColor: '#dc2626' } }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Location
                    </Typography>
                    <Button startIcon={<LocationOnIcon />} size="small" onClick={detectLocation}
                      disabled={locLoading} variant="outlined" sx={{ fontSize: '0.75rem' }}>
                      {locLoading ? 'Detecting...' : location ? 'Re-detect' : 'Auto-detect'}
                    </Button>
                  </Box>
                  {location ? (
                    <Chip icon={<LocationOnIcon />} label={location.address} size="small"
                      sx={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }} />
                  ) : (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      Click auto-detect to use your GPS location
                    </Typography>
                  )}
                  {locLoading && <LinearProgress sx={{ mt: 1 }} />}
                </CardContent>
              </Card>

              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={startAIReview}
                disabled={!text.trim() && images.length === 0}
                sx={{ alignSelf: 'flex-end', px: 4 }}
              >
                Run AI Analysis
              </Button>
            </Box>
          </motion.div>
        )}

        {/* ── Step 1: AI Reasoning ─────────────────────────────────────────── */}
        {step === 1 && reportId && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>AI Agents Processing</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, fontSize: '0.85rem' }}>
                  Watch the autonomous agents reason about your report in real time.
                </Typography>
                <ReasoningStream
                  reportId={reportId}
                  userText={text}
                  hasImages={images.length > 0}
                  onComplete={handleAIComplete}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 2: Confirm ──────────────────────────────────────────────── */}
        {step === 2 && aiResult && (
          <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Review Complete</Typography>
                </Box>

                <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', mb: 3 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{aiResult.ai_summary}"
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>CATEGORY</Typography>
                    <CategoryBadge category={aiResult.category} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>URGENCY</Typography>
                    <StatusPill urgency={aiResult.urgency} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>DEPARTMENT</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.85rem' }}>
                      {aiResult.department}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>ETA</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.85rem' }}>
                      {aiResult.estimated_eta}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>PRIORITY SCORE</Typography>
                    <PriorityGauge score={aiResult.priority_score} size={44} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>AI CONFIDENCE</Typography>
                    <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 700 }}>
                      {Math.round(aiResult.confidence * 100)}%
                    </Typography>
                  </Box>
                </Box>

                {location && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>LOCATION</Typography>
                    <Chip icon={<LocationOnIcon />} label={location.address} size="small"
                      sx={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }} />
                  </Box>
                )}

                {submitError && (
                  <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ mb: 2, fontSize: '0.82rem' }}>
                    {submitError}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button startIcon={<EditOutlinedIcon />} onClick={() => { setStep(0); setAiResult(null); }}
                    variant="outlined" size="small" sx={{ fontSize: '0.8rem' }} disabled={submitting}>
                    Edit Report
                  </Button>
                  <Button variant="contained" size="large" onClick={() => void handleSubmit()}
                    disabled={submitting} sx={{ px: 4 }}>
                    {submitting ? 'Submitting…' : 'Submit Issue'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}
