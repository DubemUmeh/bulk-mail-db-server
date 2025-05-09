# 📦 Bulk Mail Sender - Database Service

This folder contains the standalone Express + SQLite service for storing and retrieving email/message history for the Bulk Mail Sender app.

## 🚀 Features

- Stores sent email addresses, subjects, and message bodies with timestamps.
- Associates history with user tokens for privacy.
- Provides REST API endpoints for saving, retrieving, and clearing history.
- Simple, file-based SQLite database (`messages.db`).

## 📂 Structure

```
Database/
├── db.js              # SQLite database initialization and schema
├── routes/
│   └── message.js     # Express routes for message history
├── server.js          # Express server entry point
├── package.json
└── README.md
```

## ⚙️ Setup & Usage

1. **Install dependencies**
   ```bash
   cd Database
   npm install
   ```

2. **Start the server**
   ```bash
   npm start
   ```
   The server will run on [http://localhost:3500](http://localhost:3500).

## 🛠️ API Endpoints

### Save a Message

- **POST** `/save-message`
- **Body:**  
  ```json
  {
    "email": "recipient@example.com",
    "subject": "Subject line",
    "body": "Message body",
    "token": "user_token"
  }
  ```
- **Response:**  
  `{ "success": true, "message": "Message saved successfully" }`

### Get Message History

- **GET** `/message-history?token=USER_TOKEN`
- **Response:**  
  ```json
  [
    {
      "id": 1,
      "email": "recipient@example.com",
      "subject": "Subject line",
      "body": "Message body",
      "timestamp": "2024-06-01T12:34:56.000Z",
      "token": "user_token"
    },
    ...
  ]
  ```

### Clear All History

- **DELETE** `/message-history`
- **Response:**  
  `{ "success": true, "message": "All messages deleted successfully" }`

## 📝 Notes

- The database is file-based (`messages.db`) and will persist data between restarts.
- Each user's history is separated by their token.
- This service is intended to be used alongside the main Bulk Mail Sender backend and frontend.

---

<p align="center">Database service for reliable email/message history 🚀</p>
# bulk-mail-db-server
