import express from 'express';
import cors from 'cors';
import initDB from './db.js';
import messageRoutes from './routes/message.js';
import configRoutes from './routes/config.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

initDB().then(async (db) => { // await DB initialization
  app.use('/', messageRoutes(db));
  app.use('/config', configRoutes(db));

  app.listen(PORT, () => {
    console.log(`🚀 Server running on ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1); // Exit the process if DB initialization fails
});