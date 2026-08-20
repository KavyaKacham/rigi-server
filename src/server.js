require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/business');   // ← ADD THIS LINE

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);               // ← ADD THIS LINE

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Rigital Ecosystem API running on http://localhost:${PORT}`);
});