const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let countdownInterval = null;
let ronda4Timer = null;

process.on('uncaughtException', (err) => {
    console.error('ERROR CRITICO:', err.message);
    console.error(err.stack);
    process.exit(1);
});

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('ERROR abriendo base de datos:', err.message);
        process.exit(1);
    }
    console.log('Base de datos abierta en:', dbPath);
});

// Initialize DB schema
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    score INTEGER DEFAULT 0
  )`);
    db.run(`CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    team_id INTEGER, 
    role TEXT
  )`);
    db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    correct_ligie TEXT, 
    correct_iva TEXT, 
    round_info TEXT
  )`);
    db.run(`CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    player_id INTEGER, 
    product_id INTEGER, 
    answer TEXT, 
    is_correct BOOLEAN, 
    time_taken INTEGER
  )`);
    db.run(`CREATE TABLE IF NOT EXISTS game_state (
    id INTEGER PRIMARY KEY,
    current_round TEXT,
    current_block TEXT,
    active_product_id INTEGER,
    product_name TEXT,
    correct_ligie TEXT,
    correct_iva TEXT,
    screen_mode TEXT DEFAULT 'instructions',
    winner_team_id INTEGER,
    winner_team_name TEXT,
    timer_started_at TIMESTAMP
  )`);

    db.run("ALTER TABLE game_state ADD COLUMN active_block_data TEXT", (err) => { });
    db.run("ALTER TABLE game_state ADD COLUMN winner_score INTEGER", (err) => { });

    // Insert initial game state if empty
    db.get("SELECT COUNT(*) as count FROM game_state", (err, row) => {
        if (row && row.count === 0) {
            db.run("INSERT INTO game_state (id, current_round, current_block) VALUES (1, 'Bloque 1', 'Esperando inicio de moderador...')");
        }
    });
});

// APIs
app.get('/api/state', (req, res) => {
    db.get("SELECT * FROM game_state WHERE id = 1", (err, row) => {
        res.json(row || {});
    });
});

app.get('/api/teams', (req, res) => {
    db.all("SELECT * FROM teams", (err, rows) => {
        res.json(rows || []);
    });
});

app.post('/api/teams', (req, res) => {
    const { name } = req.body;
    db.run("INSERT INTO teams (name) VALUES (?)", [name], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        io.emit('teams_update');
        res.json({ id: this.lastID, name });
    });
});

app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", (err, rows) => {
        res.json(rows || []);
    });
});

// Socket.io connections for real-time state
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Send current state on connection
    db.get("SELECT * FROM game_state WHERE id = 1", (err, row) => {
        if (row) socket.emit('state_update', row);
    });

    socket.on('admin_action', ({ action, payload }) => {
        if (action === 'set_round') {
            db.run("UPDATE game_state SET current_round = ?, current_block = ?, active_product_id = NULL, product_name = NULL, correct_ligie = NULL, correct_iva = NULL, active_block_data = NULL, screen_mode = 'instructions', winner_team_id = NULL, winner_team_name = NULL, winner_score = NULL WHERE id = 1", [payload.round, payload.block], (err) => {
                if (!err) {
                    db.get("SELECT * FROM game_state WHERE id = 1", (err, row) => {
                        io.emit('state_update', row);
                    });
                }
            });
        } else if (action === 'set_welcome') {
            db.run("UPDATE game_state SET current_round = 'BIENVENIDA', current_block = 'INICIO', product_name = 'PRIMER CONCURSO DE CLASIFICACIÓN ARANCELARIA', active_product_id = NULL, correct_ligie = NULL, correct_iva = NULL, active_block_data = NULL, screen_mode = 'welcome', winner_team_id = NULL, winner_team_name = NULL, winner_score = NULL, timer_started_at = NULL WHERE id = 1", () => {
                db.get("SELECT * FROM game_state WHERE id = 1", (err, row) => {
                    io.emit('state_update', row);
                });
            });
        } else if (action === 'reveal_winner') {
            db.all("SELECT * FROM teams ORDER BY score DESC LIMIT 1", (err, rows) => {
                if (err || rows.length === 0) return;
                const topTeam = rows[0];
                db.run("UPDATE game_state SET screen_mode = 'winner_reveal', winner_team_id = ?, winner_team_name = ?, winner_score = ? WHERE id = 1",
                    [topTeam.id, topTeam.name, topTeam.score], () => {
                        db.get("SELECT * FROM game_state WHERE id = 1", (err, row) => {
                            io.emit('state_update', row);
                        });
                    });
            });
        } else if (action === 'launch_product') {
            db.get("SELECT * FROM products WHERE id = ?", [payload.id], (err, product) => {
                if (product) {
                    if (countdownInterval) clearInterval(countdownInterval);

                    let count = 3;
                    io.emit('countdown', count);

                    countdownInterval = setInterval(() => {
                        count--;
                        if (count > 0) {
                            io.emit('countdown', count);
                        } else {
                            clearInterval(countdownInterval);
                            countdownInterval = null;
                            io.emit('countdown', 0); // Terminar overlay

                            if (ronda4Timer) clearTimeout(ronda4Timer);

                            const now = Date.now();
                            db.run("UPDATE game_state SET active_product_id = ?, product_name = ?, correct_ligie = ?, correct_iva = ?, screen_mode = 'playing', winner_team_id = NULL, winner_team_name = NULL, timer_started_at = ?, current_round = ? WHERE id = 1",
                                [product.id, product.name, product.correct_ligie, product.correct_iva, now, product.round_info], (err) => {
                                    if (!err) {
                                        db.run("DELETE FROM answers", () => {
                                            db.get("SELECT * FROM game_state WHERE id = 1", (err, row) => {
                                                io.emit('state_update', row);

                                                // Start 35s timer for Ronda 4
                                                if (product.round_info === 'Ronda 4') {
                                                    console.log("Starting 35s timer for Ronda 4...");
                                                    ronda4Timer = setTimeout(() => {
                                                        db.get("SELECT winner_team_id FROM game_state WHERE id = 1", (err, state) => {
                                                            if (!state.winner_team_id) {
                                                                console.log("Time up for Ronda 4! Locking round.");
                                                                db.run("UPDATE game_state SET winner_team_id = -1, winner_team_name = 'TIEMPO AGOTADO' WHERE id = 1", () => {
                                                                    db.get("SELECT * FROM game_state WHERE id = 1", (err, row) => {
                                                                        io.emit('state_update', row);
                                                                    });
                                                                });
                                                            }
                                                        });
                                                    }, 35000);
                                                }
                                            });
                                        });
                                    }
                                });
                        }
                    }, 1000);
                }
            });
        } else if (action === 'launch_block') {
            const { ids, round, blockName } = payload;
            console.log(`[R3 DEBUG] Launching block: ${blockName} with IDs: ${ids}`);

            const placeholders = ids.map(() => '?').join(',');
            db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, ids, (err, products) => {
                if (err) {
                    console.error("[R3 DEBUG] Error fetching products:", err);
                    return;
                }
                if (!products || products.length === 0) {
                    console.log("[R3 DEBUG] No products found for IDs:", ids);
                    return;
                }

                console.log(`[R3 DEBUG] Found ${products.length} products. Starting countdown...`);
                products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

                if (countdownInterval) clearInterval(countdownInterval);

                let count = 3;
                io.emit('countdown', count);

                countdownInterval = setInterval(() => {
                    count--;
                    if (count > 0) {
                        io.emit('countdown', count);
                    } else {
                        clearInterval(countdownInterval);
                        countdownInterval = null;
                        io.emit('countdown', 0);

                        const now = Date.now();
                        console.log(`[R3 DEBUG] Finalizing launch. Updating DB for ${round} - ${blockName}`);

                        db.run("UPDATE game_state SET active_product_id = NULL, product_name = NULL, correct_ligie = NULL, correct_iva = NULL, active_block_data = ?, screen_mode = 'playing', winner_team_id = NULL, winner_team_name = NULL, timer_started_at = ?, current_round = ?, current_block = ? WHERE id = 1",
                            [JSON.stringify(products), now, round, blockName], (err) => {
                                if (err) {
                                    console.error("[R3 DEBUG] Error updating game_state:", err);
                                    return;
                                }
                                db.run("DELETE FROM answers", () => {
                                    db.get("SELECT * FROM game_state WHERE id = 1", (err, row) => {
                                        console.log("[R3 DEBUG] Emitting state_update. Data present:", !!row.active_block_data);
                                        io.emit('state_update', row);
                                    });
                                });
                            });
                    }
                }, 1000);
            });
        } else if (action === 'reset_game') {
            db.serialize(() => {
                db.run("DELETE FROM teams");
                db.run("DELETE FROM answers");
                db.run("UPDATE game_state SET current_round = 'Bloque 1', current_block = 'Esperando inicio de moderador...', active_product_id = NULL, product_name = NULL, correct_ligie = NULL, correct_iva = NULL, active_block_data = NULL, screen_mode = 'instructions', winner_team_id = NULL, winner_team_name = NULL, timer_started_at = NULL WHERE id = 1");

                db.get("SELECT * FROM game_state WHERE id = 1", (err, row) => {
                    io.emit('state_update', row);
                    io.emit('game_reset'); // Signal clients to refetch teams
                });
            });
        }
    });

    socket.on('submit_answer', (data) => {
        if (!data.teamId) return;

        db.get("SELECT * FROM game_state WHERE id = 1", (err, state) => {
            if (err || !state) return;
            if (state.winner_team_id) return; // Ya alguien ganó este producto

            if (state.current_round === 'Ronda 3') {
                if (!state.active_block_data) return;
                let blockProducts = [];
                try { blockProducts = JSON.parse(state.active_block_data); } catch (e) { console.error("JSON parse error in submit_answer:", e); return; }

                if (!data.answers || !Array.isArray(data.answers)) return;

                let allCorrect = true;
                for (let i = 0; i < blockProducts.length; i++) {
                    const p = blockProducts[i];
                    const cleanUserAns = (data.answers[i] || '').replace(/\D/g, '');
                    const cleanCorrectAns = (p.correct_ligie || '').replace(/\D/g, '');

                    if (!cleanUserAns || cleanUserAns !== cleanCorrectAns) {
                        allCorrect = false;
                        break;
                    }
                }

                if (allCorrect) {
                    const now = Date.now();
                    db.run("UPDATE teams SET score = score + 10 WHERE id = ?", [data.teamId], () => {
                        io.emit('teams_update');
                    });
                    db.run("UPDATE game_state SET winner_team_id = ?, winner_team_name = ?, timer_started_at = NULL WHERE id = 1", [data.teamId, data.teamName], (updateErr) => {
                        if (!updateErr) {
                            if (ronda4Timer) {
                                clearTimeout(ronda4Timer);
                                ronda4Timer = null;
                            }
                            db.get("SELECT * FROM game_state WHERE id = 1", (err2, newState) => {
                                io.emit('state_update', newState);
                            });
                        }
                    });
                } else {
                    socket.emit('wrong_answer');
                }
            } else {
                // Normalize: remove non-digits for both LIGIE and IVA comparisons
                const cleanUserAns = (data.answer || '').replace(/\D/g, '');
                const isLigie = state.current_round !== 'Ronda 2';
                let correctAnswer = isLigie ? state.correct_ligie : state.correct_iva;

                if (!correctAnswer) return;
                const cleanCorrectAns = correctAnswer.replace(/\D/g, '');

                if (cleanUserAns === cleanCorrectAns && cleanUserAns !== '') {
                    db.run("UPDATE teams SET score = score + 10 WHERE id = ?", [data.teamId], () => {
                        io.emit('teams_update');
                    });
                    db.run("UPDATE game_state SET winner_team_id = ?, winner_team_name = ?, timer_started_at = NULL WHERE id = 1", [data.teamId, data.teamName], (updateErr) => {
                        if (!updateErr) {
                            if (ronda4Timer) {
                                clearTimeout(ronda4Timer);
                                ronda4Timer = null;
                            }
                            db.get("SELECT * FROM game_state WHERE id = 1", (err2, newState) => {
                                io.emit('state_update', newState);
                            });
                        }
                    });
                } else {
                    socket.emit('wrong_answer');
                }
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log('Backend corriendo en puerto ' + PORT);
});
