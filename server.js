const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let packs = [];

app.get('/packs', (req, res) => {
  res.json(packs);
});

app.post('/packs', (req, res) => {
  const { name, customName } = req.body;
  const newPack = {
    id: packs.length + 1,
    name: name || `PACK AUDIO N°${packs.length + 1}`,
    customName: customName || '',
    validated: false
  };
  packs.push(newPack);
  res.json(newPack);
});

// PATCH route pour mettre à jour un pack (validation, customName)
app.patch('/packs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { validated, customName } = req.body;
  const pack = packs.find(p => p.id === id);
  if (pack) {
    if (validated !== undefined) pack.validated = validated;
    if (customName !== undefined) pack.customName = customName;
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
