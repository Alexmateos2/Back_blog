import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } from './config.js';
import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
  });

  try {
    const [rows] = await connection.execute('SELECT * FROM posts ORDER BY fecha DESC');
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en la base de datos' });
  } finally {
    await connection.end();
  }
}
