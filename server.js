// server.js

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();  // charge les variables d'environnement depuis .env

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Remplace body-parser.json()

// Chaîne de connexion MongoDB depuis variable d'environnement
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://amrtikande:tikande123@audiomanager.tifdhf0.mongodb.net/?retryWrites=true&w=majority&appName=audiomanager';

// Connexion à MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB Atlas'))
.catch(err => {
  console.error('Erreur connexion MongoDB:', err);
  process.exit(1);  // stoppe le serveur si connexion impossible
});

// Schéma Mongoose
const packSchema = new mongoose.Schema({
  name: { type: String, required: true },
  customName: { type: String, default: '' },
  validated: { type: Boolean, default: false }
});

const Pack = mongoose.model('Pack', packSchema);

// Route test simple
app.get('/', (req, res) => {
  res.send('Hello World, serveur ok!');
});

// Routes API

// Récupérer tous les packs
app.get('/packs', async (req, res) => {
  try {
    const packs = await Pack.find();
    res.json(packs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouveau pack
app.post('/packs', async (req, res) => {
  try {
    const { name, customName } = req.body;
    const newPack = new Pack({
      name: name || `PACK AUDIO N°${Date.now()}`,
      customName: customName || '',
      validated: false
    });
    const savedPack = await newPack.save();
    res.json(savedPack);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Erreur lors de la création' });
  }
});

// Mettre à jour un pack (validated et/ou customName)
app.patch('/packs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { validated, customName } = req.body;

    const pack = await Pack.findById(id);
    if (!pack) return res.status(404).json({ error: 'Pack non trouvé' });

    if (validated !== undefined) pack.validated = validated;
    if (customName !== undefined) pack.customName = customName;

    const updatedPack = await pack.save();
    res.json(updatedPack);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Calcul du solde (4000 par pack validé)
app.get('/solde', async (req, res) => {
  try {
    const validatedCount = await Pack.countDocuments({ validated: true });
    res.json({ solde: validatedCount * 4000 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Démarrage serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
