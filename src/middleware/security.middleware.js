import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';

    let limit;
    let message;
    switch (role) {
      case 'admin':
        limit = 20; // High limit for admins
        message = 'Admin rate limit exceeded 20 per minute';
        break;
      case 'user':
        limit = 10; // Standard limit for regular users
        message = 'User rate limit exceeded 10 per minute';
        break;
      case 'guest':
      default:
        limit = 5; // Lower limit for guests
        message = 'Guest rate limit exceeded 5 per minute';
        break;
    }
    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);
    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Blocked bot request', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      return res
        .status(403)
        .json({ error: 'Forbidden', message: 'Bot traffic is not allowed' });
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield blocked request', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      return res
        .status(403)
        .json({ error: 'Forbidden', message: 'Shield blocked request' });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        role,
      });
      return res.status(429).json({ error: 'Too Many Requests', message });
    }

    next();
  } catch (error) {
    console.error('Security middleware error:', error);
    return res
      .status(500)
      .json({
        error: 'Internal Server Error',
        message: 'Something went wrong with the security middleware',
      });
  }
};

export default securityMiddleware;
