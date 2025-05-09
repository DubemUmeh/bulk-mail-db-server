import express from 'express';
import cors from 'cors';
import initDB from './db.js';
import messageRoutes from './routes/message.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

initDB().then((db) => {
  app.use('/', messageRoutes(db));

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1); // Exit the process if DB initialization fails
});