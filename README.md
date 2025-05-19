# SQL Injection Vulnerable Demo App

This is a simple Express.js application with Handlebars templates and SQLite database that demonstrates SQL injection vulnerabilities. This app is created for educational purposes only.

## Features

- Login form vulnerable to SQL injection
- User search functionality vulnerable to SQL injection
- Password reset functionality vulnerable to SQL injection
- SQLite database with user data

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Clone or download this repository
3. Navigate to the project directory
4. Install dependencies:
   ```
   npm install
   ```
5. Start the application:
   ```
   npm start
   ```
6. Open your browser and navigate to http://localhost:3000/login

## SQL Injection Demo

This application contains intentional SQL injection vulnerabilities for educational purposes. Here are some examples you can try:

### Login Bypass

In the username field, enter:
```
' OR '1'='1
```

With any password (or no password). This will allow you to log in as the first user in the database.

### User Search Attacks

In the search field of the User Search page, try:
```
' OR '1'='1
```
This will return all users in the database.

Or try:
```
' UNION SELECT 1, sqlite_version() --
```
This will return the SQLite version.

### Password Reset Attacks

In the username field of the password reset page, try:
```
admin' --
```
This will update the admin's password regardless of the username match.

Or try:
```
nonexistent'; UPDATE users SET password='hacked' WHERE '1'='1
```
This will update all users' passwords to 'hacked'.

## WARNING

This application is deliberately vulnerable and should NEVER be used in a production environment or exposed to the internet. It is designed solely for learning about security vulnerabilities.

## Secure Alternative

In a real application, you should use prepared statements or parameterized queries:

```javascript
// Secure way using parameterized query
db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
    // Handle result safely
});
```
