// server.js
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } from './config.js';

const server = express();
const port = process.env.PORT || 3001; // Render define la variable PORT

server.use(express.json());
server.use(cors());

// Conexión a MySQL
const connection = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT
});

// Multer para subir imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'imagenes')); // crea carpeta imagenes en el proyecto
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Endpoints

// GET /posts
server.get('/posts', (req, res) => {
  const query = 'SELECT * FROM posts ORDER BY fecha DESC';
  connection.query(query, (error, results) => {
    if (error) return res.status(500).send('Error en la base de datos');
    res.json(results);
  });
});

// POST /nuevoPost
server.post('/nuevoPost', upload.single('imagen'), (req, res) => {
  const { titulo, contenido } = req.body;
  const imagen = req.file ? req.file.filename : null;

  if (!titulo || !contenido || !imagen) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  const query = 'INSERT INTO posts (titulo, contenido, imagen) VALUES (?, ?, ?)';
  connection.query(query, [titulo, contenido, imagen], (error, results) => {
    if (error) return res.status(500).json({ message: 'Error en el servidor' });
    res.json({ message: 'Publicación realizada' });
  });
});

// GET /post/:id
server.get('/post/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM posts WHERE id = ?';
  connection.query(query, [id], (error, results) => {
    if (error) return res.status(500).send('Error en la base de datos');
    if (results.length === 0) return res.status(404).send('Post no encontrado');
    res.json(results[0]);
  });
});

// DELETE /delete/:id
server.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  const { imagen } = req.query;

  const deleteQuery = 'DELETE FROM posts WHERE id = ?';
  connection.query(deleteQuery, [id], (error) => {
    if (error) return res.status(500).send('Error en la base de datos');

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

  const query = 'UPDATE posts SET titulo = ?, contenido = ?, imagen = ? WHERE id = ?';
  connection.query(query, [titulo, contenido, imagen, id], (error, results) => {
    if (error) return res.status(500).json({ error: 'Error al actualizar el post' });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Post no encontrado' });

    if (req.file && imagenAnterior) {
      const imagePath = path.join(__dirname, 'imagenes', imagenAnterior);
      fs.unlink(imagePath, err => {
        if (err) console.error('Error al eliminar la imagen anterior:', err);
      });
    }

    res.json({ message: 'Post actualizado con éxito' });
  });
});

// Iniciar servidor
server.listen(port, () => {
  console.log(`Servidor iniciado en el puerto ${port}`);
});
