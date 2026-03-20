import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

// Estilos específicos para esta pantalla (se pueden mover a un CSS si prefieren)
const projectorStyles = {
    container: {
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem',
        boxSizing: 'border-box',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1rem',
        borderBottom: '2px solid rgba(255,255,255,0.1)',
        marginBottom: '2rem'
    },
    mainArea: {
        display: 'flex',
        flex: 1,
        gap: '2rem'
    },
    leftPanel: {
        flex: '3',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '3rem',
        position: 'relative',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    },
    rightPanel: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '2rem'
    },
    title: {
        fontSize: '4rem',
        fontWeight: 'bold',
        textShadow: '0 4px 15px rgba(0,0,0,0.5)',
        textAlign: 'center',
        lineHeight: '1.2'
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: '2rem',
        textTransform: 'uppercase',
        letterSpacing: '4px',
        marginBottom: '2rem'
    },
    winnerCard: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        padding: '3rem',
        borderRadius: '24px',
        textAlign: 'center',
        width: '100%',
        boxShadow: '0 10px 40px rgba(16, 185, 129, 0.4)',
        animation: 'pulse 2s infinite'
    }
};

export default function ProjectorScreen({ gameState }) {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [countdown, setCountdown] = useState(0);
    const [timeLeft, setTimeLeft] = useState(35);

    useEffect(() => {
        if (gameState?.current_round === 'Ronda 4' && gameState?.timer_started_at && !gameState?.winner_team_id) {
            const interval = setInterval(() => {
                const now = Date.now();
                const elapsed = Math.floor((now - gameState.timer_started_at) / 1000);
                const remaining = Math.max(0, 35 - elapsed);
                setTimeLeft(remaining);
            }, 100); // 100ms for smooth update
            return () => clearInterval(interval);
        } else {
            setTimeLeft(35);
        }
    }, [gameState?.current_round, gameState?.timer_started_at, gameState?.winner_team_id]);

    const renderObfuscated = (text) => {
        if (!text) return '';
        return text.split(' ').map(word => {
            return word.split('').map((char, i) => {
                if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(char)) {
                    // Muestra algunos caracteres sí y otros no, de manera determinista corta
                    return (i % 3 !== 0) ? char : '_';
                }
                return char;
            }).join('');
        }).join('   ');
    };

    useEffect(() => {
        const saved = localStorage.getItem('player');
        if (!saved) {
            navigate('/');
            return;
        }
        const p = JSON.parse(saved);
        if (p.role !== 'projector') {
            navigate('/');
            return;
        }

        fetchTeams();
        socket.on('teams_update', fetchTeams);
        socket.on('game_reset', () => {
            fetchTeams();
        });

        const handleCountdown = (val) => setCountdown(val);
        socket.on('countdown', handleCountdown);

        return () => {
            socket.off('teams_update', fetchTeams);
            socket.off('game_reset', fetchTeams);
            socket.off('countdown', handleCountdown);
        };
    }, [navigate]);

    const fetchTeams = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/teams');
            const data = await res.json();
            setTeams(data);
        } catch (error) {
            console.error("Error fetching teams", error);
        }
    };

    // Render helper para las reglas (modo instrucciones)
    const renderInstructions = () => {
        const block = gameState?.current_block;

        if (!block) return null;

        if (!block.includes('Instrucciones') && !block.includes('Reglas') && block !== 'Esperando inicio de moderador...') {
            return (
                <div className="animate-fade-in" style={{ width: '100%', textAlign: 'center' }}>
                    <h2 style={{ color: '#94a3b8', fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '1rem' }}>
                        Siguiente Turno
                    </h2>
                    <h1 style={{ color: '#fbbf24', fontSize: '5rem', marginBottom: '2rem', textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
                        {block}
                    </h1>
                    <div style={{ fontSize: '2rem', color: 'white', background: 'rgba(59,130,246,0.5)', padding: '1rem 3rem', borderRadius: '50px', display: 'inline-block', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
                        ¡Todos listos en el teclado! ⌨️
                    </div>
                </div>
            );
        }

        let content = null;
        if (block === 'Instrucciones Generales') {
            content = (
                <ul style={{ fontSize: '1.8rem', lineHeight: '2', textAlign: 'left', maxWidth: '1000px', marginTop: '2rem' }}>
                    <li style={{ marginBottom: '1.5rem' }}>Equipos integrados por Clasificadores (2do Sem) y Calculadores (4to Sem).</li>
                    <li style={{ marginBottom: '1.5rem' }}>Se usará <strong>una sola computadora</strong> por equipo (túrnense el teclado).</li>
                    <li style={{ marginBottom: '1.5rem' }}>El primer equipo en enviar la respuesta correcta gana el punto de esa mercancía.</li>
                    <li>Las LIGIE deben enviarse <strong>sin espacios</strong> (ej. 1234567800).</li>
                </ul>
            );
        } else if (block === 'Reglas Ronda 1') {
            content = (
                <ul style={{ fontSize: '1.8rem', lineHeight: '2', textAlign: 'left', maxWidth: '1000px', marginTop: '2rem' }}>
                    <li style={{ marginBottom: '1.5rem' }}>Participan <strong>exclusivamente</strong> estudiantes de 2do semestre.</li>
                    <li style={{ marginBottom: '1.5rem' }}>Cada clasificador (1, 2 y 3) tendrá su propio bloque de 10 mercancías.</li>
                    <li>Busquen la Fracción Arancelaria (LIGIE) correcta lo más rápido posible.</li>
                </ul>
            );
        } else if (block === 'Reglas Ronda 2') {
            content = (
                <ul style={{ fontSize: '1.8rem', lineHeight: '2', textAlign: 'left', maxWidth: '1000px', marginTop: '2rem' }}>
                    <li style={{ marginBottom: '1.5rem' }}>Participan <strong>exclusivamente</strong> estudiantes de 4to semestre.</li>
                    <li style={{ marginBottom: '1.5rem' }}>Haremos el cálculo del porcentaje de IVA aplicable a las mercancías.</li>
                    <li>Ingresen únicamente el número de porcentaje (ej. "16" o "8").</li>
                </ul>
            );
        } else if (block === 'Reglas Ronda 3') {
            content = (
                <ul style={{ fontSize: '1.8rem', lineHeight: '2', textAlign: 'left', maxWidth: '1000px', marginTop: '2rem' }}>
                    <li style={{ marginBottom: '1.5rem' }}>Ronda de velocidad pura. Regresan los de 2do semestre.</li>
                    <li>5 mercancías continuas por cada clasificador.</li>
                </ul>
            );
        } else if (block === 'Reglas Ronda 4') {
            content = (
                <ul style={{ fontSize: '1.8rem', lineHeight: '2', textAlign: 'left', maxWidth: '1000px', marginTop: '2rem' }}>
                    <li style={{ marginBottom: '1.5rem' }}>Gran Final Individual para los Calculadores de 4to semestre.</li>
                    <li>Cronómetro máximo de <strong>35 segundos</strong> por mercancía para dar con la LIGIE.</li>
                </ul>
            );
        }

        return (
            <div className="animate-fade-in" style={{ width: '100%' }}>
                <h1 style={{ color: '#fbbf24', fontSize: '4rem', marginBottom: '1rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{block}</h1>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {content}
                </div>
            </div>
        );
    };

    return (
        <div style={projectorStyles.container}>
            {/* Full Screen Overlays for Welcome and Winner Reveal */}
            {gameState?.screen_mode === 'welcome' && (
                <div className="animate-fade-in" style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                    zIndex: 2000, display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '5rem'
                }}>
                    <div style={{ fontSize: '15rem', marginBottom: '2rem', filter: 'drop-shadow(0 0 30px rgba(59,130,246,0.5))' }}>🏆</div>
                    <h1 style={{ fontSize: '6rem', fontWeight: '900', color: 'white', marginBottom: '1rem', letterSpacing: '10px' }}>BIENVENIDOS</h1>
                    <div style={{ height: '4px', width: '300px', background: '#fbbf24', marginBottom: '2rem' }}></div>
                    <h2 style={{ fontSize: '3rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '5px' }}>
                        PRIMER CONCURSO DE CLASIFICACIÓN ARANCELARIA
                    </h2>
                    <div style={{ marginTop: '5rem', fontSize: '2rem', color: '#fbbf24' }} className="loading-pulse">
                        EL CONCURSO COMENZARÁ EN BREVE... ⏳
                    </div>
                </div>
            )}

            {gameState?.screen_mode === 'winner_reveal' && (
                <div className="animate-fade-in" style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                    zIndex: 2000, display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '3rem',
                    border: '12px solid white'
                }}>
                    <div className="loading-pulse" style={{ fontSize: '12rem', marginBottom: '1.5rem' }}>👑</div>
                    <h1 style={{ fontSize: '4.8rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '0.8rem' }}>¡FELICIDADES!</h1>
                    <h2 style={{ fontSize: '2.4rem', color: '#1e1b4b', opacity: 0.8, marginBottom: '2rem', fontWeight: 'bold' }}>EL GANADOR FINAL ES:</h2>
                    <div style={{ background: 'white', padding: '2.5rem 5rem', borderRadius: '40px', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', border: '6px solid #1e1b4b' }}>
                        <h3 style={{ fontSize: '6rem', margin: 0, color: '#1e3a8a', fontWeight: '900' }}>{gameState.winner_team_name}</h3>
                    </div>
                    <div style={{ marginTop: '2.5rem', fontSize: '3rem', fontWeight: '900', color: '#1e1b4b' }}>
                        SCORE: {gameState.winner_score} PTS
                    </div>
                </div>
            )}

            {/* Header / StatusBar */}
            <div style={projectorStyles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#3b82f6', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {gameState?.current_round || 'Esperando Inicio'}
                    </div>
                    <div style={{ fontSize: '1.5rem', color: '#cbd5e1' }}>
                        {gameState?.current_block}
                    </div>
                </div>
                <div>
                    <img src="/vite.svg" alt="Logo" style={{ height: '40px', opacity: 0.8 }} />
                </div>
            </div>

            {/* Main Layout */}
            <div style={projectorStyles.mainArea}>

                {countdown > 0 && (
                    <div className="countdown-overlay animate-fade-in" style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15,23,42,0.95)', zIndex: 1000,
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                    }}>
                        <div style={{ fontSize: '4rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '8px', marginBottom: '2rem' }}>
                            Prepárate...
                        </div>
                        <div className="countdown-number" style={{ fontSize: '25rem', color: 'white', fontWeight: 'bold', textShadow: '0 20px 50px rgba(0,0,0,0.5)', lineHeight: 1 }}>
                            {countdown}
                        </div>
                    </div>
                )}

                {/* Left Panel: Active Content (Instructions, Product, or Winner) */}
                <div style={projectorStyles.leftPanel}>
                    {gameState?.screen_mode === 'instructions' ? (
                        renderInstructions() || (
                            <div style={{ textAlign: 'center', color: '#64748b' }}>
                                <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📺</div>
                                <h1 style={{ fontSize: '3rem', fontWeight: 'normal' }}>Pantalla en Espera...</h1>
                            </div>
                        )
                    ) : (
                        // Playing mode
                        <div className="animate-fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {gameState?.winner_team_id ? (
                                <div style={projectorStyles.winnerCard}>
                                    <h2 style={{ fontSize: '4rem', margin: '0 0 1rem 0', color: 'white', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                        🎉 ¡CORRECTO!
                                    </h2>
                                    <h3 style={{ fontSize: '3rem', margin: '0 0 2rem 0', color: '#dcfce7' }}>
                                        Equipo ganador: {gameState.winner_team_name}
                                    </h3>

                                    {gameState.current_round === 'Ronda 3' ? (
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '16px', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', textAlign: 'left', minWidth: '600px' }}>
                                            <div style={{ fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9, textAlign: 'center', marginBottom: '1rem', color: '#fbbf24' }}>
                                                Fracciones Oficiales
                                            </div>
                                            {(() => {
                                                try {
                                                    const blockData = JSON.parse(gameState.active_block_data || '[]');
                                                    return blockData.map((p, idx) => (
                                                        <div key={p.id} style={{ fontSize: '2.5rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', alignItems: 'center' }}>
                                                            <span style={{ opacity: 0.8, fontSize: '1.5rem', alignSelf: 'center', marginRight: '2rem' }}>{idx + 1}. {p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name}</span>
                                                            <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#fff' }}>{p.correct_ligie}</span>
                                                        </div>
                                                    ));
                                                } catch (e) { return null; }
                                            })()}
                                        </div>
                                    ) : (
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '16px', display: 'inline-block' }}>
                                            <div style={{ fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9, marginBottom: '0.5rem' }}>
                                                Fracción Oficial
                                            </div>
                                            <div style={{ fontSize: '5rem', fontWeight: 'bold', letterSpacing: '8px', fontFamily: 'monospace' }}>
                                                {gameState.current_round !== 'Ronda 2' ? gameState.correct_ligie : gameState.correct_iva}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {gameState?.current_round === 'Ronda 4' && !gameState?.winner_team_id && (
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
                                            <div style={{
                                                width: '150px', height: '150px', borderRadius: '50%', background: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '5rem', fontWeight: 'bold', color: '#1e1b4b',
                                                border: timeLeft <= 10 ? '8px solid #ef4444' : '8px solid #fbbf24',
                                                boxShadow: '0 0 40px rgba(0,0,0,0.5)',
                                                animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none'
                                            }}>
                                                {timeLeft}
                                            </div>
                                        </div>
                                    )}

                                    <div style={projectorStyles.subtitle}>Mercancía Activa</div>
                                    {gameState?.current_round === 'Ronda 1' ? (
                                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                            <div style={{ fontSize: '15rem', lineHeight: '1', textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                                {gameState?.product_name?.split(' ')[0]}
                                            </div>
                                            <div style={{ fontSize: '3rem', fontWeight: 'bold', letterSpacing: '8px', color: '#fbbf24', textTransform: 'uppercase', marginTop: '2rem' }}>
                                                {renderObfuscated(gameState?.product_name?.split(' ').slice(1).join(' '))}
                                            </div>
                                        </div>
                                    ) : gameState?.current_round === 'Ronda 3' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '90%', maxWidth: '1000px', margin: '2rem auto 0' }}>
                                            {(() => {
                                                try {
                                                    const blockData = JSON.parse(gameState.active_block_data || '[]');
                                                    return blockData.map((p, idx) => (
                                                        <div key={p.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '12px', fontSize: '2.5rem', textAlign: 'left', display: 'flex', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                                            <span style={{ color: '#ebf8ff', background: '#3b82f6', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '2rem', fontSize: '2rem', flexShrink: 0, fontWeight: 'bold' }}>{idx + 1}</span>
                                                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                                                        </div>
                                                    ));
                                                } catch (e) { return null; }
                                            })()}
                                        </div>
                                    ) : (
                                        <div style={projectorStyles.title}>{gameState?.product_name}</div>
                                    )}
                                    <div style={{ marginTop: '4rem' }}>
                                        <div className="loading-pulse" style={{ fontSize: '2rem', color: '#fbbf24' }}>
                                            ESPERANDO RESPUESTAS... ⏳
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel: Live Leaderboard */}
                <div style={projectorStyles.rightPanel}>
                    <h3 style={{ color: '#fbbf24', fontSize: '1.8rem', textAlign: 'center', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        Tabla de Posiciones
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                        {[...teams].sort((a, b) => b.score - a.score).map((t, index) => (
                            <div key={t.id} style={{
                                background: index === 0 ? 'linear-gradient(90deg, rgba(245,158,11,0.2) 0%, transparent 100%)' : 'rgba(255,255,255,0.02)',
                                border: index === 0 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.3s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        color: index === 0 ? '#fbbf24' : '#94a3b8',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        width: '30px'
                                    }}>#{index + 1}</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: index === 0 ? 'bold' : 'normal', color: index === 0 ? 'white' : '#cbd5e1' }}>
                                        {t.name}
                                    </div>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', textShadow: '0 0 10px rgba(59,130,246,0.3)' }}>
                                    {t.score || 0}
                                </div>
                            </div>
                        ))}

                        {teams.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem', fontSize: '1.2rem' }}>
                                Esperando a que los equipos se registren...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
