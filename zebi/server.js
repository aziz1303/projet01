const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const session = require('express-session'); // Importer le module de session

const PORT = 3002;
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const gameCodes = {}; // Utilisation d'un objet pour stocker les codes des parties

// Middleware pour permettre les requêtes cross-origin
app.use(cors());
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false })); // Configuration de la session
app.use(express.static('C:\\Users\\salem\\OneDrive\\Documents\\infotronique1\\mrwhite'));

// Définir la route pour gérer la requête GET pour l'URL racine
app.get('/', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html')); // Envoyer le fichier HTML principal
});

// Gestionnaire de route pour obtenir le code de partie
app.get('/game-code', (req, res) => {
  // Générer un code de partie unique
  const gameCode = generateGameCode();
  
  // Stocker le code de partie associé à la session de l'utilisateur
  req.session.gameCode = gameCode;

  // Stocker le code de partie associé à la partie actuelle
  gameCodes[gameCode] = { numPlayers: 5, playerNames: ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'] };

  // Répondre avec le code de partie
  res.status(200).json({ success: true, gameCode });
});

// Gestionnaire de route pour la création de partie
app.post('/create-game', (req, res) => {
  // Récupérer les données envoyées depuis le client
  const { numPlayers, playerNames } = req.body;

  // Vérifier si le nombre de joueurs est valide
  if (numPlayers < 3 || numPlayers > 10) {
    return res.status(400).json({ success: false, message: 'Le nombre de joueurs doit être compris entre 3 et 10' });
  }

  // Vérifier si tous les pseudos des joueurs ont été fournis
  if (!playerNames || playerNames.length !== numPlayers) {
    return res.status(400).json({ success: false, message: 'Veuillez fournir un pseudo pour chaque joueur' });
  }
  
  // Générer un code de partie unique
  const gameCode = generateGameCode();

  // Stocker le code de partie associé à la partie actuelle
  gameCodes[gameCode] = { numPlayers, playerNames };

  // Répondre avec le code de partie et d'autres données
  res.status(200).json({ success: true, gameCode });

  // Vérifier si tous les joueurs ont rejoint
  if (joinedPlayers.length === numPlayers) {
    // Distribuer les rôles
    let roles = [];
    do {
      roles = assignRoles(numPlayers);
    } while (!validateRoles(roles));

    // Répondre avec le token et les rôles attribués
    res.status(200).json({ success: true, token: generateToken(), roles });
  } else {
    // Répondre avec un message indiquant que les joueurs doivent attendre que tous les joueurs rejoignent
    res.status(200).json({ success: false, message: 'En attente que tous les joueurs rejoignent la partie' });
  }
});

// Gestionnaire de route pour rejoindre une partie
app.post('/join-game', (req, res) => {
  const { gameCode, playerName } = req.body;

  // Vérifier si le code de la partie correspond au code associé à la session de l'utilisateur
  if (gameCode !== req.session.gameCode) {
    return res.status(400).json({ success: false, message: 'Le code de la partie est invalide' });
  }

  // Autres vérifications et logiques de rejoindre la partie

  // Répondre avec une réponse réussie
  res.json({ success: true });
});

// Gestion des connexions des joueurs
io.on('connection', (socket) => {
  console.log('Un joueur s\'est connecté');

  // Logique de gestion des événements des joueurs
  socket.on('message', (data) => {
    io.emit('message', data); // Diffuser le message à tous les joueurs
  });

  socket.on("newuser", function(username) {
    socket.broadcast.emit("update", username + " joined the conversation");
  });

  socket.on("exituser", function(username) {
    socket.broadcast.emit("update", username + " left the conversation");
  });

  socket.on("chat", function(message) {
    // Diffuser le message à tous les utilisateurs, sauf à l'utilisateur qui l'a envoyé
    socket.broadcast.emit("chat", message);
  });
});

// Fonction pour générer un code de partie aléatoire
function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Fonction pour vérifier qu'il y a un seul Mr. White et un seul Undercover
function validateRoles(roles) {
  let mrWhiteCount = 0;
  let undercoverCount = 0;
  for (const role of roles) {
    if (role === 'Mr.White') {
      mrWhiteCount++;
    } else if (role === 'Undercover') {
      undercoverCount++;
    }
  }
  return mrWhiteCount === 1 && undercoverCount === 1;
}

// Fonction pour générer un token aléatoire simple
function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 10; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Fonction pour attribuer aléatoirement les rôles à chaque joueur
function assignRoles(numPlayers) {
  const roles = ['Civil', 'Undercover', 'Mr.White'];
  const playersRoles = [];
  for (let i = 0; i < numPlayers; i++) {
    const randomIndex = Math.floor(Math.random() * roles.length);
    playersRoles.push(roles[randomIndex]);
  }
  return playersRoles;
}

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`Le serveur est en cours d'exécution sur le port ${PORT}`);
});