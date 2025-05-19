import express from 'express';

const router = express.Router();

export default (db) => {
  // Save the message to the database
  router.post('/save-message', async (req, res) => {
    const { email, subject, body, smtp_token } = req.body;

    if (!email || !subject || !body || !smtp_token) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      const timestamp = new Date().toISOString();
      await db.run(
        'INSERT INTO message_history (email, subject, body, timestamp, smtp_token) VALUES (?, ?, ?, ?, ?)',
        [email, subject, body, timestamp, smtp_token]
      );
      res.status(200).json({ success: true, message: 'Message saved successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save message' });
    }
  }); 

  // Get the message history from the database
  router.get('/message-history', async (req, res) => {
    const { smtp_token } = req.query;

    if (!smtp_token) {
      return res.status(400).json({ error: 'SMTP token is required' });
    }

    try {
      const messages = await db.all('SELECT * FROM message_history WHERE smtp_token = ? ORDER BY timestamp DESC', [smtp_token]);
      res.status(200).json(messages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to retrieve message history' });
    }
  });

  // Delete all messages (truncate the table)
  router.delete('/message-history', async (req, res) => {
    // console.log('DELETE /message-history endpoint triggered');
    // console.log('Request headers:', req.headers);
    // console.log('Request body:', req.body);
    try {
      await db.run('DELETE FROM message_history');
      res.status(200).json({ success: true, message: 'All messages deleted successfully' });
    } catch (err) {
      console.error('Error in DELETE /message-history:', err);
      res.status(500).json({ error: 'Failed to delete messages' });
    }
  });

  return router;
};