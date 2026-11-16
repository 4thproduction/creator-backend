const allowedOrigins = () => (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174').split(',').map((origin) => origin.trim()).filter(Boolean);
const sessionSecurity = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path === '/api/creators/applications') return next();
  // A custom header requires a successful CORS preflight; reject foreign origins too.
  if (req.get('X-Portal-Request') !== '1' || (req.get('Origin') && !allowedOrigins().includes(req.get('Origin')))) {
    return res.status(403).json({ message: 'Untrusted request origin' });
  }
  next();
};
module.exports = { allowedOrigins, sessionSecurity };
