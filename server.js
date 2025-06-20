const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'ton_secret_ultra_secret';

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://amrtikande:tikande123@audiomanager.tifdhf0.mongodb.net/?retryWrites=true&w=majority&appName=audiomanager', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connecté'))
.catch(err => {
  console.error('Erreur connexion MongoDB:', err);
  process.exit(1);
});

// Modèle User
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  fullname: { type: String, required: true },
  secretQuestion: { type: String, required: true },
  secretAnswer: { type: String, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Modèle Pack
const packSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  validated: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
const Pack = mongoose.model('Pack', packSchema);

// Middleware d'authentification
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('Erreur: Token manquant dans la requête');
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log('Erreur: Token invalide ou expiré', err);
      return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
    console.log('Token décodé pour userId:', decoded.userId);
    req.userId = decoded.userId;
    next();
  });
}

// Routes
app.get('/', (req, res) => {
  res.send('Serveur OK');
});

// Inscription
app.post('/signup', async (req, res) => {
  const { username, fullname, secretQuestion, secretAnswer, password } = req.body;
  console.log('Données reçues (signup) pour userId:', req.userId, req.body);

  if (!username || !fullname || !secretQuestion || !secretAnswer || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  try {
    const normalizedUsername = username.trim().toLowerCase();
    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) return res.status(400).json({ message: 'Nom d’utilisateur déjà utilisé' });

    const hashedSecretAnswer = await bcrypt.hash(secretAnswer, 10);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: normalizedUsername,
      fullname,
      secretQuestion,
      secretAnswer: hashedSecretAnswer,
      password: hashedPassword
    });

    await newUser.save();
    console.log('Utilisateur créé:', newUser);
    res.json({ message: 'Inscription réussie' });
  } catch (err) {
    console.error('Erreur inscription:', err);
    res.status(500).json({ message: 'Erreur serveur lors de l’inscription', error: err.message });
  }
});

// Connexion
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Données reçues (login):', req.body);

  try {
    const normalizedUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: normalizedUsername });
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '7d' });
    console.log('Token généré pour userId:', user._id);
    res.json({ message: 'Connexion réussie', token, userId: user._id });
  } catch (err) {
    console.error('Erreur connexion:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion', error: err.message });
  }
});

// Réinitialisation mot de passe
app.post('/forgot-password', async (req, res) => {
  const { username, fullname, secretQuestion, secretAnswer, newPassword } = req.body;
  console.log('Données reçues (forgot-password):', req.body);

  try {
    const normalizedUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: normalizedUsername });

    if (!user || user.fullname !== fullname || user.secretQuestion !== secretQuestion) {
      return res.status(400).json({ message: 'Informations incorrectes' });
    }

    const answerMatch = await bcrypt.compare(secretAnswer, user.secretAnswer);
    if (!answerMatch) return res.status(400).json({ message: 'Réponse incorrecte' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log('Mot de passe réinitialisé pour:', normalizedUsername);
    res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur réinitialisation:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation', error: err.message });
  }
});

// Récupérer les packs
app.get('/packs', authenticateToken, async (req, res) => {
  try {
    console.log('Récupération des packs pour userId:', req.userId);
    const packs = await Pack.find({ userId: req.userId });
    res.json(packs);
  } catch (err) {
    console.error('Erreur récupération packs:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// Ajouter un pack
app.post('/packs', authenticateToken, async (req, res) => {
  const { name } = req.body;
  console.log('Données reçues (POST /packs) pour userId:', req.userId, req.body);

  try {
    if (!name) return res.status(400).json({ error: 'Le nom du pack est requis' });

    const newPack = new Pack({
      name: name.trim(),
      validated: false,
      userId: req.userId
    });

    await newPack.save();
    console.log('Pack créé:', newPack);
    res.json({ success: true, pack: newPack });
  } catch (err) {
    console.error('Erreur ajout pack:', err);
    res.status(500).json({ error: 'Erreur serveur lors de l’ajout', details: err.message });
  }
});

// Mettre à jour un pack
app.put('/packs/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { validated } = req.body;
  console.log('Données reçues (PUT /packs/:id) pour userId:', req.userId, { id, validated });

  try {
    const pack = await Pack.findById(id);
    if (!pack) return res.status(404).json({ error: 'Pack non trouvé' });

    if (pack.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Accès non autorisé à ce pack' });
    }

    if (validated !== undefined) {
      pack.validated = validated;
    }
    await pack.save();
    console.log('Pack mis à jour:', pack);
    res.json(pack);
  } catch (err) {
    console.error('Erreur mise à jour pack:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour', details: err.message });
  }
});

// Supprimer un pack
app.delete('/packs/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  console.log('Demande de suppression pour packId:', id, 'par userId:', req.userId);

  try {
    const pack = await Pack.findById(id);
    if (!pack) return res.status(404).json({ error: 'Pack non trouvé' });

    if (pack.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Accès non autorisé à ce pack' });
    }

    await Pack.findByIdAndDelete(id);
    console.log('Pack supprimé avec succès pour packId:', id);
    res.json({ success: true, message: 'Pack supprimé avec succès' });
  } catch (err) {
    console.error('Erreur suppression pack:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
