const User = require('../Models/User');
const sessions = require('../services/sessionService');

const protect = async (req, res, next) => {
  try {
    const session = await sessions.find(req);
    if (!session) {
      sessions.clearCookie(res);
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    }
    const user = await User.findById(session.user).populate('role');
    if (!user) {
      await sessions.revoke(req);
      sessions.clearCookie(res);
      return res.status(401).json({ message: 'User no longer exists' });
    }
    req.session = session;
    req.account = user;
    req.user = { id: user._id, permissions: user.role?.permissions || [] };
    next();
  } catch {
    res.status(503).json({ message: 'Session service unavailable. Please try again.' });
  }
};
module.exports = { protect };
