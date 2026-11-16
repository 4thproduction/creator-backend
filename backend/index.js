const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { allowedOrigins, sessionSecurity } = require('./middleware/sessionSecurity');
const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');
const seedCreators = require('./utils/seedCreators');
const authRoutes = require('./Routes/authRoutes');
const userRoutes = require('./Routes/userRoutes');
const roleRoutes = require('./Routes/roleRoutes');
const creatorRoutes = require('./Routes/creatorRoutes');

dotenv.config();

const app = express();

connectDB().then(async () => {
  await seedAdmin();
  // Demo creators are for local development only; never insert fake records into production.
  if (process.env.NODE_ENV !== 'production') await seedCreators();
});

app.use(cors((req, callback) => callback(null, req.path === '/api/creators/applications'
  ? { origin: '*' }
  : { origin: (origin, done) => done(null, !origin || allowedOrigins().includes(origin)), credentials: true })));
app.use(sessionSecurity);
// API responses carry personal data and session state: never let the browser
// cache them or answer from a stale copy (304), which previously served an old
// HTML response in place of /api/creators.
app.set('etag', false);
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
// Creator applications contain base64 analytics screenshots. Keep a bounded limit.
app.use(express.json({ limit: '22mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/creators', creatorRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
