import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLevelRoute from '@components/screens/ProtectedLevelRoute';
import LevelRouter from '@components/game/LevelRouter';
import { TutorialLevel } from '@levels/levelRoutes';
import MainMenu from '@components/screens/MainMenu/MainMenu';

const LoadingScreen = () => (
  <div className="loading-screen">
    <h2>Loading...</h2>
  </div>
);


const BlowDetectionTest = React.lazy(() => import('./components/test/BlowDetectionTest'));


function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Home route - shows MainMenu */}
          <Route path="/" element={<MainMenu />} />

          {/* Tutorial route */}
          <Route path="/tutorial" element={<TutorialLevel levelId={0} />} />

          {/* Level routes with protection */}
          <Route path="/level/:levelId" element={<ProtectedLevelRoute />}>
            <Route index element={<LevelRouter />} />
          </Route>

          {/* TESTING STUFF */}
          {/* Test route - for development only */}
          <Route path="/test-blow" element={<BlowDetectionTest />} />
          {/* END OF TESTING STUFF */}

          {/* Catch-all route - redirect to home (MainMenu) */}
          <Route path="*" element={<MainMenu />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;