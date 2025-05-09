import express from 'express';

const router = express.Router();

export default (db) => {
  // Save the message to the database
  router.post('/save-message', async (req, res) => {
    const { email, subject, body, token } = req.body;

    if (!email || !subject || !body || !token) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      const timestamp = new Date().toISOString();
      await db.run(
        'INSERT INTO message_history (email, subject, body, timestamp, token) VALUES (?, ?, ?, ?, ?)',
        [email, subject, body, timestamp, token]
      );
      res.status(200).json({ success: true, message: 'Message saved successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save message' });
    }
  }); 

  // Get the message history from the database
  router.get('/message-history', async (req, res) => {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    try {
      const messages = await db.all('SELECT * FROM message_history WHERE token = ? ORDER BY timestamp DESC', [token]);
      res.status(200).json(messages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to retrieve message history' });
    }
  });

  // Delete all messages (truncate the table)
  router.delete('/message-history', async (req, res) => {
    try {
      await db.run('DELETE FROM message_history');
      res.status(200).json({ success: true, message: 'All messages deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete messages' });
    }
  });

  return router;
};