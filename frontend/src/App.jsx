import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { socket } from './socket';

// Components
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import PlayerScreen from './components/PlayerScreen';
import ProjectorScreen from './components/ProjectorScreen';

function AppContent() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [gameState, setGameState] = useState({});

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('state_update', (newState) => {
      setGameState(newState);
    });

    socket.on('game_reset', () => {
      const saved = localStorage.getItem('player');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.role === 'equipo') {
          localStorage.removeItem('player');
          window.location.href = '/';
        }
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('state_update');
      socket.off('game_reset');
    };
  }, []);

  return (
    <div className="app-container">
      <header className="premium-header animate-fade-in">
        <h1 className="premium-title">Concurso Arancelario</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: isConnected ? '#10B981' : '#EF4444',
            boxShadow: isConnected ? '0 0 10px #10B981' : '0 0 10px #EF4444'
          }}></div>
          <span style={{ fontSize: '0.9rem', color: '#E3DCC8' }}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/player" element={<PlayerScreen gameState={gameState} />} />
          <Route path="/admin" element={<AdminPanel gameState={gameState} />} />
          <Route path="/projector" element={<ProjectorScreen gameState={gameState} />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
