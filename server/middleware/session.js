const crypto = require('crypto');

function sessionMiddleware(req, res, next) {
  let sessionId = req.cookies.sessionId;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    // Bez 'maxAge' = session cookie, zmizne pri zatvorení prehliadača
    res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'lax' });
  }

  req.sessionId = sessionId;
  next();
}

module.exports = sessionMiddleware;