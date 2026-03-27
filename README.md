# Express MySQL Users App

A simple Node.js app using Express and MySQL to manage users, intended as a starting point for learning about how Express works with databases. The application allows anyone to create an account and delete all users including themselves! It should be extended to include user permissions, form validation and enhanced password security.

## Features

- ES Modules (ESM) using `import/export` - the offical standard for packaging JavaScript for reuse, supported in Node.js going forward. This is set using `"type": "module"` in `package.json`.
- EJS templating engine to demonstrate how to generate html markup using server-side views. This could be replaced with API endpoints for use with a seperate front end (e.g. React).
- Newer `mysql2.createPool()` method for reusable database connections, instead of connecting and disconnecting for each request.
- Simple authentication using `express-session`.
- MD5 password hashing (this should be swapped out for something more robust, such as bcrypt).
- Doesn't use TypeScript, but could easily be adapted to do so - this would be a useful excercise!
- Basic API endpoints for listing and adding users.

## Setup

1. Set the `DB_URL` environment variable to your MySQL service URI:

   ```js
   DB_URL="mysql://<username>:<password>@<host>:<port>/<database_name>"
   ```

2. Install dependencies and start the server:

   ```js
   npm install
   npm start // start the server (reload if you change something)
   npm run dev // start the server in dev mode (nodemon will watch for changes)
   ```

3. Open [http://localhost:3000](http://localhost:3000)

The `users` table is created automatically on first run.
