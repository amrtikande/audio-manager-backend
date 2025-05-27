const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'packs.json');

app.use(cors());
app.use(bodyParser.json());

let packs = [];

// Charger les packs depuis le fichier au démarrage
function loadPacks() {
  if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE);
    packs = JSON.parse(data);
  }
}

// Sauvegarder les packs dans le fichier
function savePacks() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(packs, null, 2));
}

// Initialiser les données
loadPacks();

// Obtenir la liste des packs
app.get('/packs', (req, res) => {
  res.json(packs);
});

// Ajouter un nouveau pack
app.post('/packs', (req, res) => {
  const { name, customName } = req.body;
  const newPack = {
    id: packs.length + 1,
    name: name || `PACK AUDIO N°${packs.length + 1}`,
    customName: customName || '',
    validated: false
  };
  packs.push(newPack);
  savePacks();
  res.json(newPack);
});

// Activer/désactiver un pack
app.post('/toggle-pack', (req, res) => {
  const { id, validated } = req.body;
  const pack = packs.find(p => p.id === id);
  if (pack) {
    pack.validated = validated;
    savePacks();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Pack not found' });
  }
});

// Retourner le solde total
app.get('/solde', (req, res) => {
  const validatedCount = packs.filter(p => p.validated).length;
  res.json({ solde: validatedCount * 4000 });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur le port ${PORT}`);
});
