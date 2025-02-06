const express = require('express');
const mysql = require('mysql2');
require('dotenv').config(); //

const app = express();
const port = 3000;

// Database conf
const dbConfig = {
  host: process.env.DB_HOST, // Use environment variables
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

let db; // Declare db variable here
let connectionAttempts = 0;
const maxAttempts = 3;
const retryDelay = 10000; // 10 seconds

function connectToDatabase() {
  db = mysql.createConnection(dbConfig); // Initialize db connection

  db.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      connectionAttempts++;
      if (connectionAttempts < maxAttempts) {
        console.log(`Retrying connection in ${retryDelay / 1000} seconds...`);
        setTimeout(connectToDatabase, retryDelay);
      } else {
        console.error('Failed to connect to the database after 3 attempts.');
      }
    } else {
      console.log('Connected to the MySQL database.');
    }
  });
}

connectToDatabase();

app.get('/data', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
