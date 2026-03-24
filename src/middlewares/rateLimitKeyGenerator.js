/**
 * Normalize IP values coming from proxies/load balancers.
 * Azure and some gateways can append the source port (e.g. 66.175.214.102:58201),
 * which causes express-rate-limit to reject the value as an invalid IP.
 */
function stripPortFromIp(rawIp = "") {
  const ip = String(rawIp).trim().replace(/^"|"$/g, "");
  if (!ip) return "";

  // [IPv6]:port
  if (ip.startsWith("[") && ip.includes("]")) {
    return ip.slice(1, ip.indexOf("]"));
  }

  // IPv4:port
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) {
    return ip.replace(/:\d+$/, "");
  }

  // IPv4-mapped IPv6 with port (e.g. ::ffff:127.0.0.1:51234)
  if (ip.includes(".") && /:\d+$/.test(ip)) {
    return ip.replace(/:\d+$/, "");
  }

  return ip;
}

function normalizeIp(ip = "") {
  const cleanIp = stripPortFromIp(ip);
  if (!cleanIp) return "";

  if (cleanIp === "::1") return "127.0.0.1";
  if (cleanIp.startsWith("::ffff:")) return cleanIp.slice(7);

  return cleanIp;
}

function pickClientIp(req) {
  const forwarded = req?.headers?.["x-forwarded-for"];
  const candidate =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split?.(",")?.[0] ??
    req?.ip ??
    req?.socket?.remoteAddress ??
    "";

  return normalizeIp(candidate) || "0.0.0.0";
}

export function rateLimitKeyGenerator(req) {
  return pickClientIp(req);
}

export function getClientIpForLogs(req) {
  return pickClientIp(req);
}

