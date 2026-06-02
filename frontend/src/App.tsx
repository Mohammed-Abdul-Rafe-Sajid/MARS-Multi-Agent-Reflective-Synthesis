import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ResearchProvider } from './hooks/useResearch';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';

import HomePage        from './pages/HomePage';
import ResearchPage    from './pages/ResearchPage';
import ReportPage      from './pages/ReportPage';
import ClaimsPage      from './pages/ClaimsPage';
import MetricsPage     from './pages/MetricsPage';
import IterationsPage  from './pages/IterationsPage';
import HistoryPage     from './pages/HistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <ResearchProvider>
        <div className="app-shell">
          <Sidebar />
          <div className="main-area">
            <Topbar />
            <Routes>
              <Route path="/"           element={<HomePage />} />
              <Route path="/research"   element={<ResearchPage />} />
              <Route path="/report"     element={<ReportPage />} />
              <Route path="/claims"     element={<ClaimsPage />} />
              <Route path="/metrics"    element={<MetricsPage />} />
              <Route path="/iterations" element={<IterationsPage />} />
              <Route path="/history"    element={<HistoryPage />} />
              <Route path="*"           element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </ResearchProvider>
    </BrowserRouter>
  );
}
