import express, { json, urlencoded } from 'express';
import session from 'express-session';
import { createPool } from 'mysql2/promise';
import { loadEnvFile } from 'node:process';
import { createHash, randomBytes } from 'node:crypto';


try {
  loadEnvFile();
} catch (e) {
  if (e.code !== 'ENOENT') {
    throw e;
  }
}

const dbUrl = process.env.DB_URL || "";

const app = express();

// Parse form data
app.use(urlencoded({ extended: false }));

// Use json middleware for API - testing only atm
app.use(json());

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
}));

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`request url = ${req.originalUrl}`);
        console.log(res.getHeaders());
    });
    next();
});


// Create MySQL connection using DB_URL environment variable
const db = createPool(dbUrl);

function md5(password) {
  return createHash('md5').update(password).digest('hex');
}

// Create users table if it doesn't exist
try {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(32) NOT NULL
    )
  `);
  console.log('Users table ready');
} catch (err) {
  console.error('Error creating table:', err.message);
  process.exit(1);
}

// Custom middleware for authentication
function requireLogin(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login');
}

// Login page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, md5(password)]);
    if (rows.length === 0) {
      return res.render('login', { error: 'Invalid email or password' });
    }
    req.session.userId = rows[0].id;
    req.session.userName = rows[0].name;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Database error');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Home - List all users (uses requireLogin middleware)
app.get('/', requireLogin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users ORDER BY id DESC');

    res.render('index', { users: rows, userName: req.session.userName });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Database error');
  }
});

// Add a new user
app.post('/add', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).send('Name, email, and password are required');
  }
  try {
    const hashedPassword = md5(password);
    await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Database error');
  }
});

// Delete a user
app.post('/delete/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).send('Invalid ID');
  }
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
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
