import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedLevelRoute from '@components/screens/ProtectedLevelRoute';
import LevelRouter from '@components/game/LevelRouter';
import MainMenu from '@components/screens/MainMenu/MainMenu';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/level/:levelId" element={<ProtectedLevelRoute />}>
          <Route index element={<LevelRouter />} />
        </Route>
        
        <Route path="*" element={<MainMenu />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;