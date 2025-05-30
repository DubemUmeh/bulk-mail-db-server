import express from 'express';

const router = express.Router();

export default (db) => {
  router.post('/save-message', async (req, res) => {
    const { email, subject, body, smtp_token } = req.body;
    // console.log('credentials for saving message history: ', req.body);

    if (!email || !subject || !body || !smtp_token) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      await db.none(
        `INSERT INTO message_history (email, subject, body, timestamp, smtp_token) 
        VALUES ($1, $2, $3, NOW(), $4)`,
        [email, subject, body, smtp_token]
      );
      res.status(200).json({ success: true, message: 'Message saved successfully' });
      console.log('Message saved to database successfully');
    } catch (err) {
      console.error(err);
      // console.log('error saving message: ', err);
      res.status(500).json({ error: 'Failed to save message' });
    }
  });

  router.get('/message-history', async (req, res) => {
    const { smtp_token } = req.query;
    // console.log('check token for history', req.query)

    if (!smtp_token) {
      return res.status(400).json({ error: 'SMTP token is required' });
    }

    try {
      const messages = await db.any(
        'SELECT * FROM message_history WHERE smtp_token = $1 ORDER BY timestamp DESC',
        [smtp_token]
      );
      res.status(200).json(messages);
    } catch (err) {
      console.error(err);
      // console.log('error fetching message: ', err);
      res.status(500).json({ error: 'Failed to retrieve message history' });
    }
  });

  router.delete('/message-history', async (req, res) => {
    const { smtp_token, messageIds } = req.query;
    // console.log(req.query);

    if (!smtp_token) {
      return res.status(400).json({ error: 'SMTP token is required' });
    }

    // If messageIds are provided, delete specific messages
    if (messageIds && messageIds.length > 0) {
      const idsToDelete = Array.isArray(messageIds) ? messageIds : messageIds.split(',').map( id =>
        parseInt(id.trim())
      ); // Ensure it's an array of numbers

      // basic Validation for message IDs
      if (idsToDelete.some(isNaN)) {
        return res.status(400).json({ error: 'Invalid message IDs provided' });
      }

      try {
        await db.none('DELETE FROM message_history WHERE smtp_token = $1 AND id IN ($2:list)', [smtp_token, idsToDelete]);
        res.status(200).json({ success: true, message: `${idsToDelete.length} messages deleted successfully` });
        console.log(`${idsToDelete.length} message deleted from database successfully!`)
      } catch (err) {
        console.error(err);
        console.log('error deleting specific message: ', err);
        res.status(500).json({ error: 'Failed to delete selected message(s)' });
      }
    } else {
      return res.status(400).json({ error: 'No message IDs provided for deletion' })
    };

  });

  return router;
};