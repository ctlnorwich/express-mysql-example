import express, { json, urlencoded } from 'express';
import { createPool } from 'mysql2/promise';
import { loadEnvFile } from 'node:process';

loadEnvFile();
const dbUrl = process.env.DB_URL || "";

const app = express();

// Parse form data
app.use(urlencoded({ extended: false }));

// Create json API - testing only atm
app.use(json());

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Create MySQL connection using DB_URL environment variable
const db = createPool(dbUrl);

// Create contacts table if it doesn't exist
try {
  await db.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL
    )
  `);
  console.log('Contacts table ready');
} catch (err) {
  console.error('Error creating table:', err.message);
  process.exit(1);
}

// Home — list all contacts + show add form
app.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contacts ORDER BY id DESC');
    res.render('index', { contacts: rows });
    // return res.json( { contacts: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Database error');
  }
});

// Add a new contact
app.post('/add', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).send('Name and email are required');
  }
  try {
    await db.query('INSERT INTO contacts (name, email) VALUES (?, ?)', [name, email]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Database error');
  }
});

// Delete a contact
app.post('/delete/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).send('Invalid ID');
  }
  try {
    await db.query('DELETE FROM contacts WHERE id = ?', [id]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
