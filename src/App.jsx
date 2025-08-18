import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLevelRoute from '@components/screens/ProtectedLevelRoute';
import LevelRouter from '@components/game/LevelRouter';
import MainMenu from '@components/screens/MainMenu/MainMenu';

const BlowDetectionTest = React.lazy(() => import('./components/test/BlowDetectionTest'));

function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/level/:levelId" element={<ProtectedLevelRoute />}>
            <Route index element={<LevelRouter />} />
          </Route>

          {/* Test route - for development only */}
          <Route path="/test-blow" element={<BlowDetectionTest />} />

          {/* Catch-all route - redirect to home (MainMenu) */}
          <Route path="*" element={<MainMenu />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;