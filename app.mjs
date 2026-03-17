import express, { json, urlencoded } from 'express';
import { createPool } from 'mysql2';
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
db.query(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL
  )
`, (err) => {
  if (err) {
    console.error('Error creating table:', err.message);
  } else {
    console.log('Contacts table ready');
  }
});

// Home — list all contacts + show add form
app.get('/', (req, res) => {
  db.query('SELECT * FROM contacts ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render('index', { contacts: results });
    //  return res.json( { contacts: results });
  });
});

// Add a new contact
app.post('/add', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).send('Name and email are required');
  }
  db.query('INSERT INTO contacts (name, email) VALUES (?, ?)', [name, email], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.redirect('/');
  });
});

// Delete a contact
app.post('/delete/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).send('Invalid ID');
  }
  db.query('DELETE FROM contacts WHERE id = ?', [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.redirect('/');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
