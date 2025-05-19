const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize Express app
const app = express();
const port = 3000;

// Database setup - this creates a vulnerable database
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Create users table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        // Insert a test user if none exists
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
          if (err) {
            console.error('Error checking users:', err.message);
          } else if (row.count === 0) {
            // Insert test user (admin:admin123)
            db.run(`INSERT INTO users (username, password) VALUES ('admin', 'admin123')`, (err) => {
              if (err) {
                console.error('Error inserting test user:', err.message);
              } else {
                console.log('Test user created successfully.');

                // Insert additional test users
                const additionalUsers = [
                  ['john', 'password123'],
                  ['jane', 'secret456'],
                  ['alice', 'userpass'],
                  ['bob', 'securepass']
                ];

                additionalUsers.forEach(user => {
                  db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, user, (err) => {
                    if (err && err.code !== 'SQLITE_CONSTRAINT') {
                      console.error(`Error inserting user ${user[0]}:`, err.message);
                    }
                  });
                });
              }
            });
          }
        });
      }
    });
  }
});

// Handlebars setup
app.engine('hbs', exphbs.engine({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
// Home page - requires authentication (vulnerable to SQL injection)
app.get('/', (req, res) => {
  res.render('home');
});

// User search - VULNERABLE TO SQL INJECTION
app.get('/users', (req, res) => {
  const searchTerm = req.query.search || '';

  // VULNERABLE: Direct string concatenation in SQL query
  const query = "SELECT id, username FROM users WHERE username LIKE '%" + searchTerm + "%'";

  console.log('Executing user search query:', query); // Log for educational purposes

  db.all(query, (err, users) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.render('users', {
        error: 'Database error occurred',
        searchTerm: searchTerm
      });
    }

    res.render('users', {
      users: users,
      searchTerm: searchTerm
    });
  });
});

// Login page
app.get('/login', (req, res) => {
  res.render('login', {
    error: req.query.error
  });
});

// Login form handling - VULNERABLE TO SQL INJECTION
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // VULNERABLE: Direct string concatenation in SQL query
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";

  console.log('Executing query:', query); // Log for educational purposes

  db.get(query, (err, user) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.redirect('/login?error=Database error occurred');
    }

    if (user) {
      // User authenticated successfully
      res.render('home', { username: user.username });
    } else {
      // Authentication failed
      res.redirect('/login?error=Invalid username or password');
    }
  });
});

// Logout
app.get('/logout', (req, res) => {
  res.redirect('/login');
});

// Password reset page
app.get('/reset-password', (req, res) => {
  res.render('reset-password', {
    error: req.query.error,
    success: req.query.success
  });
});

// Password reset submission - VULNERABLE TO SQL INJECTION
app.post('/reset-password', (req, res) => {
  const { username, newPassword } = req.body;

  // VULNERABLE: Direct string concatenation in SQL query
  const query = "UPDATE users SET password = '" + newPassword + "' WHERE username = '" + username + "'";

  console.log('Executing reset password query:', query); // Log for educational purposes

  db.run(query, function(err) {
    if (err) {
      console.error('Database error:', err.message);
      return res.redirect('/reset-password?error=Database error occurred');
    }

    if (this.changes > 0) {
      // Password updated successfully
      res.redirect('/reset-password?success=Password updated successfully');
    } else {
      // No user found with that username
      res.redirect('/reset-password?error=Username not found');
    }
  });
});

// Data export - VULNERABLE TO SQL INJECTION
app.get('/export', (req, res) => {
  const field = req.query.field || 'id,username';
  const filter = req.query.filter || '';
  
  // VULNERABLE: Direct string concatenation in SQL query and unsafe field selection
  const query = "SELECT " + field + " FROM users WHERE username LIKE '%" + filter + "%'";
  
  console.log('Executing export query:', query); // Log for educational purposes
  
  db.all(query, (err, data) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.render('export', {
        error: 'Database error occurred',
        field: field,
        filter: filter
      });
    }
    
    res.render('export', {
      data: data,
      field: field,
      filter: filter,
      query: query
    });
  });
});

// Profile page - VULNERABLE TO BLIND SQL INJECTION
app.get('/profile', (req, res) => {
  const userId = req.query.id || '1';
  
  // VULNERABLE: Direct string concatenation in SQL query
  const query = "SELECT * FROM users WHERE id = " + userId;
  
  console.log('Executing profile query:', query); // Log for educational purposes
  
  db.get(query, (err, user) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.render('profile', {
        error: 'Database error occurred'
      });
    }
    
    if (user) {
      // Hide password from view for security
      if (user.password) {
        user.passwordLength = user.password.length;
        user.password = '********';
      }
      
      res.render('profile', {
        user: user
      });
    } else {
      res.render('profile', {
        error: 'User not found'
      });
    }
  });
});

// SQL Injection education page
app.get('/sqli-info', (req, res) => {
  res.render('sqli-info');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
