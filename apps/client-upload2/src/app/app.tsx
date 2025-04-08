import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UploadPage from '../components/pages/UploadPage';
import FilterPage from '../components/pages/filterPage/FilterPage';
import NarrativesPage from '../components/pages/NarrativesPage';
import ExploreNarrativePage from '../components/pages/ExploreNarrativePage';
import { AppProvider } from '../contexts/AppContext';
import NavBar from '../components/common/NavBar';

export function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/filter" element={<FilterPage />} />
            <Route path="/narratives" element={<NarrativesPage />} />
            <Route path="/narratives/:narrativeId" element={<ExploreNarrativePage />} />
          </Routes>
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
