import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLevelRoute from '@components/screens/ProtectedLevelRoute';
import LevelRouter from '@components/game/LevelRouter';
import { TutorialLevel } from '@levels/levelRoutes';

const LoadingScreen = () => (
  <div className="loading-screen">
    <h2>Loading...</h2>
  </div>
);

// Create a component to test our store
const StoreTest = React.lazy(() => import('./components/screens/StoreTest'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Home route - redirects to tutorial */}
          <Route path="/" element={<Navigate to="/tutorial" replace />} />
          
          {/* Tutorial route */}
          <Route path="/tutorial" element={<TutorialLevel levelId={0} />} />
          
          {/* Level routes with protection */}
          <Route path="/level/:levelId" element={<ProtectedLevelRoute />}>
            <Route index element={<LevelRouter />} />
          </Route>
          
          {/* Test route - for development only */}
          <Route path="/test-store" element={<StoreTest />} />
          
          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;