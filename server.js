import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } from './config.js';
import mysql from 'mysql2/promise';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Multer para manejar la subida de archivos (usa /tmp para serverless)
const storage = multer.memoryStorage(); // no escribe en disco en Vercel
const upload = multer({ storage: storage });

export default async function handler(req, res) {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
  });

  const url = req.url;
  const method = req.method;

  try {
    // GET /posts
    if (url === '/posts' && method === 'GET') {
      const [rows] = await connection.execute('SELECT * FROM posts ORDER BY fecha DESC');
      return res.status(200).json(rows);
    }

    // POST /nuevoPost
    if (url === '/nuevoPost' && method === 'POST') {
      // Multer + lógica para subir imagen desde req
      return res.status(200).json({ message: 'Aquí va la lógica de nuevoPost' });
    }

    // GET /post/:id
    if (url.startsWith('/post/') && method === 'GET') {
      const id = url.split('/')[2];
      const [rows] = await connection.execute('SELECT * FROM posts WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Post no encontrado' });
      return res.status(200).json(rows[0]);
    }

    // DELETE /delete/:id
    if (url.startsWith('/delete/') && method === 'DELETE') {
      const id = url.split('/')[2];
      await connection.execute('DELETE FROM posts WHERE id = ?', [id]);
      return res.status(200).json({ message: 'Post borrado' });
    }

    // PUT /postEdited/:id
    if (url.startsWith('/postEdited/') && method === 'PUT') {
      const id = url.split('/')[2];
      return res.status(200).json({ message: 'Aquí va la lógica de editar post' });
    }

    // Ruta no encontrada
    return res.status(404).json({ error: 'Ruta no encontrada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error en el servidor' });
  } finally {
    await connection.end();
  }
}
