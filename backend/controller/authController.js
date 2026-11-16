const authService = require('../services/authService');
const sessions = require('../services/sessionService');
const account = (user) => ({ _id: user._id, name: user.name, email: user.email, role: user.role });
const login = async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) return res.status(400).json({ message: 'Please provide email and password' });
  let data;
  try { data = await authService.login(email, password); }
  catch (error) { return res.status(error.message === 'Invalid email or password' ? 401 : 503).json({ message: error.message === 'Invalid email or password' ? error.message : 'Sign in unavailable. Please try again.' }); }
  try {
    const session = await sessions.create(data.user._id, req, res);
    res.json({ user: data.user, session: sessions.publicSession(session) });
  } catch { res.status(503).json({ message: 'Could not start session. Please try again.' }); }
};
const status = (req, res) => res.json({ user: account(req.account), session: sessions.publicSession(req.session) });
const confirm = async (req, res) => {
  try {
    const session = await sessions.confirm(req.session);
    if (!session) { sessions.clearCookie(res); return res.status(401).json({ message: 'Session expired. Please sign in again.' }); }
    res.json({ user: account(req.account), session: sessions.publicSession(session) });
  } catch { res.status(503).json({ message: 'Could not continue session. Please try again.' }); }
};
const logout = async (req, res) => {
  try {
    await sessions.revoke(req);
    sessions.clearCookie(res);
    res.sendStatus(204);
  } catch { res.status(503).json({ message: 'Could not sign out. Please try again.' }); }
};
module.exports = { login, status, confirm, logout };
