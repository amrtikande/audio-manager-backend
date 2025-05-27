const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Connecte-toi à MongoDB Atlas
const mongoURI = 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/packdb?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connecté à MongoDB Atlas'))
  .catch(err => console.error('Erreur connexion MongoDB :', err));

// Schéma Mongoose pour les packs
const packSchema = new mongoose.Schema({
  name: { type: String, required: true },
  customName: { type: String, default: '' },
  validated: { type: Boolean, default: false }
});

const Pack = mongoose.model('Pack', packSchema);

// Routes API

// GET tous les packs
app.get('/packs', async (req, res) => {
  try {
    const packs = await Pack.find();
    res.json(packs);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST nouveau pack
app.post('/packs', async (req, res) => {
  const { name, customName } = req.body;
  try {
    const newPack = new Pack({
      name: name || `PACK AUDIO N°${Date.now()}`, // ou autre logique de nom
      customName: customName || '',
      validated: false
    });
    await newPack.save();
    res.json(newPack);
  } catch (err) {
    res.status(400).json({ error: 'Erreur lors de la création' });
  }
});

// PATCH mise à jour d’un pack
app.patch('/packs/:id', async (req, res) => {
  const id = req.params.id;
  const { validated, customName } = req.body;
  try {
    const pack = await Pack.findById(id);
    if (!pack) return res.status(404).json({ error: 'Pack non trouvé' });

    if (validated !== undefined) pack.validated = validated;
    if (customName !== undefined) pack.customName = customName;

    await pack.save();
    res.json(pack);
  } catch (err) {
    res.status(400).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// GET solde
app.get('/solde', async (req, res) => {
  try {
    const validatedCount = await Pack.countDocuments({ validated: true });
    res.json({ solde: validatedCount * 4000 });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
