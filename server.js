const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

const packsFile = path.join(__dirname, 'data', 'packs.json');

app.use(cors());
app.use(bodyParser.json());

// 🔁 Lire les packs depuis le fichier
function lirePacks() {
  const raw = fs.readFileSync(packsFile, 'utf-8');
  return JSON.parse(raw);
}

// 💾 Sauvegarder les packs dans le fichier
function sauvegarderPacks(packs) {
  fs.writeFileSync(packsFile, JSON.stringify(packs, null, 2));
}

// 🔹 GET - Tous les packs
app.get('/packs', (req, res) => {
  const packs = lirePacks();
  res.json(packs);
});

// 🔹 PATCH - Toggle validated
app.patch('/packs/:id/toggle', (req, res) => {
  const { id } = req.params;
  const { validated } = req.body;
  const packs = lirePacks();

  const pack = packs.find(p => p.id === id);
  if (!pack) return res.status(404).json({ error: 'Pack non trouvé' });

  pack.validated = validated;
  sauvegarderPacks(packs);
  res.json({ success: true, pack });
});

// 🔹 GET - Solde total des packs validés
app.get('/solde', (req, res) => {
  const packs = lirePacks();
  const solde = packs.filter(p => p.validated).reduce((sum, p) => sum + p.amount, 0);
  res.json({ solde });
});

app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));
