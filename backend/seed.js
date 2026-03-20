const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const products = [
    // RONDA 1
    { round_info: 'Ronda 1', name: '🥑 Aguacates Frescos', correct_ligie: '0804.40.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🍬 Chicles', correct_ligie: '1704.10.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🥜 Aceite de ajonjolí', correct_ligie: '1515.50.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🍵 Té verde sin fermentar', correct_ligie: '0902.20.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '👖 Pantalones de mezclilla de mujer', correct_ligie: '6204.62.09.92', correct_iva: null },
    { round_info: 'Ronda 1', name: '☕ Café tostado de Veracruz', correct_ligie: '0901.21.02.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '👷 Casco de seguridad industrial', correct_ligie: '6506.10.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🚴 Bicicleta de carreras', correct_ligie: '8712.00.05.01', correct_iva: null },
    { round_info: 'Ronda 1', name: '🍌 Plátano', correct_ligie: '0803.90.99.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🍰 Palas para tarta', correct_ligie: '8215.10.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🏍️ Motocicleta', correct_ligie: '8711.20.05.99', correct_iva: null },
    { round_info: 'Ronda 1', name: '🥩 Carne de res fresca', correct_ligie: '0202.30.01', correct_iva: null },
    { round_info: 'Ronda 1', name: '☕ Cafeteras', correct_ligie: '8419.81.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🧄 Ajos', correct_ligie: '0703.20.02', correct_iva: null },
    { round_info: 'Ronda 1', name: '🍇 Uvas frescas', correct_ligie: '0806.10.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🧺 Lavadora', correct_ligie: '8450.11.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '⛳ Vehículos para campo de golf', correct_ligie: '8703.10.04.02', correct_iva: null },
    { round_info: 'Ronda 1', name: '🖊️ Bolígrafos', correct_ligie: '9608.10.02.99', correct_iva: null },
    { round_info: 'Ronda 1', name: '♨️ Horno de microondas', correct_ligie: '8516.50.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🧀 Queso fresco', correct_ligie: '0406.10.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '❄️ Refrigerador', correct_ligie: '8418.21.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🍎 Manzanas', correct_ligie: '0808.10.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🪚 Serruchos', correct_ligie: '8202.10.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🤿 Equipo de buceo', correct_ligie: '9020.00.03.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '👕 Planchas eléctricas', correct_ligie: '8516.40.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '💂‍♂️ Boinas', correct_ligie: '6505.00.04.02', correct_iva: null },
    { round_info: 'Ronda 1', name: '🧪 Vasos graduados', correct_ligie: '7017.10.99.01', correct_iva: null },
    { round_info: 'Ronda 1', name: '🍳 Estufas', correct_ligie: '8516.29.99.01', correct_iva: null },
    { round_info: 'Ronda 1', name: '💇‍♀️ Secadores para cabello', correct_ligie: '8516.31.01.00', correct_iva: null },
    { round_info: 'Ronda 1', name: '🍊 Naranjas', correct_ligie: '0805.10.01.00', correct_iva: null },

    // RONDA 2 (Calculadores) - Respuestas dadas como valor. 
    { round_info: 'Ronda 2', name: '🍳 Estufa - $14,500 MXN', correct_ligie: null, correct_iva: '2000' },
    { round_info: 'Ronda 2', name: '👷 Casco de seguridad - $3,045 MXN', correct_ligie: null, correct_iva: '420' },
    { round_info: 'Ronda 2', name: '💇‍♀️ Secadora - $3,190 MXN', correct_ligie: null, correct_iva: '440' },
    { round_info: 'Ronda 2', name: '🚴 Bicicleta - $5,800 MXN', correct_ligie: null, correct_iva: '800' },
    { round_info: 'Ronda 2', name: '♨️ Horno de microondas - $3,625 MXN', correct_ligie: null, correct_iva: '500' },
    { round_info: 'Ronda 2', name: '🤿 Equipo de buceo - $1,450 MXN', correct_ligie: null, correct_iva: '200' },
    { round_info: 'Ronda 2', name: '🏍️ Motocicleta - $11,600 MXN', correct_ligie: null, correct_iva: '1600' },
    { round_info: 'Ronda 2', name: '🍬 Chiclets - $7.25 MXN', correct_ligie: null, correct_iva: '1' },
    { round_info: 'Ronda 2', name: '👖 Pantalón de mezclilla - $725 MXN', correct_ligie: null, correct_iva: '100' },
    { round_info: 'Ronda 2', name: '🍰 Pala para cortar - $580 MXN', correct_ligie: null, correct_iva: '80' },
    { round_info: 'Ronda 2', name: '☕ Cafetera - $4,060 MXN', correct_ligie: null, correct_iva: '560' },
    { round_info: 'Ronda 2', name: '🧺 Lavadora - $7,250 MXN', correct_ligie: null, correct_iva: '1000' },

    // RONDA 3 (Antes 2.5)
    { round_info: 'Ronda 3', name: '🍓 Yogur con cereales de diferente sabor', correct_ligie: '0403.20.01.00', correct_iva: null },
    { round_info: 'Ronda 3', name: '🧥 Sudaderas para hombres y mujeres', correct_ligie: '6110.20.05.03', correct_iva: null },
    { round_info: 'Ronda 3', name: '📖 Libro de literatura universal', correct_ligie: '4901.99.91', correct_iva: null },
    { round_info: 'Ronda 3', name: '🗺️ Planos y dibujos topográficos originales', correct_ligie: '4906.00.01', correct_iva: null },
    { round_info: 'Ronda 3', name: '🍆 Berenjenas', correct_ligie: '0709.30.01.00', correct_iva: null },
    { round_info: 'Ronda 3', name: '🌶️ Chile poblano', correct_ligie: '0709.60.99.04', correct_iva: null },
    { round_info: 'Ronda 3', name: '🫘 Frijol negro', correct_ligie: '0713.33.99.02', correct_iva: null },
    { round_info: 'Ronda 3', name: '🍑 Ciruelas deshuesadas (orejones)', correct_ligie: '0813.20.02.01', correct_iva: null },
    { round_info: 'Ronda 3', name: '🏺 Floreros', correct_ligie: '7013.99.99.01', correct_iva: null },
    { round_info: 'Ronda 3', name: '🧫 Frascos para el cultivo de microbios', correct_ligie: '7017.10.07.00', correct_iva: null },
    { round_info: 'Ronda 3', name: '🕯️ Portavelas', correct_ligie: '7013.99.99.02', correct_iva: null },
    { round_info: 'Ronda 3', name: '⛓️‍💥 Alambre de púas, de hierro o acero', correct_ligie: '7313.00.01.00', correct_iva: null },
    { round_info: 'Ronda 3', name: '🛏️ Mesas de operaciones', correct_ligie: '9402.90.01.00', correct_iva: null },
    { round_info: 'Ronda 3', name: '💻 Estaciones de trabajo', correct_ligie: '9403.60.03.00', correct_iva: null },
    { round_info: 'Ronda 3', name: '🧘‍♀️ Colchonetas', correct_ligie: '9404.21.02.01', correct_iva: null },

    // CUARTA RONDA
    { round_info: 'Ronda 4', name: '🪜 Escaleras', correct_ligie: '7616.99.13.00', correct_iva: null },
    { round_info: 'Ronda 4', name: '🌪️ Licuadoras', correct_ligie: '8509.40.99.01', correct_iva: null },
    { round_info: 'Ronda 4', name: '🍲 Lentejas', correct_ligie: '0713.40.01.00', correct_iva: null },
    { round_info: 'Ronda 4', name: '🍊 Toronjas y pomelos', correct_ligie: '0805.40.01.00', correct_iva: null },
    { round_info: 'Ronda 4', name: '🍓 Fresas orgánicas', correct_ligie: '0810.10.01.01', correct_iva: null },
    { round_info: 'Ronda 4', name: '🥤 Vasos de bambú', correct_ligie: '4823.61.01.00', correct_iva: null },
    { round_info: 'Ronda 4', name: '🐠 Peceras', correct_ligie: '7013.99.99.03', correct_iva: null },
    { round_info: 'Ronda 4', name: '💎 Diamantes', correct_ligie: '7104.21.01.00', correct_iva: null },
    { round_info: 'Ronda 4', name: '💈 Sillón de peluquería', correct_ligie: '9402.10.99.00', correct_iva: null },
    { round_info: 'Ronda 4', name: '🏕️ Sacos o bolsas de dormir', correct_ligie: '9404.30.01.00', correct_iva: null },
    { round_info: 'Ronda 4', name: '🧸 Peluches de animales rellenos', correct_ligie: '9503.00.12.00', correct_iva: null },
    { round_info: 'Ronda 4', name: '🎈 Globos de plástico metalizados', correct_ligie: '9503.00.23.01', correct_iva: null },
    { round_info: 'Ronda 4', name: '🎴 Naipes', correct_ligie: '9504.40.01.00', correct_iva: null },
    { round_info: 'Ronda 4', name: '⛳ Pelotas de golf', correct_ligie: '9506.32.01.00', correct_iva: null },
    { round_info: 'Ronda 4', name: '🤸‍♂️ Trampolines', correct_ligie: '9506.99.05.00', correct_iva: null }
];

db.serialize(() => {
    db.run("DELETE FROM products");
    const stmt = db.prepare("INSERT INTO products (name, correct_ligie, correct_iva, round_info) VALUES (?, ?, ?, ?)");

    for (const p of products) {
        stmt.run(p.name, p.correct_ligie, p.correct_iva, p.round_info);
    }

    stmt.finalize();
    console.log("Database seeded successfully with", products.length, "products.");
});

db.close();
