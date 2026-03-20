import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

export default function PlayerScreen({ gameState }) {
    const navigate = useNavigate();
    const [player, setPlayer] = useState(null);
    const [answer, setAnswer] = useState('');
    const [answers, setAnswers] = useState(['', '', '', '', '']);
    const [submitted, setSubmitted] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const [timeLeft, setTimeLeft] = useState(35);

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
        } else {
            setPlayer(JSON.parse(saved));
        }
    }, [navigate]);

    // Cleanup form on new product or block
    useEffect(() => {
        setSubmitted(false);
        setAnswer('');
        setAnswers(['', '', '', '', '']);
        setTimeLeft(35);
    }, [gameState?.active_product_id, gameState?.active_block_data]);

    useEffect(() => {
        let timer;
        if (gameState?.current_round === 'Ronda 4' && timeLeft > 0 && !submitted && !gameState?.winner_team_id) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (gameState?.current_round === 'Ronda 4' && timeLeft === 0 && !submitted && !gameState?.winner_team_id) {
            handleSubmit(new Event('submit')); // auto submit
        }
        return () => clearInterval(timer);
    }, [gameState?.current_round, timeLeft, submitted, gameState?.winner_team_id]);

    React.useEffect(() => {
        const handleWrong = () => {
            setSubmitted(false);
            setAnswer('');
            // Optional: reset answers array or leave what they had
            alert("❌ ¡Respuesta Incorrecta! Revisa tus repuestas e inténtalo de nuevo.");
        };

        const handleCountdown = (val) => {
            setCountdown(val);
        };

        socket.on('wrong_answer', handleWrong);
        socket.on('countdown', handleCountdown);

        return () => {
            socket.off('wrong_answer', handleWrong);
            socket.off('countdown', handleCountdown);
        };
    }, []);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (submitted) return;

        if (gameState?.current_round === 'Ronda 3') {
            if (answers.some(a => !a.trim())) {
                alert("Completa todas las respuestas antes de enviar.");
                return;
            }
            socket.emit('submit_answer', {
                teamName: player?.teamName,
                teamId: player?.teamId,
                answers
            });
        } else {
            if (!answer.trim()) return;
            socket.emit('submit_answer', {
                teamName: player?.teamName,
                teamId: player?.teamId,
                answer,
                timeRemaining: timeLeft,
                productId: gameState?.active_product_id
            });
        }

        setSubmitted(true);
    };

    if (gameState?.screen_mode === 'welcome') {
        return (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '24px', color: 'white', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: '8rem', marginBottom: '1rem' }}>🏆</div>
                <h1 style={{ fontSize: '2.8rem', fontWeight: 'bold', marginBottom: '1rem', lineHeight: '1.2' }}>BIENVENIDOS</h1>
                <h2 style={{ fontSize: '1.4rem', opacity: 0.9, marginBottom: '2.5rem', letterSpacing: '1px' }}>PRIMER CONCURSO DE CLASIFICACIÓN ARANCELARIA</h2>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem 2rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: '500' }}>
                    Esperando inicio del Administrador... ⏳
                </div>
            </div>
        );
    }

    if (gameState?.screen_mode === 'winner_reveal') {
        return (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '24px', color: '#1e1b4b', border: '5px solid #fff', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                <div className="loading-pulse" style={{ fontSize: '6rem', marginBottom: '1rem' }}>👑</div>
                <h1 style={{ fontSize: '2.1rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>¡FELICIDADES!</h1>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', opacity: 0.9 }}>EL GANADOR FINAL ES:</h2>
                <div style={{ background: 'white', padding: '1.2rem 1.8rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '2.1rem', margin: 0, color: '#1e3a8a', fontWeight: '900' }}>{gameState.winner_team_name}</h3>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Puntaje Final: {gameState.winner_score} pts</div>
            </div>
        );
    }

    if (!player) return null;

    // Determina qué integrante debe responder según la ronda
    let instructionText = "Ingresa la Fracción Arancelaria (LIGIE)";
    let inputPlaceholder = "Sin espacios (ej. 1234.56.78.00)";
    let currentActor = "Equipo completo";

    if (gameState?.current_round === 'Ronda 1') {
        currentActor = `Turno de Estudiantes de 2do Semestre: ${gameState.current_block}`;
    } else if (gameState?.current_round === 'Ronda 2') {
        instructionText = "Ingresa el Cálculo de IVA incluido";
        inputPlaceholder = "Sólo el número";
        currentActor = `Turno de Estudiantes de 4to Semestre: ${gameState.current_block}`;
    } else if (gameState?.current_round === 'Ronda 3') {
        currentActor = `Turno Acelerado de 2do Semestre: ${gameState.current_block}`;
    } else if (gameState?.current_round === 'Ronda 4') {
        currentActor = `Participación Individual de 4to Semestre: ${gameState.current_block}`;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="glass-card animate-fade-in" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ color: 'var(--primary-blue)', margin: 0 }}>Equipo: {player.teamName}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>{gameState?.current_round || 'Esperando inicio'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{gameState?.current_block || ''}</div>
                </div>
            </div>

            <div className="glass-card animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem', position: 'relative' }}>
                {countdown > 0 && (
                    <div className="countdown-overlay animate-fade-in" style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(30,58,138,0.95)', zIndex: 100,
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                        borderRadius: '16px'
                    }}>
                        <div style={{ fontSize: '2rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '2rem' }}>
                            Prepárate...
                        </div>
                        <div className="countdown-number" style={{ fontSize: '8rem', color: 'white', fontWeight: 'bold', textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            {countdown}
                        </div>
                    </div>
                )}

                {(gameState?.active_product_id || gameState?.active_block_data) && gameState?.screen_mode === 'playing' ? (
                    <div>
                        <div style={{
                            display: 'inline-block',
                            background: 'var(--primary-beige)',
                            color: 'var(--primary-blue)',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            marginBottom: '1rem'
                        }}>
                            {currentActor}
                        </div>
                        {gameState?.current_round === 'Ronda 1' ? (
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '4rem', lineHeight: '1', textShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                                    {gameState?.product_name?.split(' ')[0]}
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '4px', color: 'var(--primary-blue)', textTransform: 'uppercase', marginTop: '1rem' }}>
                                    {renderObfuscated(gameState?.product_name?.split(' ').slice(1).join(' '))}
                                </div>
                            </div>
                        ) : gameState?.current_round === 'Ronda 3' ? (
                            <h3 style={{ fontSize: '1.5rem', color: 'var(--primary-blue)', marginBottom: '1.5rem' }}>
                                Evaluación de Bloque de 5 Mercancías
                            </h3>
                        ) : (
                            <h3 style={{ fontSize: '1.5rem', color: 'var(--primary-blue)', marginBottom: '1.5rem' }}>
                                Mercancía Activa: {gameState.product_name || 'Cargando...'}
                            </h3>
                        )}

                        {gameState?.current_round === 'Ronda 4' && !gameState?.winner_team_id && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                                <div className={"timer-container " + (timeLeft <= 10 ? 'timer-urgent' : '')}>
                                    {timeLeft}
                                </div>
                            </div>
                        )}

                        {!submitted && !gameState?.winner_team_id ? (
                            <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
                                <label style={{ display: 'block', textAlign: 'left', marginBottom: '1rem', fontWeight: 500, color: 'var(--text-dark)' }}>
                                    {instructionText}
                                </label>

                                {gameState?.current_round === 'Ronda 3' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {(() => {
                                            try {
                                                const blockData = JSON.parse(gameState.active_block_data || '[]');
                                                return blockData.map((p, idx) => (
                                                    <div key={p.id} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.7)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                            <span style={{
                                                                background: 'var(--primary-blue)',
                                                                color: 'white',
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '50%',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                fontSize: '0.9rem',
                                                                fontWeight: 'bold',
                                                                flexShrink: 0
                                                            }}>
                                                                {idx + 1}
                                                            </span>
                                                            <span style={{ fontWeight: 'bold', color: 'var(--primary-blue)', fontSize: '1.1rem', textAlign: 'left' }}>
                                                                {p.name}
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className="premium-input-batch"
                                                            placeholder="Ingrese Fracción LIGIE"
                                                            value={answers[idx] || ''}
                                                            onChange={(e) => {
                                                                const newAnswers = [...answers];
                                                                newAnswers[idx] = e.target.value;
                                                                setAnswers(newAnswers);
                                                            }}
                                                            autoFocus={idx === 0}
                                                        />
                                                    </div>
                                                ));
                                            } catch (e) { return null; }
                                        })()}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder={inputPlaceholder}
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        autoFocus
                                    />
                                )}

                                <button type="submit" className="btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
                                    Enviar Respuesta del Equipo
                                </button>
                            </form>
                        ) : gameState?.winner_team_id ? (
                            <div style={{ padding: '2rem', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10B981', borderRadius: '12px', marginTop: '1.5rem' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
                                <div style={{ color: '#10B981', fontWeight: 'bold', fontSize: '1.5rem' }}>
                                    ¡El equipo "{gameState.winner_team_name}" ha acertado primero!
                                </div>
                                <div style={{ color: '#047857', marginTop: '1rem' }}>
                                    {gameState.current_round === 'Ronda 3' ? (
                                        <div style={{ textAlign: 'left', display: 'inline-block' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Respuestas correctas:</div>
                                            {(() => {
                                                try {
                                                    const blockData = JSON.parse(gameState.active_block_data || '[]');
                                                    return blockData.map((p, idx) => (
                                                        <div key={p.id} style={{ fontFamily: 'monospace', fontSize: '1.2rem', padding: '0.2rem 0' }}>
                                                            {idx + 1}. {p.correct_ligie}
                                                        </div>
                                                    ));
                                                } catch (e) { return null; }
                                            })()}
                                        </div>
                                    ) : (
                                        <>Respuesta correcta: {gameState.current_round !== 'Ronda 2' ? gameState.correct_ligie : gameState.correct_iva}</>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '1rem' }}>
                                ⏳ Respuesta enviada... Esperando resultados de los demás equipos.
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ padding: '3rem 0', color: '#6B7280' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <h3 style={{ color: 'var(--primary-blue)', fontSize: '1.8rem', marginBottom: '1.5rem' }}>{gameState?.current_block || 'Esperando inicio'}</h3>

                        {gameState?.current_block && !gameState?.current_block.includes('Instrucciones') && !gameState?.current_block.includes('Reglas') && gameState.current_block !== 'Esperando inicio de moderador...' && (
                            <div className="animate-fade-in" style={{ background: 'var(--primary-blue)', color: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(30,58,138,0.3)' }}>
                                <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, marginBottom: '0.5rem' }}>Atención Equipo</h2>
                                <h1 style={{ fontSize: '2.5rem', margin: 0 }}>¡ES TURNO DEL {gameState.current_block.split('(')[0].toUpperCase().trim()}!</h1>
                                <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Tomen el teclado. Atentos a la pantalla grande para la próxima mercancía.</p>
                            </div>
                        )}

                        {gameState?.current_block === 'Instrucciones Generales' && (
                            <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem', background: 'rgba(255,255,255,0.7)', padding: '2rem', borderRadius: '12px', border: '1px solid #ddd' }}>
                                <p><strong>Dinámica del Concurso:</strong></p>
                                <ul style={{ marginTop: '1rem', lineHeight: '1.6' }}>
                                    <li>Participan equipos integrados por estudiantes de 2do semestre (Clasificadores) y 4to semestre (Calculadores).</li>
                                    <li>Se usará <strong>una sola computadora por equipo</strong>. Los integrantes deberán turnarse según lo indique la pantalla.</li>
                                    <li>El primer equipo en enviar la respuesta correcta gana el punto de esa mercancía.</li>
                                    <li>Las respuestas de LIGIE deben enviarse <strong>sin espacios</strong> (ej. 1234567800).</li>
                                </ul>
                            </div>
                        )}

                        {gameState?.current_block === 'Reglas Ronda 1' && (
                            <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem', background: 'rgba(255,255,255,0.7)', padding: '2rem', borderRadius: '12px', border: '1px solid #ddd' }}>
                                <p><strong>Ronda 1 - Clasificación Básica:</strong></p>
                                <ul style={{ marginTop: '1rem', lineHeight: '1.6' }}>
                                    <li>Participan <strong>exclusivamente</strong> los estudiantes de 2do semestre.</li>
                                    <li>Cada clasificador (1, 2 y 3) tendrá su propio bloque de 10 mercancías.</li>
                                    <li>Se deberá buscar la Fracción Arancelaria (LIGIE) de cada producto proyectado.</li>
                                </ul>
                            </div>
                        )}

                        {gameState?.current_block === 'Reglas Ronda 2' && (
                            <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem', background: 'rgba(255,255,255,0.7)', padding: '2rem', borderRadius: '12px', border: '1px solid #ddd' }}>
                                <p><strong>Ronda 2 - Cálculo de IVA:</strong></p>
                                <ul style={{ marginTop: '1rem', lineHeight: '1.6' }}>
                                    <li>Participan <strong>exclusivamente</strong> los estudiantes de 4to semestre.</li>
                                    <li>Se mostrarán mercancías y deberán calcular el porcentaje de IVA aplicable.</li>
                                    <li>Ingresen únicamente el número (ej. "16" o "8").</li>
                                </ul>
                            </div>
                        )}

                        {gameState?.current_block === 'Reglas Ronda 3' && (
                            <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem', background: 'rgba(255,255,255,0.7)', padding: '2rem', borderRadius: '12px', border: '1px solid #ddd' }}>
                                <p><strong>Ronda 3 - Clasificación Rápida:</strong></p>
                                <ul style={{ marginTop: '1rem', lineHeight: '1.6' }}>
                                    <li>Regresan los estudiantes de 2do semestre al teclado.</li>
                                    <li>Ronda de velocidad: 5 mercancías continuas por cada clasificador.</li>
                                </ul>
                            </div>
                        )}

                        {gameState?.current_block === 'Reglas Ronda 4' && (
                            <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem', background: 'rgba(255,255,255,0.7)', padding: '2rem', borderRadius: '12px', border: '1px solid #ddd' }}>
                                <p><strong>Ronda 4 - Final Individual (Contrarreloj):</strong></p>
                                <ul style={{ marginTop: '1rem', lineHeight: '1.6' }}>
                                    <li>Participan los estudiantes de 4to semestre de forma individual.</li>
                                    <li>Tendrán un máximo de <strong>50 segundos</strong> por mercancía para clasificarla en la LIGIE.</li>
                                </ul>
                            </div>
                        )}

                        {!gameState?.current_block?.includes('Reglas') && !gameState?.current_block?.includes('Instrucciones') && (
                            <p style={{ marginTop: '1rem', fontSize: '1.2rem', maxWidth: '600px', margin: '1rem auto', fontWeight: 'bold' }}>
                                {gameState?.current_round === 'Ronda 1' && "Atención Clasificadores (2do Semestre). Estén listos para buscar la Fracción Arancelaria (LIGIE)."}
                                {gameState?.current_round === 'Ronda 2' && "Atención Calculadores Aduaneros (4to Semestre). Tengan su calculadora lista."}
                                {gameState?.current_round === 'Ronda 3' && "Atención Clasificadores. Prepárense para la ronda rápida."}
                                {gameState?.current_round === 'Ronda 4' && "Ronda Final (4to Semestre). Listos para el contrarreloj."}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
