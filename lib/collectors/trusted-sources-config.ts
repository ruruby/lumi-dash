/**
 * Trusted-organization registry: which official feeds to collect from.
 *
 * Kept dependency-free (no server-only imports) so client components — like
 * the settings panel listing these sources — can read it without pulling
 * node:fs/node:crypto into the browser bundle.
 */
export type TrustedSource = {
  id: string;
  organization: string;
  feedUrl: string;
  /** Rough topical hint, used to skip feeds that cannot match the topic at all. */
  focus: string;
};

/**
 * Verified against the live feeds while building this: NIST's cybersecurity
 * blog and OWASP both return items. CISA's XML endpoints answer 403 to
 * non-browser clients from some networks — it stays registered and its failure
 * is reported rather than silently counted as zero.
 */
export const TRUSTED_SOURCES: TrustedSource[] = [
  {
    id: "nist-cybersecurity",
    organization: "NIST",
    feedUrl: "https://www.nist.gov/blogs/cybersecurity-insights/rss.xml",
    focus: "cybersecurity guidance, standards, frameworks",
  },
  {
    id: "owasp",
    organization: "OWASP",
    feedUrl: "https://owasp.org/feed.xml",
    focus: "application security, AI security, supply chain",
  },
  {
    id: "cisa-advisories",
    organization: "CISA",
    feedUrl: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    focus: "advisories, known exploited vulnerabilities",
  },
];
