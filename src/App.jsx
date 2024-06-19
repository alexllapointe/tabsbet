import { React, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PlayerResearch from './components/PlayerResearch';

function App() {
  const [playerName, setPlayerName] = useState('');

  const handlePlayerNameChange = (name) => {
    setPlayerName(name);
    console.log("Player Name Set To:", name);
  };

  const clearPlayerName = () => {
    setPlayerName('');
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Navbar onPlayerNameChange={handlePlayerNameChange} />
              <PlayerResearch />
            </ProtectedRoute>
          } /> */}
          <Route path="/" element={
            <>
              <Navbar onPlayerNameChange={handlePlayerNameChange} />
              <PlayerResearch />

            </>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
