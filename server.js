const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

app.use(express.json());

// Remplace par ta vraie chaîne de connexion MongoDB
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

// Définition d'un schéma simple
const packSchema = new mongoose.Schema({
  name: String,
  validated: Boolean
});
const Pack = mongoose.model('Pack', packSchema);

// Route GET basique
app.get('/', (req, res) => {
  res.send('Serveur OK');
});

// Route GET /packs
app.get('/packs', async (req, res) => {
  try {
    const packs = await Pack.find();
    res.json(packs);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Lancement serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
