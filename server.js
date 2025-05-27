const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Remplace par ta vraie chaîne de connexion MongoDB
const mongoURI = 'mongodb+srv://amrtikande:tikande123.@@annotator.lmmiriy.mongodb.net/?retryWrites=true&w=majority&appName=annotator';

// Connexion à MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB Atlas'))
.catch(err => {
  console.error('Erreur connexion MongoDB:', err);
  process.exit(1);  // Arrêter le serveur si pas connecté
});

// Schéma et modèle Mongoose
const packSchema = new mongoose.Schema({
  name: { type: String, required: true },
  customName: { type: String, default: '' },
  validated: { type: Boolean, default: false }
});

const Pack = mongoose.model('Pack', packSchema);

// Routes API

app.get('/packs', async (req, res) => {
  try {
    const packs = await Pack.find();
    res.json(packs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

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

app.get('/solde', async (req, res) => {
  try {
    const validatedCount = await Pack.countDocuments({ validated: true });
    res.json({ solde: validatedCount * 4000 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
