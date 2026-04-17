import express, { json, urlencoded } from 'express';
import session from 'express-session';
import { DatabaseSync } from 'node:sqlite';
import { loadEnvFile } from 'node:process';
import { createHash, randomBytes } from 'node:crypto';

// try {
//   loadEnvFile();
// } catch (e) {
//   if (e.code !== 'ENOENT') {
//     throw e;
//   }
// }

const app = express();

// Parse form data
app.use(urlencoded({ extended: false }));

// Use json middleware for API - testing only at the moment
app.use(json());

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Session middleware
app.use(session({
  secret: randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
}));

// Middleware to check response headers
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`request url = ${req.originalUrl}`);
        console.log(res.getHeaders());
    });
    next();
});

// Create SQLite database
const db = new DatabaseSync(process.env.DB_PATH || 'database.sqlite');

// ToDo: Change this to something more secure
function md5(password) {
  return createHash('md5').update(password).digest('hex');
}

// Create users table if it doesn't exist
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL
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

// ToDo: Move the controller and routing logic to different files to keep things clean.
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required' });
  }
  try {
    const row = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, md5(password));
    if (!row) {
      return res.render('login', { error: 'Invalid email or password' });
    }
    req.session.userId = row.id;
    req.session.userName = row.name;
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
app.get('/', requireLogin, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM users ORDER BY id DESC').all();
    res.render('index', { users: rows, userName: req.session.userName });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Database error: ' + err);
  }
});

// Home API - List all users
app.get('/api', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM users ORDER BY id DESC').all();
    res.json({ users: rows, userName: req.session.userName });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Database error: ' + err);
  }
});


// Add a new user
app.post('/add', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).send('Name, email, and password are required');
  }
  try {
    const hashedPassword = md5(password);
    db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashedPassword);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Database error');
  }
});


// Add a new user API
app.post('/api/add', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Name, email, and password are required',
    });
  }
  try {
    const hashedPassword = md5(password);
    const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashedPassword);
    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.lastInsertRowid,
        name,
        email,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error' });
  }
});


// Delete a user
app.post('/delete/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).send('Invalid ID');
  }
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

app.use((req, res, next) => {
  res.status(404).send("<h1>404: Sorry, that resource doesn't exist!</h1>")
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
