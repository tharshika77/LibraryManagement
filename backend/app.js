const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Import the database connection module

const app = express();

app.use(cors());                   
app.use(express.json());          
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

// Routes
const bookRoutes = require('./routes/books');
app.use('/api/books', bookRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/home.html'));
});

const memberRoutes = require('./routes/members');
app.use('/api/members', memberRoutes);

const loanRoutes = require('./routes/loans');
app.use('/api/loans', loanRoutes);

const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);

// Test DB connection on server start
app.get('/test-db', async (req, res) => {
  try {
    const conn = await db.getConnection();
    const result = await conn.execute("SELECT 'connected' AS status FROM dual");
    await conn.close();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});

