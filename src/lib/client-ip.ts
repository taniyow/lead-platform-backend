import { Request } from 'express';

function normalizeIp(ip: string): string {
  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }
  if (ip === '::1') {
    return '127.0.0.1';
  }
  return ip;
}

/**
 * The x-client-ip header is set by the trusted Next.js frontend proxy. The
 * backend binds to loopback and is only reachable through that frontend, so
 * the header cannot be spoofed from the public internet.
 */
export function getClientIp(req: Request): string {
  const header = req.headers['x-client-ip'];
  const headerValue = Array.isArray(header) ? header[0] : header;
  if (headerValue && headerValue.trim()) {
    return normalizeIp(headerValue.trim());
  }
  return normalizeIp(req.socket.remoteAddress ?? 'unknown');
}
