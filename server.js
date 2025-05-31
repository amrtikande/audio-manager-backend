const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const mongoURI = 'mongodb+srv://amrtikande:tikande123@audiomanager.tifdhf0.mongodb.net/?retryWrites=true&w=majority&appName=audiomanager';

mongoose.connect(mongoURI, {
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

// Modèle Pack (existait déjà dans ton code)
const packSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  validated: { type: Boolean, default: false }
});
const Pack = mongoose.model('Pack', packSchema);

// Routes Pack (ton code existant)
app.get('/', (req, res) => {
  res.send('Serveur OK');
});

app.get('/packs', async (req, res) => {
  try {
    const packs = await Pack.find();
    res.json(packs);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/packs', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Le nom du pack est requis' });
    }
    const newPack = new Pack({ name: name.trim(), validated: false });
    await newPack.save();
    res.json({ success: true, pack: newPack });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de l’ajout' });
  }
});

app.post('/toggle-pack', async (req, res) => {
  try {
    const { id, validated } = req.body;
    if (typeof id === 'undefined' || typeof validated === 'undefined') {
      return res.status(400).json({ error: 'id et validated sont requis' });
    }
    const pack = await Pack.findById(id);
    if (!pack) return res.status(404).json({ error: 'Pack non trouvé' });

    pack.validated = validated;
    await pack.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors du toggle' });
  }
});

app.put('/packs/:id', async (req, res) => {
  const { id } = req.params;
  const { validated, customName } = req.body;

  try {
    const updatedPack = await Pack.findByIdAndUpdate(
      id,
      { validated, customName },
      { new: true }
    );
    res.json(updatedPack);
  } catch (err) {
    res.status(500).json({ error: 'Erreur mise à jour pack' });
  }
});

// Route inscription
app.post('/signup', async (req, res) => {
  const { username, fullname, secretQuestion, secretAnswer, password } = req.body;

  if (!username || !fullname || !secretQuestion || !secretAnswer || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Nom d’utilisateur déjà utilisé' });

    const hashedSecretAnswer = await bcrypt.hash(secretAnswer, 10);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      fullname,
      secretQuestion,
      secretAnswer: hashedSecretAnswer,
      password: hashedPassword
    });

    await newUser.save();
    res.json({ message: 'Inscription réussie' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors de l’inscription' });
  }
});

// Route connexion
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Mot de passe incorrect' });

    res.json({ message: 'Connexion réussie', userId: user._id, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
});

// Route réinitialisation mot de passe
app.post('/forgot-password', async (req, res) => {
  const { username, fullname, secretQuestion, secretAnswer, newPassword } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user || user.fullname !== fullname || user.secretQuestion !== secretQuestion) {
      return res.status(400).json({ message: 'Informations incorrectes' });
    }

    const answerMatch = await bcrypt.compare(secretAnswer, user.secretAnswer);
    if (!answerMatch) {
      return res.status(400).json({ message: 'Réponse incorrecte' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
