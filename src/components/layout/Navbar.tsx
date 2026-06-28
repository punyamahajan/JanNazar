import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const NAV_LINKS = [
  { label: 'Map', path: '/map', icon: <MapOutlinedIcon fontSize="small" /> },
  { label: 'Feed', path: '/feed', icon: <FeedOutlinedIcon fontSize="small" /> },
  { label: 'Analytics', path: '/analytics', icon: <BarChartOutlinedIcon fontSize="small" /> },
  { label: 'CivicGPT', path: '/civicgpt', icon: <SmartToyOutlinedIcon fontSize="small" /> },
  { label: 'Admin', path: '/admin', icon: <DashboardOutlinedIcon fontSize="small" /> },
  { label: 'Profile', path: '/profile', icon: <AccountCircleOutlinedIcon fontSize="small" /> },
];

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <AppBar position="fixed" elevation={0}>
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <Box
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mr: 4 }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              🏛
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(90deg, #fff, rgba(255,255,255,0.7))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              JanNazar
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, flex: 1 }}>
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.path}
                  startIcon={link.icon}
                  onClick={() => navigate(link.path)}
                  size="small"
                  sx={{
                    color: location.pathname.startsWith(link.path)
                      ? 'primary.light'
                      : 'rgba(255,255,255,0.5)',
                    backgroundColor: location.pathname.startsWith(link.path)
                      ? 'rgba(124,58,237,0.12)'
                      : 'transparent',
                    '&:hover': {
                      color: 'rgba(255,255,255,0.9)',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                    },
                    px: 1.5,
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate('/report')}
              size="small"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Report Issue
            </Button>
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }}>
          <Typography variant="h6" sx={{ px: 2, pb: 2, fontWeight: 700 }}>
            JanNazar
          </Typography>
          <List>
            {NAV_LINKS.map((link) => (
              <ListItem key={link.path} disablePadding>
                <ListItemButton
                  onClick={() => { navigate(link.path); setDrawerOpen(false); }}
                  selected={location.pathname.startsWith(link.path)}
                >
                  {link.icon}
                  <ListItemText primary={link.label} sx={{ ml: 1.5 }} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton onClick={() => { navigate('/report'); setDrawerOpen(false); }}>
                <AddCircleOutlineIcon />
                <ListItemText primary="Report Issue" sx={{ ml: 1.5 }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
