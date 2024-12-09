const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fichas_db',
    password: 'teste1234',
    port: 5432,
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Endpoint para criar uma ou várias fichas
app.post('/api/fichas', async (req, res) => {
    const fichasToCreate = Array.isArray(req.body) ? req.body : [req.body];

    try {
        const query = 'INSERT INTO fichas (name, cpf, description, status) VALUES ($1, $2, $3, $4) RETURNING *';
        const client = await pool.connect();

        const createdFichas = [];
        for (const ficha of fichasToCreate) {
            const { name, cpf, description, status } = ficha;
            if (!name || !cpf || !description || !status) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
            }

            const result = await client.query(query, [name, cpf, description, status]);
            createdFichas.push(result.rows[0]);
        }

        client.release();
        res.status(201).json(createdFichas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar fichas no banco de dados.' });
    }
});

// Endpoint para listar todas as fichas
app.get('/api/fichas', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM fichas');
        client.release();
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar fichas no banco de dados.' });
    }
});

// Endpoint para atualizar uma ficha
app.put('/api/fichas/:id', async (req, res) => {
    const { id } = req.params;
    const { name, cpf, description, status } = req.body;

    if (!name || !cpf || !description || !status) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        const query = 'UPDATE fichas SET name = $1, cpf = $2, description = $3, status = $4 WHERE id = $5 RETURNING *';
        const client = await pool.connect();
        const result = await client.query(query, [name, cpf, description, status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ficha não encontrada.' });
        }

        client.release();
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar ficha no banco de dados.' });
    }
});

// Endpoint para deletar múltiplas fichas
app.delete('/api/fichas', async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'É necessário enviar um array de IDs.' });
    }

    try {
        const query = 'DELETE FROM fichas WHERE id = ANY($1) RETURNING *';
        const client = await pool.connect();
        const result = await client.query(query, [ids]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Nenhuma ficha encontrada para deletar.' });
        }

        client.release();
        res.status(200).json({ message: 'Fichas deletadas com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar fichas no banco de dados.' });
    }
});

// Inicia o servidor na porta especificada
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
