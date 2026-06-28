import { useEffect, useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import { StatusPill } from '../components/shared/StatusPill';
import { CategoryBadge } from '../components/shared/CategoryBadge';
import { getCategoryColor } from '../components/shared/CategoryBadge';
import type { Issue, IssueCategory, IssueStatus } from '../types/issue';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number; // metres
}

type LocationState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

// ─── Inner map components (must live inside <MapContainer>) ───────────────────

/**
 * Flies the map to the user's location once when it becomes available.
 * Never overrides the position again after the first fly-to.
 */
function FitBoundsToIssues({ issues }: { issues: Issue[] }) {
  const map = useMap();
  const prevCount = useRef(0);

  useEffect(() => {
    const coords = issues
      .filter((issue) => Number.isFinite(issue.lat) && Number.isFinite(issue.lng))
      .map((issue) => [issue.lat, issue.lng] as [number, number]);

    if (coords.length === 0 || prevCount.current === coords.length) return;
    prevCount.current = coords.length;

    if (coords.length === 1) {
      map.setView(coords[0], 8);
      return;
    }

    map.fitBounds(L.latLngBounds(coords), { padding: [70, 70], maxZoom: 8 });
  }, [issues, map]);

  return null;
}

/**
 * Flies the map to a target position imperatively when `trigger` increments.
 * Used by the "locate me" button for repeated re-centering.
 */
function FlyToTarget({
  target,
  trigger,
}: {
  target: UserLocation | null;
  trigger: number;
}) {
  const map = useMap();
  const prevTrigger = useRef(0);

  useEffect(() => {
    if (target && trigger > 0 && trigger !== prevTrigger.current) {
      prevTrigger.current = trigger;
      map.flyTo([target.lat, target.lng], 15, { duration: 1 });
    }
  }, [target, trigger, map]);

  return null;
}

/**
 * Draws the user's location as a pulsing blue dot with accuracy circle.
 * Uses raw Leaflet SVG overlay so it renders above all tile layers.
 */
function UserLocationMarker({ location }: { location: UserLocation | null }) {
  const map = useMap();
  const markerRef = useRef<L.CircleMarker | null>(null);
  const accuracyRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    // Dynamically import L to avoid SSR issues
    import('leaflet').then((L) => {
      // Clean up previous markers
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      if (accuracyRef.current) { accuracyRef.current.remove(); accuracyRef.current = null; }

      if (!location) return;

      // Accuracy circle (translucent blue halo)
      accuracyRef.current = L.circle([location.lat, location.lng], {
        radius: location.accuracy,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 1,
        dashArray: '4 4',
        interactive: false,
      }).addTo(map);

      // Blue dot
      markerRef.current = L.circleMarker([location.lat, location.lng], {
        radius: 8,
        color: '#ffffff',
        fillColor: '#3b82f6',
        fillOpacity: 1,
        weight: 2.5,
        interactive: false,
      }).addTo(map);
    });

    return () => {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      if (accuracyRef.current) { accuracyRef.current.remove(); accuracyRef.current = null; }
    };
  }, [location, map]);

  return null;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function MapPage() {
  const navigate = useNavigate();

  // Issues from Supabase
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filtered, setFiltered] = useState<Issue[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected issue slide-over
  const [selected, setSelected] = useState<Issue | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // User location
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [flyTrigger, setFlyTrigger] = useState(0);

  // ── Geolocation ─────────────────────────────────────────────────────────────

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState('unavailable');
      return;
    }

    setLocationState('requesting');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationState('granted');
        // Increment trigger so FlyToTarget re-fires on each button press
        setFlyTrigger((n) => n + 1);
      },
      (err) => {
        console.warn('Geolocation error:', err.code, err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationState('denied');
        } else {
          setLocationState('unavailable');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // reuse a cached position up to 30s old
      }
    );
  }, []);

  // Auto-request on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // ── Issues from Supabase ─────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setIssues(data as Issue[]);
        setFiltered(data as Issue[]);
      }
    }
    load();

    const channel = supabase
      .channel('map-issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => {
        void load();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  // ── Filters ──────────────────────────────────────────────────────────────────

  const applyFilters = useCallback(
    (cat: string, stat: string) => {
      let result = issues;
      if (cat !== 'all') result = result.filter((i) => i.category === cat);
      if (stat !== 'all') result = result.filter((i) => i.status === stat);
      setFiltered(result);
    },
    [issues]
  );

  useEffect(() => {
    applyFilters(categoryFilter, statusFilter);
  }, [applyFilters, categoryFilter, statusFilter]);

  // ── Locate button config ─────────────────────────────────────────────────────

  const locateButtonConfig = {
    idle:        { icon: <MyLocationIcon sx={{ fontSize: 18 }} />, label: 'Find my location',     color: 'rgba(255,255,255,0.6)',  bg: 'rgba(255,255,255,0.06)' },
    requesting:  { icon: <CircularProgress size={16} sx={{ color: '#3b82f6' }} />, label: 'Detecting location…', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    granted:     { icon: <MyLocationIcon sx={{ fontSize: 18 }} />, label: 'Re-center on me',      color: '#3b82f6',               bg: 'rgba(59,130,246,0.12)' },
    denied:      { icon: <LocationOffIcon sx={{ fontSize: 18 }} />, label: 'Location permission denied — click for info', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    unavailable: { icon: <LocationOffIcon sx={{ fontSize: 18 }} />, label: 'Location unavailable', color: '#f59e0b',              bg: 'rgba(245,158,11,0.1)' },
  } as const;

  const locBtn = locateButtonConfig[locationState];

  const handleLocateClick = () => {
    if (locationState === 'denied') {
      alert(
        'Location access was denied.\n\n' +
        'To fix this:\n' +
        '• Chrome/Edge: click the 🔒 lock icon in the address bar → Site settings → Location → Allow\n' +
        '• Firefox: click the shield icon → Permissions → Access your location → Allow\n' +
        '• Then click "Find my location" again.'
      );
      return;
    }
    if (locationState === 'granted' && userLocation) {
      // Already have position — just re-center
      setFlyTrigger((n) => n + 1);
    } else {
      requestLocation();
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  // Default map center: India-wide view if no user location is available
  const initialCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [21.0, 78.0];

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', position: 'relative' }}>

      {/* ── Filter sidebar ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          width: 260,
          flexShrink: 0,
          backgroundColor: 'rgba(10,10,15,0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          p: 2,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          gap: 2,
          overflow: 'auto',
          zIndex: 1000,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Filters
          </Typography>
        </Box>

        {/* Locate me button */}
        <Tooltip title={locBtn.label} placement="right">
          <Box
            onClick={handleLocateClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              borderRadius: '10px',
              border: `1px solid ${locBtn.color}30`,
              backgroundColor: locBtn.bg,
              cursor: locationState === 'requesting' ? 'default' : 'pointer',
              transition: 'all 0.2s',
              '&:hover': locationState !== 'requesting'
                ? { backgroundColor: `${locBtn.bg}`, opacity: 0.85 }
                : {},
            }}
          >
            <Box sx={{ color: locBtn.color, display: 'flex', alignItems: 'center' }}>
              {locBtn.icon}
            </Box>
            <Typography variant="caption" sx={{ color: locBtn.color, fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.2 }}>
              {locationState === 'requesting'
                ? 'Detecting…'
                : locationState === 'granted'
                ? 'Re-center on me'
                : locationState === 'denied'
                ? 'Location denied'
                : locationState === 'unavailable'
                ? 'Unavailable'
                : 'Find my location'}
            </Typography>
          </Box>
        </Tooltip>

        {/* Accuracy info when granted */}
        {locationState === 'granted' && userLocation && (
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', mt: -1 }}>
            ± {userLocation.accuracy < 1000
              ? `${Math.round(userLocation.accuracy)} m`
              : `${(userLocation.accuracy / 1000).toFixed(1)} km`} accuracy
          </Typography>
        )}

        <FormControl size="small" fullWidth>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {(
              ['potholes', 'garbage', 'streetlight', 'water', 'flood', 'tree', 'animal', 'construction', 'other'] as IssueCategory[]
            ).map((cat) => (
              <MenuItem key={cat} value={cat} sx={{ textTransform: 'capitalize' }}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            {(['open', 'in_progress', 'resolved', 'closed'] as IssueStatus[]).map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                {s.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {filtered.length} issues shown
        </Typography>

        {/* Legend */}
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', display: 'block', mb: 1, fontWeight: 600 }}
          >
            LEGEND
          </Typography>
          {[
            ['potholes', '#f97316'],
            ['garbage', '#84cc16'],
            ['water', '#3b82f6'],
            ['animal', '#8b5cf6'],
          ].map(([cat, color]) => (
            <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', textTransform: 'capitalize' }}
              >
                {cat}
              </Typography>
            </Box>
          ))}
          {/* You are here */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, mt: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                border: '2px solid #fff',
                boxSizing: 'content-box',
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              You are here
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Map ────────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={initialCenter}
          zoom={5}
          style={{ height: '100%', width: '100%', backgroundColor: '#0a0a0f' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Re-center on button press */}
          <FlyToTarget target={userLocation} trigger={flyTrigger} />

          {/* Blue "you are here" dot */}
          <UserLocationMarker location={userLocation} />

          <FitBoundsToIssues issues={filtered} />

          {/* Issue markers */}
          {filtered.map((issue) => (
            <CircleMarker
              key={issue.id}
              center={[issue.lat, issue.lng]}
              radius={
                issue.urgency === 'critical' ? 12 : issue.urgency === 'high' ? 9 : 6
              }
              pathOptions={{
                color: getCategoryColor(issue.category ?? 'other'),
                fillColor: getCategoryColor(issue.category ?? 'other'),
                fillOpacity: 0.7,
                weight: 2,
              }}
              eventHandlers={{
                click: () => {
                  setSelected(issue);
                  setSidebarOpen(true);
                },
              }}
            >
              <Popup>
                <Box sx={{ p: 1, minWidth: 220 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: '#fff', mb: 0.5, lineHeight: 1.3 }}
                  >
                    {issue.title || 'Reported issue'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.78)', display: 'block' }}>
                    {issue.category ? `Category: ${issue.category}` : 'Category: unknown'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.78)', display: 'block' }}>
                    {issue.status ? `Status: ${issue.status.replace('_', ' ')}` : 'Status: unknown'}
                  </Typography>
                  {issue.address && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.68)', display: 'block', mt: 0.5 }}>
                      {issue.address}
                    </Typography>
                  )}
                </Box>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Floating locate button on mobile (sidebar is hidden on xs/sm) */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'absolute',
            bottom: 24,
            right: 16,
            zIndex: 1000,
          }}
        >
          <Tooltip title={locBtn.label} placement="left">
            <Box
              onClick={handleLocateClick}
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: 'rgba(10,10,15,0.92)',
                border: `1px solid ${locBtn.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                color: locBtn.color,
                backdropFilter: 'blur(12px)',
                '&:hover': { opacity: 0.85 },
              }}
            >
              {locBtn.icon}
            </Box>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Issue slide-over ────────────────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={sidebarOpen && selected !== null}
        onClose={() => setSidebarOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            backgroundColor: 'rgba(10,10,15,0.98)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        {selected && (
          <Box sx={{ p: 2.5 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
            >
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <CategoryBadge category={selected.category} />
                <StatusPill status={selected.status} />
              </Box>
              <IconButton
                size="small"
                onClick={() => setSidebarOpen(false)}
                sx={{ color: 'text.secondary' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Typography
              variant="body1"
              sx={{ fontWeight: 700, color: 'text.primary', mb: 1, lineHeight: 1.4 }}
            >
              {selected.title}
            </Typography>

            {selected.ai_summary && (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', mb: 2, fontSize: '0.85rem', lineHeight: 1.6 }}
              >
                {selected.ai_summary}
              </Typography>
            )}

            {selected.media_urls?.[0] && (
              <Box
                component="img"
                src={selected.media_urls[0]}
                alt=""
                sx={{
                  width: '100%',
                  height: 140,
                  objectFit: 'cover',
                  borderRadius: '10px',
                  mb: 2,
                }}
              />
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
              {[
                { label: 'DEPARTMENT', value: selected.department ?? '—' },
                { label: 'PRIORITY', value: `${selected.priority_score}/100` },
                { label: 'UPVOTES', value: String(selected.upvotes) },
                { label: 'ETA', value: selected.estimated_eta ?? '—' },
              ].map(({ label, value }) => (
                <Box key={label}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                    {label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.82rem' }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Chip
              label="View Full Issue →"
              onClick={() => navigate(`/issue/${selected.id}`)}
              sx={{
                cursor: 'pointer',
                backgroundColor: 'rgba(124,58,237,0.15)',
                color: '#a78bfa',
                border: '1px solid rgba(124,58,237,0.3)',
                fontWeight: 600,
                width: '100%',
                '&:hover': { backgroundColor: 'rgba(124,58,237,0.25)' },
              }}
            />
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
