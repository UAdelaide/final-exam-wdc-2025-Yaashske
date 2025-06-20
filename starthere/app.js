const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql2/promise');
const session = require('express-session');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session setup
app.use(session({
  secret: 'dogwalksecret',
  resave: false,
  saveUninitialized: false
}));

let db;

(async () => {
  try {
    // Initial connection to create DB if not exists
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });
    await connection.query('CREATE DATABASE IF NOT EXISTS testdb');
    await connection.end();

    // Connect to the created database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'testdb'
    });

    // Sample test table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        author VARCHAR(255)
      )
    `);

    const [rows] = await db.execute('SELECT COUNT(*) AS count FROM books');
    if (rows[0].count === 0) {
      await db.execute(`
        INSERT INTO books (title, author) VALUES
        ('1984', 'George Orwell'),
        ('To Kill a Mockingbird', 'Harper Lee'),
        ('Brave New World', 'Aldous Huxley')
      `);
    }

  } catch (err) {
    console.error('⚠️ Error setting up DB: Make sure MySQL is running!', err);
  }
})();

// 🔍 TEST: Book route
app.get('/', async (req, res) => {
  try {
    const [books] = await db.execute('SELECT * FROM books');
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// 🔐 LOGIN route
