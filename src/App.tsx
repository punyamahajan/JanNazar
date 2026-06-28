import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import Box from '@mui/material/Box';
import theme from './theme';
import { LandingPage } from './pages/LandingPage';
import { ReportPage } from './pages/ReportPage';
import { MapPage } from './pages/MapPage';
import { FeedPage } from './pages/FeedPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CivicGPTPage } from './pages/CivicGPTPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Navbar />
          <Box component="main" sx={{ pt: { xs: 7, md: 8 } }}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/issue/:id" element={<IssueDetailPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/civicgpt" element={<CivicGPTPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
