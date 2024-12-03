const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

// Créer une table pour les utilisateurs (id, username, mot de passe, solde)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      balance INTEGER DEFAULT 0
    )
  `);
});

module.exports = db;