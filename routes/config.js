import express from 'express';

const router = express.Router();

export default (db) => {
  // Save SMTP configuration
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

    const token = smtpToken || smtp_token;
    const passkey = passKey || pass_key;
    const user = smtpUser || smtp_user;
    const pass = smtpPass || smtp_pass;
    const host = smtpHost || smtp_host;
    const from = smtpFrom || smtp_from;

    if (!token || !user || !pass || !host || !from) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      const existing = await db.oneOrNone('SELECT id FROM config WHERE smtp_token = $1', [token]);

      if (existing) {
        await db.none(
          `UPDATE config 
          SET pass_key = $1, smtp_user = $2, smtp_pass = $3, smtp_host = $4, smtp_from = $5 
          WHERE smtp_token = $6`,
          [passkey, user, pass, host, from, token]
        );
        console.log('Configuration already and updated')
        return res.status(200).json({ success: true, message: 'Configuration updated successfully' });
      }

      await db.none(
        `INSERT INTO config (smtp_token, pass_key, smtp_user, smtp_pass, smtp_host, smtp_from) 
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [token, passkey, user, pass, host, from]
      );
      console.log('Configuration saved successfully')
      res.status(201).json({ success: true, message: 'Configuration saved successfully' });
    } catch (err) {
      console.error('Error saving configuration:', err);
      res.status(500).json({ error: 'Failed to save configuration' });
    }
  });

  router.get('/get-config', async (req, res) => {
    const { smtpToken } = req.query;
    if (!smtpToken) return res.status(400).json({ error: 'SMTP token is required' });

    try {
      const configData = await db.oneOrNone(
        'SELECT smtp_user, smtp_pass, smtp_host, smtp_from FROM config WHERE smtp_token = $1',
        [smtpToken]
      );
      if (configData) {
        res.status(200).json({ success: true, data: configData });
      } else {
        res.status(404).json({ error: 'Config not found' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to retrieve configuration' });
    }
  });

  router.get('/smtps', async (req, res) => {
    const { pass_key } = req.query;
    if (!pass_key) return res.status(400).json({ error: 'Pass key is required' });

    try {
      const smtps = await db.any(
        'SELECT smtp_user, smtp_pass, smtp_host, smtp_from, smtp_token, pass_key FROM config WHERE pass_key = $1',
        [pass_key]
      );
      res.status(200).json(smtps);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to retrieve SMTPs' });
    }
  });

  router.get('/all', async (_, res) => {
    try {
      const configs = await db.any('SELECT * FROM config');
      res.status(200).json({ success: true, data: configs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to retrieve configs' });
    }
  });

  router.delete('/:token', async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: 'Missing smtp_token parameter' });
  }

  try {
    const result = await db.result('DELETE FROM config WHERE smtp_token = $1', [token]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'SMTP config not found' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error deleting SMTP config:', err);
    res.status(500).json({ error: 'Failed to delete config' });
  }
});

  router.get('/passkeys', async (_, res) => {
    try {
      const passkeys = await db.any('SELECT pass_key FROM passkeys');
      res.status(200).json({ passkeys: passkeys.map(p => p.pass_key) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch passkeys' });
    }
  });

  router.post('/passkeys', async (req, res) => {
    const { passKey } = req.body;
    if (!passKey) return res.status(400).json({ error: 'Passkey is required' });

    try {
      await db.none('INSERT INTO passkeys (pass_key) VALUES ($1)', [passKey]);
      res.status(201).json({ success: true, passKey });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add passkey' });
    }
  });

  router.delete('/passkeys/:passKey', async (req, res) => {
    const { passKey } = req.params;
    try {
      await db.none('DELETE FROM passkeys WHERE pass_key = $1', [passKey]);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete passkey' });
    }
  });

  router.post('/verify-passkey', async (req, res) => {
    const { passKey } = req.body;
    if (!passKey) return res.status(400).json({ error: 'Passkey is required' });

    try {
      const result = await db.oneOrNone('SELECT pass_key FROM passkeys WHERE pass_key = $1', [passKey]);
      if (result) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: 'Invalid passkey' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to verify passkey' });
    }
  });

  return router;
};