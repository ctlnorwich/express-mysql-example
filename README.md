# Express MySQL Contacts App

A simple Node.js app using Express and MySQL to manage contacts.

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

The `contacts` table is created automatically on first run.
