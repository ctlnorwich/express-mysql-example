# Express MySQL Users App

A simple Node.js app using Express and MySQL to manage users.

- ES Modules (ESM) with .mjs extensions - the offical standard for packaging JavaScript for reuse, now supported in Node.js

- EJS templating engine to demonstrate how to generate html markup using server-side views.

- uses the `mysql2.createPool()` method for reusable database connections.

- Simple authentication using `express-session`.

## Setup

1. Set the `DB_URL` environment variable to your MySQL connection string:

   ```js
   DB_URL="mysql://<username>:<password>@<host>:<port>/<database_name>"
   ```

2. Install dependencies and start:

   ```js
   npm install
   npm start // start the server
   npm run dev // start the server in dev mode (nodemon)
   ```

3. Open [http://localhost:3000](http://localhost:3000)

The `users` table is created automatically on first run.
