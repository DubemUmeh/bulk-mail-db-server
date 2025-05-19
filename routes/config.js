import express from 'express';

const router = express.Router();

export default (db) => {
  // Create passkeys table
  db.exec(`
    CREATE TABLE IF NOT EXISTS passkeys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pass_key TEXT UNIQUE NOT NULL
    )
  `);

  // Route to handle saving new SMTP configurations
  router.post('/save-config', async (req, res) => {
    const {
      smtpToken,
      smtp_token,
      passKey,
      pass_key,
      smtpUser,
      smtp_user,
      smtpPass,
      smtp_pass,
      smtpHost,
      smtp_host,
      smtpFrom,
      smtp_from,
    } = req.body;

    // Normalize field names to camelCase
    const token = smtpToken || smtp_token;
    const passkey = passKey || pass_key;
    const user = smtpUser || smtp_user;
    const pass = smtpPass || smtp_pass;
    const host = smtpHost || smtp_host;
    const from = smtpFrom || smtp_from;

    // console.log('Incoming payload:', { token, passkey, user, pass, host, from }); // Log the normalized payload for debugging

    if (!token || !user || !pass || !host || !from) {
      console.error('Validation failed: Missing required fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      // Check if a record with the given token already exists
      const existingConfig = await db.get('SELECT * FROM config WHERE smtp_token = ?', [token]);

      if (existingConfig) {
        // Update the existing record
        await db.run(
          'UPDATE config SET pass_key = ?, smtp_user = ?, smtp_pass = ?, smtp_host = ?, smtp_from = ? WHERE smtp_token = ?',
          [passkey, user, pass, host, from, token]
        );
        return res.status(200).json({ success: true, message: 'Configuration updated successfully' });
      } else {
        await db.run(
          'INSERT INTO config (smtp_token, pass_key, smtp_user, smtp_pass, smtp_host, smtp_from) VALUES (?, ?, ?, ?, ?, ?)',
          [token, passkey, user, pass, host, from]
        );
        res.status(201).json({ success: true, message: 'Configuration saved successfully' });
      }
    } catch (err) {
      console.error('Error saving configuration:', err);
      res.status(500).json({ error: 'Failed to save configuration' });
    }
  });

  // Route to retrieve configuration data based on the token
  router.get('/get-config', async (req, res) => {
    const { smtpToken } = req.query;

    if (!smtpToken) {
      return res.status(400).json({ error: 'SMTP token is required' });
    }

    try {
      const configData = await db.get('SELECT smtp_user, smtp_pass, smtp_host, smtp_from FROM config WHERE smtp_token = ?', [smtpToken]);
      if (configData) {
        res.status(200).json({ success: true, data: configData });
      } else {
        res.status(404).json({ error: 'Config not found' });
      }
    } catch (err) {
      console.error('Error retrieving configuration:', err);
      res.status(500).json({ error: 'Failed to retrieve configuration' });
    }
  });

  // Get SMTPs filtered by pass_key (for PopupVerify)
  router.get('/smtps', async (req, res) => {
    const { pass_key } = req.query;

    // console.log('Incoming pass_key:', pass_key); // Log the token for debugging

    if (!pass_key) {
      console.error('Missing pass_key in request');
      return res.status(400).json({ error: 'Pass key is required' });
    }

    try {
      const smtps = await db.all(
        'SELECT smtp_user, smtp_pass, smtp_host, smtp_from, smtp_token, pass_key FROM config WHERE pass_key = ?',
        [pass_key]
      );
      // console.log('Query result:', smtps); // Log the query result for debugging

      // Instead of 404, return empty array
      res.status(200).json(smtps);
    } catch (err) {
      console.error('Error retrieving SMTPs:', err);
      res.status(500).json({ error: 'Failed to retrieve SMTPs' });
    }
  });

  // Admin: Get all configs
  router.get('/all', async (req, res) => {
    // Optionally check for admin token in headers here
    try {
      const configs = await db.all('SELECT * FROM config');
      res.status(200).json({ success: true, data: configs });
    } catch (err) {
      console.error('Error retrieving all configs:', err);
      res.status(500).json({ error: 'Failed to retrieve configs' });
    }
  });

  // Admin: Delete config by id
  router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM config WHERE id = ?', [id]);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error deleting config:', err);
    res.status(500).json({ error: 'Failed to delete config' });
  }
  });

  // Passkey Management Routes
  router.get('/passkeys', async (req, res) => {
    console.log('📍 Get passkeys request received');
    try {
      const passkeys = await db.all('SELECT pass_key FROM passkeys');
      // console.log('📋 Retrieved passkeys:', passkeys);
      res.status(200).json({ 
        passkeys: passkeys.map(row => row.pass_key) 
      });
    } catch (err) {
      console.error('💥 Error fetching passkeys:', err);
      res.status(500).json({ error: 'Failed to fetch passkeys' });
    }
  });

  router.post('/passkeys', async (req, res) => {
    const { passKey } = req.body;
    // console.log('📍 Add passkey request received:', { passKey });

    if (!passKey) {
      console.log('❌ No passkey provided');
      return res.status(400).json({ error: 'Passkey is required' });
    }

    try {
      await db.run('INSERT INTO passkeys (pass_key) VALUES (?)', [passKey]);
      // console.log('✅ Passkey added successfully:', passKey);
      res.status(201).json({ success: true, passKey });
    } catch (err) {
      console.error('💥 Error adding passkey:', err);
      res.status(500).json({ error: 'Failed to add passkey' });
    }
  });

  router.delete('/passkeys/:passKey', async (req, res) => {
    const { passKey } = req.params;
    // console.log('📍 Delete passkey request received:', { passKey });

    try {
      await db.run('DELETE FROM passkeys WHERE pass_key = ?', [passKey]);
      console.log('✅ Passkey deleted successfully');
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('💥 Error deleting passkey:', err);
      res.status(500).json({ error: 'Failed to delete passkey' });
    }
  });

  // Verify passkey exists
  router.post('/verify-passkey', async (req, res) => {
    const { passKey } = req.body;
    // console.log('📍 Verify passkey request received:', { passKey });

    if (!passKey) {
      console.log('❌ No passkey provided in request');
      return res.status(400).json({ error: 'Passkey is required' });
    }

    try {
      const result = await db.get('SELECT pass_key FROM passkeys WHERE pass_key = ?', [passKey]);
      // console.log('🔍 Database lookup result:', result);

      if (result) {
        console.log('✅ Passkey verified successfully');
        res.json({ success: true });
      } else {
        console.log('❌ Invalid passkey');
        res.status(401).json({ error: 'Invalid passkey' });
      }
    } catch (err) {
      console.error('💥 Error verifying passkey:', err);
      res.status(500).json({ error: 'Failed to verify passkey' });
    }
  });

  return router;
};