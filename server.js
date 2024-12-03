const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

// Initialisation de l'application Express
const app = express();

// Configuration de SQLite
const db = new sqlite3.Database('database.db');

// Middleware pour parser les requêtes JSON et les données de formulaire
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration de la session pour la gestion de la connexion utilisateur
app.use(session({
    secret: 'secret-key', // Clé secrète pour la session
    resave: false,
    saveUninitialized: true
}));

// Middleware pour servir des fichiers statiques (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Configuration de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route d'accueil (page de connexion)
app.get('/', (req, res) => {
    res.render('login');
});

// Route pour la page d'inscription
app.get('/register', (req, res) => {
    res.render('register');
});

// Route pour traiter les données d'inscription
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (user) {
            return res.status(400).send('Nom d\'utilisateur déjà pris');
        }

        // Hasher le mot de passe avec bcrypt
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).send('Erreur lors du hashing du mot de passe');

            // Insérer l'utilisateur avec un solde de 1000 par défaut
            db.run('INSERT INTO users (username, password, balance) VALUES (?, ?, ?)', [username, hashedPassword, 1000], function (err) {
                if (err) return res.status(500).send('Erreur lors de l\'inscription');

                // Connexion automatique de l'utilisateur après l'inscription
                req.session.user = { id: this.lastID, username, balance: 1000 };
                res.redirect('/game');  // Redirection vers la page de jeu
            });
        });
    });
});

// Route pour la page de connexion
app.get('/login', (req, res) => {
    res.render('login');
});

// Route pour traiter les données de connexion
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Vérifier si l'utilisateur existe dans la base de données
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err || !user) {
            return res.status(401).send('Utilisateur non trouvé');
        }

        // Comparer le mot de passe envoyé avec celui en base de données
        bcrypt.compare(password, user.password, (err, result) => {
            if (err || !result) {
                return res.status(401).send('Mot de passe incorrect');
            }

            // Sauvegarder l'utilisateur dans la session
            req.session.user = { id: user.id, username: user.username, balance: user.balance };
            res.redirect('/game');
        });
    });
});

app.get('/game', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const userId = req.session.user.id;

    db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
        if (err || !row) {
            return res.status(500).send('Erreur lors du chargement de la page de jeu');
        }

        // Charger le solde depuis la base de données
        res.render('game', { userBalance: row.balance });
    });
});

app.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const userId = req.session.user.id;

    // Récupérer les informations à jour depuis la base de données
    db.get('SELECT username, balance FROM users WHERE id = ?', [userId], (err, row) => {
        if (err || !row) {
            return res.status(500).send('Erreur lors de la récupération des données du profil');
        }

        // Rendre la vue avec les données à jour
        res.render('profile', {
            username: row.username,
            balance: row.balance
        });
    });
});

// Route pour déconnecter l'utilisateur
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/'); // Redirige vers la page d'accueil après la déconnexion
    });
});

// Route pour récupérer le solde actuel de l'utilisateur (API)
app.get('/api/user/balance', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Utilisateur non connecté' });
    }

    const userId = req.session.user.id;
    db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la récupération du solde' });
        }
        res.json({ balance: row.balance });
    });
});

// Route pour mettre à jour le solde après chaque tour de jeu
app.post('/api/user/update-balance', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Utilisateur non connecté' });
    }

    const userId = req.session.user.id;
    const newBalance = req.body.balance;

    db.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du solde' });
        }
        res.json({ balance: newBalance });
    });
});

// Route pour enregistrer le score (résultats du jeu) dans la base de données
app.post('/api/scores', (req, res) => {
    const { result, win } = req.body;
    if (!req.session.user) {
        return res.status(401).send('Utilisateur non connecté');
    }

    const userId = req.session.user.id;
    db.run('INSERT INTO scores (user_id, result, win) VALUES (?, ?, ?)', [userId, result, win ? 1 : 0], function (err) {
        if (err) return res.status(500).send('Erreur lors de l\'enregistrement du score');
        res.status(200).send('Score enregistré');
    });
});

// Démarrer le serveur sur le port 3000
app.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});