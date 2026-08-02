const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const sessionMiddleware = require('./middleware/session');
const interviewRoutes = require('./routes/interview');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware na parsovanie JSON requestov
app.use(express.json());

app.use(cookieParser());
app.use(sessionMiddleware);

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