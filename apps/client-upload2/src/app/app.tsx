import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import UploadPage from '../components/pages/UploadPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
    </Routes>
  );
}

export default App;
