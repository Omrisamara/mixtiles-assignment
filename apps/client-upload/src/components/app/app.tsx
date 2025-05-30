import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import UploadPage from '../pages/UploadPage';
import FilterPage from '../pages/filterPage/FilterPage';
import NarrativesPage from '../pages/NarrativesPage';
import ExploreNarrativePage from '../pages/ExploreNarrativePage';
import { AppProvider } from '../../contexts/AppContext';

export function App() {
  return (
    <AppProvider>
      <div>
        <nav className="bg-gray-100 p-4">
          <ul className="flex space-x-4">
            <li><Link to="/" className="text-gray-600 hover:underline">Upload</Link></li>
            <li><Link to="/filter" className="text-gray-600 hover:underline">Filter</Link></li>
            <li><Link to="/narratives" className="text-gray-600 hover:underline">Narratives</Link></li>
          </ul>
        </nav>
        
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/filter" element={<FilterPage />} />
          <Route path="/narratives" element={<NarrativesPage />} />
          <Route path="/narratives/:narrativeId" element={<ExploreNarrativePage />} />
        </Routes>
      </div>
    </AppProvider>
  );
}

export default App;
