// server.js
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } from './config.js';

// Definir __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = express();
const port = process.env.PORT || 3001;

// Middleware
server.use(express.json());
server.use(cors({ origin: '*' }));

// Conexión a MySQL
const connection = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT
});

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'imagenes')); // carpeta local 'imagenes'
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// ================= Endpoints =================

// GET /posts
server.get('/posts', (req, res) => {
  connection.query('SELECT * FROM posts ORDER BY fecha DESC', (err, results) => {
    if (err) return res.status(500).send('Error en la base de datos');
    res.json(results);
  });
});

// POST /nuevoPost
server.post('/nuevoPost', upload.single('imagen'), (req, res) => {
  const { titulo, contenido } = req.body;
  const imagen = req.file.filename;

  if (!titulo || !contenido)
    return res.status(400).json({ message: 'Faltan datos obligatorios' });

  connection.query(
    'INSERT INTO posts (titulo, contenido, imagen) VALUES (?, ?, ?)',
    [titulo, contenido, imagen],
    (err) => {
      if (err) return res.status(500).json({ message: 'Error en el servidor' });
      res.json({ message: 'Publicación realizada' });
    }
  );
});

// GET /post/:id
server.get('/post/:id', (req, res) => {
  const { id } = req.params;
  connection.query('SELECT * FROM posts WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).send('Error en la base de datos');
    if (results.length === 0) return res.status(404).send('Post no encontrado');
    res.json(results[0]);
  });
});

// DELETE /delete/:id
server.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  const { imagen } = req.query;

  connection.query('DELETE FROM posts WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send('Error en la base de datos');

    if (imagen) {
      const imagePath = path.join(__dirname, 'imagenes', imagen);
      fs.unlink(imagePath, err => {
        if (err) console.error('Error al eliminar la imagen:', err);
      });
    }

    res.send('Post borrado');
  });
});

// PUT /postEdited/:id
server.put('/postEdited/:id', upload.single('imagen'), (req, res) => {
  const { id } = req.params;
  const { titulo, contenido, imagenAnterior } = req.body;
  const imagen = req.file ? req.file.filename : imagenAnterior;

  connection.query(
    'UPDATE posts SET titulo = ?, contenido = ?, imagen = ? WHERE id = ?',
    [titulo, contenido, imagen, id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar el post' });
      if (results.affectedRows === 0) return res.status(404).json({ error: 'Post no encontrado' });

      if (req.file && imagenAnterior) {
        const imagePath = path.join(__dirname, 'imagenes', imagenAnterior);
        fs.unlink(imagePath, err => {
          if (err) console.error('Error al eliminar la imagen anterior:', err);
        });
      }

      res.json({ message: 'Post actualizado con éxito' });
    }
  );
});

// Iniciar servidor
server.listen(port, () => {
  console.log(`Servidor iniciado en el puerto ${port}`);
});
