import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://concurso-arancel.onrender.com/api';

export default function Login() {
    const navigate = useNavigate();

    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState('new');
    const [newTeamName, setNewTeamName] = useState('');
    const [role, setRole] = useState('equipo');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await fetch(API_URL + '/teams');
            const data = await res.json();
            setTeams(data);
            if (data.length > 0) {
                setSelectedTeamId(data[0].id.toString());
            }
        } catch (err) {
            console.error("Error fetching teams", err);
            // No bloquear el login por este error
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (role === 'admin') {
                localStorage.setItem('player', JSON.stringify({ name: 'Jurado', role: 'admin' }));
                navigate('/admin');
                return;
            }

            if (role === 'projector') {
                localStorage.setItem('player', JSON.stringify({ name: 'Proyector Público', role: 'projector' }));
                navigate('/projector');
                return;
            }

            // Para equipos
            let finalTeamId = null;
            let finalTeamName = '';

            if (selectedTeamId === 'new') {
                if (!newTeamName.trim()) {
                    setError('Por favor escribe el nombre del equipo.');
                    setLoading(false);
                    return;
                }
                const res = await fetch(API_URL + '/teams', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newTeamName.trim() })
                });
                if (!res.ok) throw new Error('No se pudo crear el equipo en el servidor.');
                const data = await res.json();
                finalTeamId = data.id;
                finalTeamName = data.name;
            } else {
                const team = teams.find(t => t.id.toString() === selectedTeamId);
                if (!team) {
                    setError('Equipo no encontrado. Intenta crear uno nuevo.');
                    setLoading(false);
                    return;
                }
                finalTeamId = team.id;
                finalTeamName = team.name;
            }

            localStorage.setItem('player', JSON.stringify({
                name: finalTeamName,
                role: 'equipo',
                teamId: finalTeamId,
                teamName: finalTeamName
            }));

            navigate('/player');
        } catch (err) {
            console.error("Login error:", err);
            setError(`Error de conexión: ${err.message}. Verifica que el servidor esté activo.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ color: 'var(--primary-blue)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Ingresar al Concurso</h2>
                    <p style={{ color: '#4B5563', fontSize: '0.95rem' }}>Registra o selecciona tu equipo</p>
                </div>

                {error && (
                    <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.95rem' }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--primary-blue)' }}>
                            Tipo de Acceso
                        </label>
                        <select
                            className="premium-input"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            style={{ cursor: 'pointer' }}
                        >
                            <option value="equipo">Participante (Equipo completo)</option>
                            <option value="admin">Administrador (Jurado)</option>
                            <option value="projector">Pantalla de Proyector (Público)</option>
                        </select>
                    </div>

                    {role === 'equipo' && (
                        <div style={{ background: 'var(--primary-beige)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--secondary-beige)' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--primary-blue)' }}>
                                Nombre de Equipo
                            </label>
                            <select
                                className="premium-input"
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                style={{ cursor: 'pointer', marginBottom: selectedTeamId === 'new' ? '1rem' : '0' }}
                            >
                                {teams.length > 0 && teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                                <option value="new">+ Crear nuevo equipo</option>
                            </select>

                            {selectedTeamId === 'new' && (
                                <input
                                    type="text"
                                    className="premium-input"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    placeholder="Nombre del nuevo equipo"
                                />
                            )}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Conectando...' : 'Entrar al Concurso'}
                        {!loading && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
