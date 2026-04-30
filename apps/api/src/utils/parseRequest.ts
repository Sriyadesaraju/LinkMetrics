import geoip from 'geoip-lite'
import * as UAParser from 'ua-parser-js'
import crypto from 'crypto'

interface ParsedRequestMeta {
  ipHash: string
  country: string | null
  city: string | null
  deviceType: string | null
  browser: string | null
  os: string | null
  referrer: string | null
}

export function parseRequestMeta(
  ip: string,
  userAgent: string,
  referrer: string,
  secret: string
): ParsedRequestMeta {
  // 1. Hash the IP for privacy (GDPR — never store raw IPs)
  const ipHash = crypto
    .createHash('sha256')
    .update(ip + secret)
    .digest('hex')

  // 2. GeoIP lookup — local DB, instant, no API call
  const geo = geoip.lookup(ip)

  // 3. Parse User-Agent string
  const ua = new UAParser.UAParser(userAgent)
  const deviceType = ua.getDevice().type ?? 'desktop' // ua-parser returns undefined for desktop
  const browser = ua.getBrowser().name ?? null
  const os = ua.getOS().name ?? null

  // 4. Clean referrer — strip query params (they can contain sensitive data)
  let cleanReferrer: string | null = null
  if (referrer) {
    try {
      cleanReferrer = new URL(referrer).hostname // just "twitter.com", not full URL
    } catch {
      cleanReferrer = null // invalid URL, ignore it
    }
  }

  return {
    ipHash,
    country: geo?.country ?? null,
    city: geo?.city ?? null,
    deviceType,
    browser,
    os,
    referrer: cleanReferrer,
  }
}