const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import du middleware CORS

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Autoriser toutes les origines (à ajuster si besoin)
app.use(express.json());

// Chaîne MongoDB (cache bien tes identifiants en prod)
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

const packSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  validated: { type: Boolean, default: false }
});
const Pack = mongoose.model('Pack', packSchema);

// Route GET basique
app.get('/', (req, res) => {
  res.send('Serveur OK');
});

// Route GET /packs - récupérer tous les packs
app.get('/packs', async (req, res) => {
  try {
    const packs = await Pack.find();
    res.json(packs);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route POST /packs - ajouter un nouveau pack
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

// Route POST /toggle-pack - modifier validated d’un pack
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

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
