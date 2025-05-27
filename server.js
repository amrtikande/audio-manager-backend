const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const DATA_PATH = path.join(__dirname, 'packs.json');

let packs = [];

// Charger les packs depuis le fichier JSON au démarrage
function loadPacks() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const data = fs.readFileSync(DATA_PATH, 'utf-8');
      packs = JSON.parse(data);
    }
  } catch (err) {
    console.error('Erreur lors du chargement des packs:', err);
    packs = [];
  }
}

// Sauvegarder les packs dans le fichier JSON
function savePacks() {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(packs, null, 2));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde des packs:', err);
  }
}

loadPacks();

app.get('/packs', (req, res) => {
  res.json(packs);
});

app.post('/packs', (req, res) => {
  const { name, customName } = req.body;
  const newPack = {
    id: packs.length > 0 ? packs[packs.length - 1].id + 1 : 1,
    name: name || `PACK AUDIO N°${packs.length + 1}`,
    customName: customName || '',
    validated: false
  };
  packs.push(newPack);
  savePacks();
  res.json(newPack);
});

app.patch('/packs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { validated, customName } = req.body;
  const pack = packs.find(p => p.id === id);
  if (pack) {
    if (validated !== undefined) pack.validated = validated;
    if (customName !== undefined) pack.customName = customName;
    savePacks();
    res.json(pack);
  } else {
    res.status(404).json({ error: 'Pack not found' });
  }
});

app.get('/solde', (req, res) => {
  const validatedCount = packs.filter(p => p.validated).length;
  res.json({ solde: validatedCount * 4000 });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
