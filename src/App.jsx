import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLevelRoute from '@components/screens/ProtectedLevelRoute';
import LevelRouter from '@components/game/LevelRouter';
import MainMenu from '@components/screens/MainMenu/MainMenu';
import TutorialLevel from '@levels/Tutorial/TutorialLevel';
import useGameStore from '@store/gameStore';

const RootRedirect = () => {
  const shouldShowTutorial = useGameStore(state => state.shouldShowTutorial);

  if (shouldShowTutorial()) {
    return <Navigate to="/tutorial" replace />;
  }

  return <MainMenu />;
};

function App() {
  console.log("Created by Steponas Dabuzinskas | https://github.com/Steponass")
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/tutorial" element={<TutorialLevel />} />
        <Route path="/level/:levelId" element={<ProtectedLevelRoute />}>
          <Route index element={<LevelRouter />} />
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;