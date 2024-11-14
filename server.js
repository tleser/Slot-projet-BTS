const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const db = new sqlite3.Database('./database.db');

// Middleware pour parser les requêtes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware pour gérer les sessions
app.use(session({
    secret: 'ton_secret',
    resave: false,
    saveUninitialized: true,
}));

// Middleware pour servir des fichiers statiques (CSS, JS, images, etc.)
app.use(express.static('public'));

// Route pour la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour la page d'inscription
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Route pour la page de connexion
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route d'inscription
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Vérifie si le nom d'utilisateur et le mot de passe sont présents
    if (!username || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe sont requis' });
    }

    // Hachage du mot de passe avec bcrypt
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.log('Erreur lors du hachage du mot de passe:', err);  // Affiche l'erreur
            return res.status(500).json({ error: 'Erreur lors du hachage du mot de passe' });
        }

        // Vérifie si la table 'users' existe déjà dans la base de données
        db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, balance INTEGER DEFAULT 0)', function (err) {
            if (err) {
                console.log('Erreur lors de la création de la table:', err); // Affiche l'erreur de création
                return res.status(500).json({ error: 'Erreur lors de la création de la table' });
            }

            // Insérer les informations dans la base de données
            db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function (err) {
                if (err) {
                    console.log('Erreur lors de l\'insertion dans la base de données:', err); // Affiche l'erreur d'insertion
                    return res.status(500).json({ error: 'Erreur lors de l\'inscription' });
                }
                res.status(200).json({ message: 'Inscription réussie' });
            });
        });
    });
});

// Route de connexion
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe sont requis' });
    }

    // Vérifier les informations d'utilisateur dans la base de données
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.log('Erreur lors de la récupération de l\'utilisateur:', err);
            return res.status(500).json({ error: 'Erreur lors de la connexion' });
        }
        if (!row) {
            return res.status(400).json({ error: 'Utilisateur non trouvé' });
        }

        // Comparer les mots de passe avec bcrypt
        bcrypt.compare(password, row.password, (err, result) => {
            if (err) {
                console.log('Erreur lors de la comparaison des mots de passe:', err);
                return res.status(500).json({ error: 'Erreur lors de la vérification du mot de passe' });
            }
            if (!result) {
                return res.status(400).json({ error: 'Mot de passe incorrect' });
            }

            // Sauvegarder l'utilisateur dans la session
            req.session.userId = row.id;
            res.status(200).json({ message: 'Connexion réussie' });
        });
    });
});

// Route de profil (requiert une connexion)
app.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(400).json({ error: 'Utilisateur non connecté' });
    }

    db.get('SELECT username, balance FROM users WHERE id = ?', [req.session.userId], (err, row) => {
        if (err) {
            console.log('Erreur lors de la récupération du profil:', err);
            return res.status(500).json({ error: 'Erreur de récupération du profil' });
        }
        res.status(200).json(row);
    });
});

// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});