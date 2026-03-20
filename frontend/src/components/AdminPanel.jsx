import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

const API_URL = 'https://concurso-arancel.onrender.com/api';

export default function AdminPanel({ gameState }) {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [teams, setTeams] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('player');
        if (saved) {
            const p = JSON.parse(saved);
            if (p.role === 'admin') setIsAdmin(true);
            else navigate('/player');
        } else {
            navigate('/');
        }
        fetchTeams();
        fetchProducts();

        socket.on('teams_update', fetchTeams);
        socket.on('game_reset', fetchTeams); // Also fetch when game is reset (will empty the list)

        return () => {
            socket.off('teams_update', fetchTeams);
            socket.off('game_reset', fetchTeams);
        };
    }, [navigate]);

    const fetchTeams = async () => {
        try {
            const res = await fetch(API_URL + '/teams');
            const data = await res.json();
            setTeams(data);
        } catch (error) {
            console.error("Error fetching teams", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(API_URL + '/products');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products", error);
        }
    };

    const updateState = (round, block) => {
        socket.emit('admin_action', { action: 'set_round', payload: { round, block } });
    };

    const launchProduct = (product) => {
        socket.emit('admin_action', { action: 'launch_product', payload: { id: product.id, name: product.name } });
    };

    const launchBlock = (round, blockName, products) => {
        alert(`Boton presionado para bloque: ${blockName}. Enviando ${products.length} mercancias.`);
        console.log("AdminPanel: launching block", round, blockName, products);
        const ids = products.map(p => p.id);
        socket.emit('admin_action', { action: 'launch_block', payload: { ids, round, blockName } });
    };

    const resetGame = () => {
        if (window.confirm("¿Estás seguro de que quieres BORRAR TODOS LOS ESTADOS Y EQUIPOS y reiniciar el juego desde cero?")) {
            socket.emit('admin_action', { action: 'reset_game' });
        }
    };

    if (!isAdmin) return null;

    // Group products logically by round and by which student should be at the keyboard
    const vaultLayout = [
        {
            round: 'Ronda 1', blocks: [
                { name: 'Clasificador 1', range: [0, 10] },
                { name: 'Clasificador 2', range: [10, 20] },
                { name: 'Clasificador 3', range: [20, 30] }
            ]
        },
        {
            round: 'Ronda 2', isIva: true, blocks: [
                { name: 'Calculadores (4to Semestre)', range: [0, 12] }
            ]
        },
        {
            round: 'Ronda 3', blocks: [
                { name: 'Clasificador 1', range: [0, 5] },
                { name: 'Clasificador 2', range: [5, 10] },
                { name: 'Clasificador 3', range: [10, 15] }
            ]
        },
        {
            round: 'Ronda 4', blocks: [
                { name: 'Clasificador 1', range: [0, 5] },
                { name: 'Clasificador 2', range: [5, 10] },
                { name: 'Clasificador 3', range: [10, 15] }
            ]
        }
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '2rem', height: '100%', alignItems: 'start' }}>

            {/* Left Sidebar: Controls & Leaderboard */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="glass-card-dark" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ color: 'var(--accent-gold)', margin: 0, fontSize: '1.8rem' }}>Control Maestro</h2>
                        <button
                            onClick={resetGame}
                            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                            ⚠️ Reiniciar Juego
                        </button>
                    </div>
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '0.9rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem', fontWeight: 'bold' }}>📍 Controles Especiales</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <button className="btn-primary" style={{ background: '#3b82f6', fontSize: '0.9rem' }} onClick={() => socket.emit('admin_action', { action: 'set_welcome' })}>
                                🏠 Pantalla de Bienvenida
                            </button>
                            <button className="btn-primary" style={{ background: '#10b981', fontSize: '0.9rem' }} onClick={() => socket.emit('admin_action', { action: 'reveal_winner' })}>
                                🏆 Revelar Ganador Final
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Paso 1: Dinámica Pizarra</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <button className="btn-secondary" style={{ flex: '1 1 calc(50% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => updateState('Inicio', 'Instrucciones Generales')}>Reglas Generales</button>
                            <button className="btn-secondary" style={{ flex: '1 1 calc(50% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => updateState('Ronda 1', 'Reglas Ronda 1')}>Instrucciones R1</button>
                            <button className="btn-secondary" style={{ flex: '1 1 calc(50% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => updateState('Ronda 2', 'Reglas Ronda 2')}>Instrucciones R2</button>
                            <button className="btn-secondary" style={{ flex: '1 1 calc(50% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => updateState('Ronda 3', 'Reglas Ronda 3')}>Instrucciones R3</button>
                            <button className="btn-secondary" style={{ flex: '1 1 100%', padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => updateState('Ronda 4', 'Reglas Ronda 4')}>Instrucciones R4 (Final)</button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Paso 2: Activar Jugadores</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <button className="btn-secondary" style={{ flex: '1 1 calc(33% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)' }} onClick={() => updateState('Ronda 1', 'Clasificador 1 (10 items)')}>R1: Clasif. 1</button>
                            <button className="btn-secondary" style={{ flex: '1 1 calc(33% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)' }} onClick={() => updateState('Ronda 1', 'Clasificador 2 (10 items)')}>R1: Clasif. 2</button>
                            <button className="btn-secondary" style={{ flex: '1 1 calc(33% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)' }} onClick={() => updateState('Ronda 1', 'Clasificador 3 (10 items)')}>R1: Clasif. 3</button>

                            <button className="btn-secondary" style={{ flex: '1 1 100%', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.2)' }} onClick={() => updateState('Ronda 2', 'Calculadores (IVA)')}>R2: Calculadores IVA (4to Sem)</button>

                            <button className="btn-secondary" style={{ flex: '1 1 calc(33% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.2)' }} onClick={() => updateState('Ronda 3', 'Clasificador 1 (5 items)')}>R3: Clasif. 1</button>
                            <button className="btn-secondary" style={{ flex: '1 1 calc(33% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.2)' }} onClick={() => updateState('Ronda 3', 'Clasificador 2 (5 items)')}>R3: Clasif. 2</button>
                            <button className="btn-secondary" style={{ flex: '1 1 calc(33% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.2)' }} onClick={() => updateState('Ronda 3', 'Clasificador 3 (5 items)')}>R3: Clasif. 3</button>

                            <button className="btn-secondary" style={{ flex: '1 1 calc(33% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.2)', color: 'white' }} onClick={() => updateState('Ronda 4', 'Clasificador 1 (5 items)')}>R4: Cl. 1</button>
                            <button className="btn-secondary" style={{ flex: '1 1 calc(33% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.2)', color: 'white' }} onClick={() => updateState('Ronda 4', 'Clasificador 2 (5 items)')}>R4: Cl. 2</button>
                            <button className="btn-secondary" style={{ flex: '1 1 calc(33% - 0.5rem)', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.2)', color: 'white' }} onClick={() => updateState('Ronda 4', 'Clasificador 3 (5 items)')}>R4: Cl. 3</button>
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ color: 'var(--primary-blue)', marginBottom: '1rem', textAlign: 'center' }}>Tabla de Posiciones</h3>
                    <table className="leaderboard-table" style={{ fontSize: '1.1rem' }}>
                        <thead>
                            <tr>
                                <th>Top</th>
                                <th>Equipo</th>
                                <th>Puntos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...teams].sort((a, b) => b.score - a.score).map((t, idx) => (
                                <tr key={t.id} style={{ background: idx === 0 ? 'rgba(245, 158, 11, 0.1)' : 'transparent' }}>
                                    <td style={{ fontWeight: 'bold', color: idx === 0 ? 'var(--accent-gold)' : 'inherit' }}>#{idx + 1}</td>
                                    <td style={{ fontWeight: idx === 0 ? 'bold' : 'normal' }}>{t.name}</td>
                                    <td style={{ fontWeight: 'bold', color: 'var(--primary-blue)' }}>{t.score || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right Main Area: Projected Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Live Status Info Panel (compact alternative to the big visualizer) */}
                <div className="glass-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-beige)', borderLeft: '4px solid var(--accent-gold)' }}>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Proyectando Actual:</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                            {gameState?.product_name || (gameState?.current_block?.includes('Instrucciones') ? 'Instrucciones en Pantalla' : 'Nada seleccionado')}
                        </div>
                    </div>
                </div>

                {/* The Vault: Product Selection by Round (Only admin clicks these, audience sees them nicely laid out) */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h2 style={{ color: 'var(--primary-blue)', marginBottom: '2rem', textAlign: 'center' }}>Bóveda de Mercancías</h2>
                    <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>Selecciona una carta para proyectarla a los competidores. Las tarjetas ganadas se marcarán en verde.</p>

                    {vaultLayout.map(layout => {
                        const roundProducts = products.filter(p => p.round_info === layout.round);
                        if (roundProducts.length === 0) return null;

                        return (
                            <div key={layout.round} style={{ marginBottom: '3rem', background: 'rgba(255,255,255,0.3)', padding: '1.5rem', borderRadius: '12px' }}>
                                <h3 style={{ borderBottom: '2px solid var(--secondary-beige)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-blue)', fontSize: '1.5rem' }}>
                                    {layout.round} {layout.isIva && '(Cálculos de IVA)'}
                                </h3>

                                {layout.blocks.map(block => {
                                    const blockProducts = roundProducts.slice(block.range[0], block.range[1]);
                                    if (blockProducts.length === 0) return null;

                                    return (
                                        <div key={block.name} style={{ marginBottom: '2rem' }}>
                                            <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                Turno de: {block.name}
                                            </h4>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                                {layout.round === 'Ronda 3' ? (
                                                    <button
                                                        onClick={() => launchBlock(layout.round, block.name, blockProducts)}
                                                        style={{
                                                            background: 'var(--primary-blue)', color: 'white',
                                                            border: 'none', padding: '1.5rem', borderRadius: '8px', cursor: 'pointer',
                                                            textAlign: 'center', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                            gridColumn: '1 / -1'
                                                        }}
                                                        className="hover-card"
                                                    >
                                                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Lanzar Bloque de 5 Mercancías 🚀</div>
                                                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Los jugadores verán los 5 elementos simultáneamente</div>
                                                    </button>
                                                ) : (
                                                    blockProducts.map((p, index) => {
                                                        const isProjected = gameState?.active_product_id === p.id;
                                                        // Global index inside this round for display
                                                        const displayIndex = block.range[0] + index + 1;

                                                        return (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => launchProduct(p)}
                                                                style={{
                                                                    background: isProjected ? 'var(--primary-blue)' : 'white',
                                                                    color: isProjected ? 'white' : 'var(--text-dark)',
                                                                    border: isProjected ? 'none' : '1px solid #E5E7EB',
                                                                    padding: '1rem',
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer',
                                                                    textAlign: 'left',
                                                                    transition: 'all 0.2s',
                                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '0.5rem'
                                                                }}
                                                                className={!isProjected ? "hover-card" : ""}
                                                            >
                                                                <div style={{ fontSize: '1.1rem', fontWeight: 500, lineHeight: '1.3' }}>
                                                                    <span style={{ color: isProjected ? 'rgba(255,255,255,0.7)' : '#9ca3af', marginRight: '0.5rem', fontSize: '0.9rem' }}>#{displayIndex}</span>
                                                                    {p.name}
                                                                </div>

                                                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 'auto' }}>
                                                                    {isProjected && gameState?.winner_team_id
                                                                        ? `Gana: ${gameState.winner_team_name}`
                                                                        : 'Clic para Lanzar 🚀'
                                                                    }
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
