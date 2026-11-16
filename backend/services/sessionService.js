const { randomBytes, createHash } = require("node:crypto");
const Session = require("../Models/Session");
const HOUR = 60 * 60 * 1000;
const GRACE = 30 * 1000;
const LIFETIME = 24 * HOUR;
const COOKIE = "portal_session";
const hash = (token) => createHash("sha256").update(token).digest("hex");
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  // Behind a path prefix (e.g. nginx serving the API at /portal/api) the browser
  // only sends the cookie back if this matches the public URL path.
  path: process.env.COOKIE_PATH || "/api",
});
const tokenFrom = (req) => {
  const value = (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  return /^[a-f0-9]{64}$/.test(value || "") ? value : null;
};
const timing = (now = Date.now()) => ({
  expiresAt: new Date(now + LIFETIME),
  confirmAt: new Date(now + HOUR),
  deadline: new Date(now + HOUR + GRACE),
});
const publicSession = (session, now = Date.now()) => ({
  expiresAt: +session.expiresAt,
  confirmAt: +session.confirmAt,
  deadline: +session.deadline,
  serverNow: now,
});
const clearCookie = (res) => res.clearCookie(COOKIE, cookieOptions());
const revoke = async (req) => {
  const token = tokenFrom(req);
  if (token) await Session.deleteOne({ tokenHash: hash(token) });
};
const create = async (user, req, res) => {
  await revoke(req);
  const token = randomBytes(32).toString("hex");
  const session = await Session.create({
    user,
    tokenHash: hash(token),
    ...timing(),
  });
  res.cookie(COOKIE, token, { ...cookieOptions(), expires: session.expiresAt });
  return session;
};
const find = async (req, now = Date.now()) => {
  const token = tokenFrom(req);
  if (!token) return null;
  return Session.findOne({
    tokenHash: hash(token),
    expiresAt: { $gt: new Date(now) },
    deadline: { $gt: new Date(now) },
  });
};
const confirm = async (session, now = Date.now()) => {
  const confirmAt = new Date(now + HOUR);
  const deadline = new Date(Math.min(now + HOUR + GRACE, +session.expiresAt));
  // Compare-and-set prevents concurrent tabs from extending the same interval twice.
  const updated = await Session.findOneAndUpdate(
    {
      _id: session._id,
      confirmAt: session.confirmAt,
      expiresAt: { $gt: new Date(now) },
      deadline: { $gt: new Date(now) },
      $expr: { $lte: ["$confirmAt", new Date(now)] },
    },
    { $set: { confirmAt, deadline } },
    { new: true },
  );
  return (
    updated ||
    Session.findOne({
      _id: session._id,
      expiresAt: { $gt: new Date(now) },
      deadline: { $gt: new Date(now) },
    })
  );
};
module.exports = {
  create,
  find,
  confirm,
  revoke,
  clearCookie,
  publicSession,
  timing,
  tokenFrom,
  hash,
  HOUR,
  GRACE,
  LIFETIME,
};
