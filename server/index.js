const express = require('express');
const path = require('path');
const interviewRoutes = require('./routes/interview');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware na parsovanie JSON requestov
app.use(express.json());
// Servírovanie statických súborov (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server beží' });
});

app.use('/api', interviewRoutes);

app.listen(PORT, () => {
  console.log(`Server beží na http://localhost:${PORT}`);
});