// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import your server-side route handlers
import convertHandler from './public/js/api/convert.js';
import checkSnapshotHandler from './public/js/api/checkSnapshot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON bodies
app.use(express.json());

// Register your API endpoints
app.post('/js/api/convert', (req, res) => convertHandler(req, res));
app.get('/js/api/checkSnapshot', (req, res) => checkSnapshotHandler(req, res));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
