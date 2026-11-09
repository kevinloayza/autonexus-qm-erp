const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_NAME || 'qm_mechanics',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
});

// GET: Obtener todos los lotes
app.get('/api/lots', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM inspection_lots ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Obtener métricas para los KPIs
app.get('/api/metrics', async (req, res) => {
    try {
        const [total] = await db.query('SELECT COUNT(*) as count FROM inspection_lots');
        const [released] = await db.query('SELECT COUNT(*) as count FROM inspection_lots WHERE status = "Liberado"');
        const [rejected] = await db.query('SELECT COUNT(*) as count FROM inspection_lots WHERE status = "Rechazado"');
        
        res.json({
            total_lots: total[0].count,
            released: released[0].count,
            rejected: rejected[0].count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Registrar un nuevo lote (CREAR)
app.post('/api/lots', async (req, res) => {
    const { material_name, batch_no, inspector } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO inspection_lots (material_name, batch_no, status, defect_reason, inspector) VALUES (?, ?, "Pendiente", NULL, ?)',
            [material_name, batch_no, inspector]
        );
        res.status(201).json({ id: result.insertId, message: 'Lote registrado con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT: Actualizar estado de un lote (EDITAR)
app.put('/api/lots/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, defect_reason } = req.body;
    try {
        await db.query(
            'UPDATE inspection_lots SET status = ?, defect_reason = ? WHERE id = ?',
            [status, defect_reason || null, id]
        );
        res.json({ message: 'Estado actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend QM corriendo en puerto ${PORT}`);
});