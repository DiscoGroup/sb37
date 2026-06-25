const assessmentForm = document.querySelector("#assessmentForm");
const reportCard = document.querySelector("#reportCard");
const scanStatus = document.querySelector("#scanStatus");
let scanMotionTimer;
let latestReportData;
const LEAD_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx8vpkMISzW8xB8GjQpMg9s6Pyo6zoy06q4gNWTGtCNoMK40AsRuoukTolW0A6g4GKzMA/exec";
const CALENDLY_URL = "https://calendly.com/vnsfirm/15min?back=1&month=2026-06";
const REPORT_CONTACT_EMAIL = "reports@sb37score.com";
const LEAD_CONSENT_TEXT = "I consent to SB37 COA and its service providers storing and using my submitted information, website scan data, and report details to contact me by email, phone, and text about this assessment and related services.";

const categories = [
  {
    id: "disclosures",
    name: "Required Disclosures",
    weight: 20,
    findings: [
      { id: "missingResponsibleAttorney", penalty: 10, label: "Missing responsible California attorney or firm name" },
      { id: "missingOfficeAddress", penalty: 5, label: "Missing office address or State Bar address signal" },
      { id: "missingAdDisclosure", penalty: 5, label: "Missing advertising, spokesperson, or dramatization disclosure" }
    ]
  },
  {
    id: "claims",
    name: "Case Results & Success Claims",
    weight: 15,
    findings: [
      { id: "settlementNoDisclaimer", penalty: 10, label: "Settlement, verdict, recovery, or result claims needing page-level context" },
      { id: "guaranteesOutcome", penalty: 15, label: "Guarantees, quick cash, immediate settlement, or outcome language" },
      { id: "misleadingStats", penalty: 15, label: "Misleading recovery statistics, volume claims, or inflated numbers" }
    ]
  },
  {
    id: "awards",
    name: "Awards & Specialization",
    weight: 10,
    findings: [
      { id: "unverifiedAwards", penalty: 5, label: "Unverified awards, badges, or rankings" },
      { id: "specialistClaims", penalty: 10, label: "Specialist, expert, or best-lawyer claims needing support" }
    ]
  },
  {
    id: "ai",
    name: "AI / Synthetic Content",
    weight: 10,
    findings: [
      { id: "aiAvatar", penalty: 10, label: "AI avatar, synthetic voice, or generated spokesperson" },
      { id: "aiAttorneyLikeness", penalty: 10, label: "AI attorney likeness, testimonial, or impersonation risk" },
      { id: "massAiContent", penalty: 10, label: "Mass AI content pages or unreviewed AI copy" }
    ]
  },
  {
    id: "chatbot",
    name: "Chatbot Risk",
    weight: 10,
    findings: [
      { id: "chatLegalAdvice", penalty: 10, label: "Chatbot gives legal advice or case-specific direction" },
      { id: "chatNoDisclaimer", penalty: 5, label: "Chatbot has no clear disclaimer or escalation rule" }
    ]
  },
  {
    id: "intake",
    name: "Intake & Call Center Risk",
    weight: 10,
    findings: [
      { id: "intakePromises", penalty: 10, label: "Intake or call center promises outcomes" },
      { id: "nonAttorneyGuidance", penalty: 10, label: "Non-attorney staff gives legal guidance" },
      { id: "noSupervisionProcess", penalty: 5, label: "No documented supervision or script review process" }
    ]
  },
  {
    id: "vendor",
    name: "Vendor-Created Content",
    weight: 10,
    findings: [
      { id: "unreviewedSeo", penalty: 5, label: "Unreviewed SEO, PPC, landing page, or lead-gen content" },
      { id: "noAttorneyOversight", penalty: 5, label: "No attorney approval rights before publication" },
      { id: "massAiContent", penalty: 10, label: "Mass AI content pages or unreviewed AI copy" }
    ]
  },
  {
    id: "referral",
    name: "Referral & Joint Advertising",
    weight: 10,
    findings: [
      { id: "coBrandedPages", penalty: 5, label: "Co-branded pages or joint advertising" },
      { id: "unclearReferral", penalty: 5, label: "Unclear referral relationship" },
      { id: "unclearReferral", penalty: 10, label: "Unclear lead-generator ownership" }
    ]
  },
  {
    id: "transparency",
    name: "Attorney Transparency",
    weight: 5,
    findings: [
      { id: "missingResponsibleAttorney", penalty: 5, label: "Attorney not clearly identified" }
    ]
  }
];

const practiceRules = [
  ["Personal injury / mass tort", /\b(personal injury|car accident|truck accident|motorcycle|slip and fall|wrongful death|catastrophic|premises liability|mass tort|injury lawyer)\b/gi],
  ["Employment", /\b(employment|wrongful termination|workplace|wage and hour|harassment|discrimination|retaliation|labor law)\b/gi],
  ["Family law", /\b(divorce|custody|child support|spousal support|family law|prenup|domestic violence)\b/gi],
  ["Criminal defense", /\b(criminal defense|dui|dwi|felony|misdemeanor|arrest|expungement|domestic battery)\b/gi],
  ["Immigration", /\b(immigration|visa|green card|asylum|deportation|naturalization|citizenship|uscis)\b/gi],
  ["Estate planning", /\b(estate planning|trust|probate|will|living trust|power of attorney|trust administration)\b/gi],
  ["Bankruptcy", /\b(bankruptcy|chapter 7|chapter 13|debt relief|creditor harassment)\b/gi],
  ["Business / corporate", /\b(business law|corporate|contract|commercial litigation|partnership|merger|startup)\b/gi],
  ["Real estate", /\b(real estate|landlord|tenant|eviction|property dispute|construction defect)\b/gi]
];

const signalRules = [
  { id: "missingResponsibleAttorney", type: "missing", pattern: /\b(attorney advertising|responsible attorney|principal attorney|law offices of|law firm|lawyer|lawyers|legalservice|founder|founding partner|managing partner|esq\.|attorney at law|state bar-certified|certified criminal law specialist)\b/gi, evidence: "No obvious responsible attorney or firm identity phrase was detected in the extracted text." },
  { id: "missingOfficeAddress", type: "missing", pattern: /\b(\d{2,6}\s+[a-z0-9.' -]+\s+(street|st\.|avenue|ave\.|boulevard|blvd\.|road|rd\.|drive|dr\.|way|court|ct\.|place|pl\.|lane|ln\.|suite|ste\.|floor|fl\.)|streetaddress|addresslocality|addressregion|postalcode|postal address|state bar|calbar)\b/gi, evidence: "No obvious office address or State Bar address signal was detected in the extracted text." },
  { id: "missingAdDisclosure", type: "missing", pattern: /\b(advertisement|attorney advertising|actor portrayal|dramatization|spokesperson|paid spokesperson|results may vary|past results|no guarantee|not a guarantee|does not guarantee|not legal advice|does not create an attorney-client relationship|disclaimer)\b/gi, evidence: "No obvious advertising, dramatization, spokesperson, or results disclaimer language was detected." },
  { id: "settlementNoDisclaimer", pattern: /\b(\$[0-9][0-9,.]*\s*(million|m|k)?|settlement|verdict|recovered|recovery|won|results)\b/gi, evidence: "The site appears to discuss settlements, verdicts, recoveries, wins, or case results." },
  { id: "guaranteesOutcome", pattern: /\b(guarantee|guaranteed|no win no fee|win your case|maximum compensation|quick cash|cash now|immediate settlement|fast settlement|we will get you)\b/gi, evidence: "The site appears to use outcome, guarantee, quick-cash, or aggressive compensation language." },
  { id: "misleadingStats", pattern: /\b([0-9]+%\s*(success|win|settlement)|over\s+\$?[0-9][0-9,.]*|millions recovered|billions recovered|[0-9]+\+?\s*(cases|clients|settlements))\b/gi, evidence: "The site appears to use statistics, volume claims, or aggregate recovery numbers." },
  { id: "unverifiedAwards", pattern: /\b(award|awarded|super lawyers|best lawyers|top rated|avvo|martindale|million dollar advocates|rated|ranking|ranked)\b/gi, evidence: "The site appears to reference awards, badges, rankings, or third-party ratings." },
  { id: "specialistClaims", pattern: /\b(specialist|specialized|expert|experts|premier|leading|best|top|#1|number one)\b/gi, evidence: "The site appears to use specialist, expert, best, top, or similar superiority language." },
  { id: "aiAvatar", pattern: /\b(ai avatar|synthetic voice|virtual assistant|generated spokesperson|avatar|voice clone|deepfake)\b/gi, evidence: "The site appears to reference avatar, synthetic voice, virtual assistant, or generated spokesperson concepts." },
  { id: "aiAttorneyLikeness", pattern: /\b(ai attorney|virtual lawyer|robot lawyer|artificial intelligence lawyer|ai lawyer|automated legal advice)\b/gi, evidence: "The site appears to reference AI attorney, virtual lawyer, or automated legal advice concepts." },
  { id: "massAiContent", pattern: /\b(ai generated|generated by ai|artificial intelligence|chatgpt|machine learning|automated content|content automation)\b/gi, evidence: "The site appears to reference AI-generated content, artificial intelligence, or content automation." },
  { id: "chatLegalAdvice", pattern: /\b(ask our chatbot|chatbot|live chat|chat now|get legal advice now|answer your legal questions|free case evaluation)\b/gi, evidence: "The site appears to invite chat, chatbot, legal-question, or case-evaluation interactions." },
  { id: "chatNoDisclaimer", type: "missingWhenChat", pattern: /\b(not legal advice|does not create an attorney-client relationship|attorney-client relationship|consult an attorney)\b/gi, evidence: "Chat/intake language appeared, but no obvious no-legal-advice or no-attorney-client disclaimer was detected nearby in extracted text." },
  { id: "intakePromises", pattern: /\b(we can help you recover|you deserve compensation|we will fight|we get results|start your claim|get paid|settle your case)\b/gi, evidence: "The site appears to use intake-oriented outcome or compensation language." },
  { id: "nonAttorneyGuidance", pattern: /\b(intake specialist|case manager|legal assistant|call center|representative|advocate will call|specialist will review)\b/gi, evidence: "The site appears to reference non-attorney intake, case-management, or call-center roles." },
  { id: "noSupervisionProcess", type: "missing", pattern: /\b(attorney reviewed|reviewed by an attorney|supervised by|attorney supervision|approved by)\b/gi, evidence: "No obvious attorney review or supervision process language was detected." },
  { id: "unreviewedSeo", pattern: /\b(seo|landing page|lead generation|lead generator|ppc|google ads|sponsored|advertising partner)\b/gi, evidence: "The site appears to reference paid ads, SEO, landing pages, or lead-generation concepts." },
  { id: "noAttorneyOversight", type: "missing", pattern: /\b(attorney reviewed|approved by attorney|attorney oversight|responsible attorney|supervised by)\b/gi, evidence: "No obvious attorney oversight or approval language was detected." },
  { id: "coBrandedPages", pattern: /\b(co-counsel|affiliate|joint advertising|joint ad|sponsored by|in partnership with|powered by|partner network|advertising partner|marketing partner)\b/gi, evidence: "The site appears to reference partner, network, affiliate, co-counsel, or powered-by relationships." },
  { id: "unclearReferral", pattern: /\b(referral|lead generator|matching service|legal network|find a lawyer|connect you with|referred by|referred to us)\b/gi, evidence: "The site appears to reference referral, matching, lead-generator, or legal-network relationships." }
];

const findingTeasers = {
  missingResponsibleAttorney: "Responsible attorney or firm identity was not obvious in the scanned text.",
  missingOfficeAddress: "Office or State Bar address signals were not obvious in the scanned text.",
  missingAdDisclosure: "Advertising, spokesperson, dramatization, or result-disclaimer language was not obvious.",
  settlementNoDisclaimer: "Result, settlement, verdict, recovery, or win language appeared; disclaimer context is checked separately.",
  guaranteesOutcome: "Outcome-style, guarantee, quick-cash, or aggressive compensation language appeared.",
  misleadingStats: "Recovery numbers, volume claims, percentages, or aggregate statistics appeared.",
  unverifiedAwards: "Award, badge, ranking, or third-party rating language appeared.",
  specialistClaims: "Best, top, expert, specialist, or superiority language appeared.",
  aiAvatar: "Synthetic voice, avatar, virtual assistant, or generated-spokesperson language appeared.",
  aiAttorneyLikeness: "AI lawyer, virtual lawyer, or automated legal-advice language appeared.",
  massAiContent: "AI-generated, artificial intelligence, or automated-content language appeared.",
  chatLegalAdvice: "Chat, case-evaluation, or legal-question intake language appeared.",
  chatNoDisclaimer: "Chat/intake signals appeared without an obvious no-legal-advice disclaimer nearby.",
  intakePromises: "Intake copy appears to promise help recovering, settling, or getting paid.",
  nonAttorneyGuidance: "Non-attorney intake, case manager, call center, or representative language appeared.",
  noSupervisionProcess: "Attorney supervision or script-review process language was not obvious.",
  unreviewedSeo: "SEO, PPC, landing-page, sponsored, or lead-generation language appeared.",
  noAttorneyOversight: "Attorney approval or oversight language for marketing content was not obvious.",
  coBrandedPages: "Partner, network, affiliate, co-counsel, joint, or powered-by language appeared.",
  unclearReferral: "Referral, referred, matching-service, legal-network, or lead-generator language appeared."
};

const MAX_SECOND_PASS_PAGES = 6;
const MAX_COMPLIANCE_PROBES = 8;
const MAX_LINKED_PAGES = 14;
const MAX_FILE_URLS = 3;
const CRAWL_BATCH_SIZE = 6;
const HOMEPAGE_TIMEOUT_MS = 6500;
const PAGE_TIMEOUT_MS = 4200;
const FILE_TIMEOUT_MS = 4200;
const scanPhases = [
  "Normalizing domain and security headers",
  "Discovering sitemap and priority internal pages",
  "Probing disclaimer, terms, attorney, and results URLs",
  "Reading homepage, header, footer, and schema",
  "Checking attorney identity and office signals",
  "Parsing disclaimers, terms, and advertising language",
  "Reviewing case-result and recovery claim patterns",
  "Screening awards, rankings, and specialization claims",
  "Testing AI, chatbot, and intake-risk language",
  "Mapping vendor, referral, and joint-advertising signals",
  "Building SB37 category score"
];

function normalizeWebsite(rawUrl) {
  const trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function phoneDigits(value) {
  return String(value).replace(/\D/g, "");
}

function normalizeUsPhone(value) {
  const digits = phoneDigits(value);
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return null;
  return {
    countryCode: "+1",
    national,
    e164: `+1${national}`
  };
}

function countMatches(text, pattern) {
  return Array.from(text.matchAll(pattern)).length;
}

function topMatches(text, pattern, limit = 3) {
  return Array.from(new Set(Array.from(text.matchAll(pattern)).map((match) => match[0].trim())))
    .filter(Boolean)
    .slice(0, limit);
}

function htmlToText(raw) {
  return raw.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, content) => (
      /application\/ld\+json/i.test(attrs) ? ` ${content} ` : " "
    ))
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function urlPriorityScore(url) {
  let score = 0;
  const lowerUrl = url.toLowerCase();
  if (/\b(disclaimer|terms|privacy|attorney-advertising|advertising-disclaimer|legal-notice)\b/i.test(lowerUrl)) score -= 80;
  if (/\b(about|about-us|attorneys|our-attorneys|team|firm|contact|profile|bio|state-bar|statebar|calbar)\b/i.test(lowerUrl)) score -= 60;
  if (/\b(results|case-results|verdicts|settlements|testimonials|reviews|awards|media|press)\b/i.test(lowerUrl)) score -= 40;
  if (/\b(chat|intake|consultation|free-case-evaluation|referral|partners|co-counsel)\b/i.test(lowerUrl)) score -= 25;
  if (/\b(blog|news|article|category|tag|author|page\/[0-9]+)\b/i.test(lowerUrl)) score += 25;
  if (/\b(lawyer|attorney)\b/i.test(lowerUrl) && !/\b(attorneys|our-attorneys|attorney-advertising)\b/i.test(lowerUrl)) score += 12;
  return score;
}

function isProbablyHtmlPage(url) {
  return !/\.(pdf|docx?|rtf|txt|csv|xlsx?|pptx?|zip|jpg|jpeg|png|gif|svg|webp|mp4|mov|mp3|css|js|woff2?|ttf|ico)(\?|$)/i.test(url);
}

function isTextFileUrl(url) {
  return /\.(pdf|docx?|rtf|txt)(\?|$)/i.test(url);
}

function normalizeInternalUrl(href, baseUrl) {
  try {
    const base = new URL(baseUrl);
    const linked = new URL(href, base);
    if (linked.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) return "";
    linked.hash = "";
    linked.search = "";
    return linked.href;
  } catch (error) {
    return "";
  }
}

function extractLinkedUrls(raw, baseUrl) {
  const hrefLinks = Array.from(raw.matchAll(/\bhref\s*=\s*["']?([^"'\s>]+)/gi)).map((match) => match[1]);
  const markdownLinks = Array.from(raw.matchAll(/\]\(([^)]+)\)/g)).map((match) => match[1]);
  const jsonLinks = Array.from(raw.matchAll(/"url"\s*:\s*"([^"]+)"/gi)).map((match) => match[1].replaceAll("\\/", "/"));
  const links = hrefLinks.concat(markdownLinks, jsonLinks)
    .filter((href) => href && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("tel:"));

  return Array.from(new Set(links.map((href) => normalizeInternalUrl(href, baseUrl)).filter(Boolean)));
}

function prioritizeUrls(urls) {
  return Array.from(new Set(urls)).sort((a, b) => {
    const priorityDelta = urlPriorityScore(a) - urlPriorityScore(b);
    if (priorityDelta !== 0) return priorityDelta;
    return a.length - b.length;
  });
}

function commonComplianceUrls(baseUrl, linkedUrls = []) {
  const base = new URL(baseUrl);
  const sameSiteLink = linkedUrls.find((url) => {
    try {
      const linked = new URL(url);
      return linked.hostname.replace(/^www\./, "") === base.hostname.replace(/^www\./, "");
    } catch (error) {
      return false;
    }
  });
  const origin = sameSiteLink ? new URL(sameSiteLink).origin : base.origin;
  return [
    "/disclaimer/",
    "/disclaimer",
    "/legal-disclaimer/",
    "/attorney-advertising/",
    "/terms/",
    "/terms-of-use/",
    "/privacy-policy/",
    "/privacy/",
    "/about/",
    "/about-us/",
    "/attorneys/",
    "/our-attorneys/",
    "/team/",
    "/contact/",
    "/results/",
    "/case-results/",
    "/testimonials/"
  ].map((path) => `${origin}${path}`);
}

function isLikelyUsefulPage(page) {
  if (!page || !page.text || page.text.length < 80) return false;
  return !/\b(404|page not found|not found|nothing found|this page could not be found)\b/i.test(page.text.slice(0, 700));
}

async function fetchRawUrl(url, timeoutMs = PAGE_TIMEOUT_MS) {
  return fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, timeoutMs);
}

function sitemapCandidates(baseUrl) {
  const origin = new URL(baseUrl).origin;
  return [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`
  ];
}

function parseSitemapUrls(raw, baseUrl) {
  const locUrls = Array.from(raw.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)).map((match) => match[1].trim());
  const textUrls = Array.from(raw.matchAll(/https?:\/\/[^\s"'<>]+/gi)).map((match) => match[0].trim());
  return locUrls.concat(textUrls).map((href) => normalizeInternalUrl(href, baseUrl)).filter(Boolean);
}

async function discoverSitemapUrls(baseUrl) {
  const firstPass = await Promise.allSettled(sitemapCandidates(baseUrl).map(async (url) => ({
    url,
    raw: await fetchRawUrl(url, 2500)
  })));
  const found = firstPass
    .filter((result) => result.status === "fulfilled" && result.value.raw)
    .flatMap((result) => parseSitemapUrls(result.value.raw, baseUrl));

  const nestedSitemaps = found.filter((url) => /sitemap/i.test(url)).slice(0, 4);
  const nested = await Promise.allSettled(nestedSitemaps.map(async (url) => parseSitemapUrls(await fetchRawUrl(url, 2500), baseUrl)));
  return Array.from(new Set(found.concat(nested.flatMap((result) => result.status === "fulfilled" ? result.value : []))));
}

async function runInBatches(items, batchSize, worker) {
  const results = [];
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const settled = await Promise.allSettled(batch.map(worker));
    results.push(...settled);
  }
  return results;
}

async function fetchWithTimeout(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) return "";
    return await response.text();
  } finally {
    window.clearTimeout(timeout);
  }
}

async function extractOnePage(url, timeoutMs = 12000) {
  const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const readerUrl = `https://r.jina.ai/http://${url}`;
  const parsedUrl = new URL(url);
  const alternateReaderUrl = `https://r.jina.ai/http://${parsedUrl.host}${parsedUrl.pathname}`;
  const [html, readable, alternateReadable] = await Promise.allSettled([
    fetchWithTimeout(allOriginsUrl, timeoutMs),
    fetchWithTimeout(readerUrl, timeoutMs),
    fetchWithTimeout(alternateReaderUrl, timeoutMs)
  ]);
  const rawHtml = html.status === "fulfilled" ? html.value : "";
  const readerText = readable.status === "fulfilled" ? readable.value : "";
  const alternateReaderText = alternateReadable.status === "fulfilled" ? alternateReadable.value : "";
  const text = `${htmlToText(rawHtml)} ${readerText} ${alternateReaderText}`.replace(/\s+/g, " ").trim();
  return { rawHtml, text };
}

async function readWebsiteText(url) {
  let normalized = normalizeWebsite(url);
  let homepage = await extractOnePage(normalized, HOMEPAGE_TIMEOUT_MS);
  if ((!homepage.text || homepage.text.length < 80) && !new URL(normalized).hostname.startsWith("www.")) {
    const retryUrl = new URL(normalized);
    retryUrl.hostname = `www.${retryUrl.hostname}`;
    const retryHomepage = await extractOnePage(retryUrl.href, HOMEPAGE_TIMEOUT_MS);
    if (retryHomepage.text && retryHomepage.text.length >= 80) {
      normalized = retryUrl.href;
      homepage = retryHomepage;
    }
  }
  if (!homepage.text || homepage.text.length < 80) {
    throw new Error("Website extraction failed");
  }

  if (scanStatus) setScanStatus("scanning", "Discovering sitemap, internal pages, headers, footers, legal pages, attorney pages, and text/PDF-style files.");

  const sitemapUrls = await discoverSitemapUrls(normalized);
  const homepageLinks = extractLinkedUrls(`${homepage.rawHtml} ${homepage.text}`, normalized);
  const linkedCandidates = prioritizeUrls(sitemapUrls.concat(homepageLinks));
  const complianceProbeUrls = prioritizeUrls(commonComplianceUrls(normalized, linkedCandidates)).slice(0, MAX_COMPLIANCE_PROBES);
  const linkedPageUrls = linkedCandidates
    .filter((linkedUrl) => linkedUrl !== normalized && isProbablyHtmlPage(linkedUrl))
    .slice(0, MAX_LINKED_PAGES);
  const firstPassCandidates = prioritizeUrls(complianceProbeUrls.concat(linkedPageUrls));
  const fileUrls = linkedCandidates.concat(complianceProbeUrls).filter(isTextFileUrl).slice(0, MAX_FILE_URLS);
  const pageUrls = firstPassCandidates
    .filter((linkedUrl) => linkedUrl !== normalized && isProbablyHtmlPage(linkedUrl))
    .slice(0, MAX_COMPLIANCE_PROBES + MAX_LINKED_PAGES);

  if (scanStatus) setScanStatus("scanning", `Building preview from ${pageUrls.length + 1} priority pages and ${fileUrls.length} file URLs.`);

  const pageResults = await runInBatches(pageUrls, CRAWL_BATCH_SIZE, (link) => extractOnePage(link, PAGE_TIMEOUT_MS));
  const successfulPages = pageResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter(isLikelyUsefulPage);

  const secondPassLinks = prioritizeUrls(successfulPages.flatMap((page) => extractLinkedUrls(`${page.rawHtml} ${page.text}`, normalized)))
    .filter((linkedUrl) => linkedUrl !== normalized && !pageUrls.includes(linkedUrl) && isProbablyHtmlPage(linkedUrl))
    .slice(0, MAX_SECOND_PASS_PAGES);
  const secondPassResults = await runInBatches(secondPassLinks, CRAWL_BATCH_SIZE, (link) => extractOnePage(link, PAGE_TIMEOUT_MS));
  const successfulSecondPassPages = secondPassResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter(isLikelyUsefulPage);

  const fileResults = await runInBatches(fileUrls, CRAWL_BATCH_SIZE, (link) => fetchWithTimeout(`https://r.jina.ai/http://${link}`, FILE_TIMEOUT_MS));
  const successfulFiles = fileResults
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value);

  const combinedText = [homepage.text]
    .concat(successfulPages.map((page) => page.text), successfulSecondPassPages.map((page) => page.text), successfulFiles)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const pagesScanned = 1 + successfulPages.length + successfulSecondPassPages.length;
  const filesScanned = successfulFiles.length;
  const urlsChecked = 1 + pageUrls.length + secondPassLinks.length + fileUrls.length;

  return {
    normalizedUrl: normalized,
    sourceText: combinedText.slice(0, 450000),
    pagesScanned,
    filesScanned,
    urlsChecked,
    extractionStatus: `Preview scan checked ${urlsChecked} URLs and analyzed ${pagesScanned} readable pages${filesScanned ? ` plus ${filesScanned} file URLs` : ""}`
  };
}

function inferPractice(text, url) {
  const scanText = `${text} ${url}`;
  const scored = practiceRules
    .map(([name, pattern]) => ({ name, count: countMatches(scanText, pattern) }))
    .sort((a, b) => b.count - a.count);
  const winner = scored[0];
  return winner && winner.count > 0 ? winner.name : "General / mixed legal services";
}

function detectSignals(text, url) {
  const scanText = `${text} ${url}`;
  const hasChat = /\b(chatbot|live chat|chat now|free case evaluation|case evaluation|contact us|call now)\b/i.test(scanText);
  const signals = new Set();
  const evidence = [];

  signalRules.forEach((rule) => {
    const matches = topMatches(scanText, rule.pattern);
    const hasMatch = matches.length > 0;
    const shouldTrigger =
      (rule.type === "missing" && !hasMatch) ||
      (rule.type === "missingWhenChat" && hasChat && !hasMatch) ||
      (!rule.type && hasMatch);

    if (shouldTrigger) {
      signals.add(rule.id);
      evidence.push({
        id: rule.id,
        label: rule.evidence,
        matches
      });
    } else if (rule.type === "missing" && hasMatch) {
      evidence.push({
        id: `${rule.id}Found`,
        label: `Disclosure signal found: ${rule.evidence.replace(/^No obvious /, "").replace(/ was detected.*$/, "")}.`,
        matches
      });
    }
  });

  return { signals, evidence };
}

function scoreCategory(category, signals) {
  const activeFindings = category.findings.filter((finding) => signals.has(finding.id));
  const rawPenalty = activeFindings.reduce((sum, finding) => {
    const hasDisclosureContext = !signals.has("missingAdDisclosure");
    const adjustedPenalty = finding.id === "settlementNoDisclaimer" && hasDisclosureContext
      ? Math.min(finding.penalty, 4)
      : finding.penalty;
    return sum + adjustedPenalty;
  }, 0);
  const cappedPenalty = Math.min(category.weight, rawPenalty);
  const percent = Math.max(0, Math.round(((category.weight - cappedPenalty) / category.weight) * 100));
  return { ...category, activeFindings, rawPenalty, cappedPenalty, percent };
}

function scoreAssessment({ signals, url, sourceText, evidence, extractionStatus, pagesScanned = 1, filesScanned = 0, urlsChecked = pagesScanned }) {
  const categoryScores = categories.map((category) => scoreCategory(category, signals));
  let totalPenalty = categoryScores.reduce((sum, category) => sum + category.cappedPenalty, 0);
  const inferredFindings = [];

  if (/\b(settlement|cash|win|verdict|injury|accident)\b/i.test(url)) {
    totalPenalty += 5;
    inferredFindings.push("URL language suggests outcome, settlement, injury, accident, cash, or win positioning. Review page copy for guarantees and context.");
  }

  const score = Math.max(0, Math.min(100, 100 - totalPenalty));
  const level = score >= 90 ? "low" : score >= 75 ? "medium" : score >= 60 ? "elevated" : score >= 40 ? "high" : "critical";
  const activeFindings = categoryScores.flatMap((category) =>
    category.activeFindings.map((finding) => `${category.name}: ${finding.label}`)
  );

  const deltas = activeFindings.concat(inferredFindings);
  if (!deltas.length) {
    deltas.push("No high-risk homepage signals were detected. Confirm required disclosures, attorney identity, review records, and monitoring cadence before relying on the score.");
  }

  const nextSteps = [
    "Use a focused COA review to check public pages, landing pages, paid ads, referral funnels, intake scripts, chatbots, and vendor-controlled assets.",
    "Verify attorney identity, office address, advertising disclosures, spokesperson disclosures, and case-result disclaimers on each high-traffic page.",
    "Collect substantiation files for awards, rankings, success claims, settlement numbers, and recovery statistics.",
    "Document vendor approval rights, update workflows, chatbot scripts, transcript sampling, and a practical monitoring cadence."
  ];

  return {
    score,
    level,
    categoryScores,
    deltas,
    nextSteps,
    evidence,
    extractionStatus,
    pagesScanned,
    filesScanned,
    urlsChecked,
    wordsScanned: sourceText.split(/\s+/).filter(Boolean).length,
    signalsChecked: signalRules.length,
    triggeredCount: signals.size + inferredFindings.length
  };
}

function levelLabel(level) {
  return {
    low: "Looks Stable",
    medium: "Review Suggested",
    elevated: "Review Suggested",
    high: "Priority Review",
    critical: "Priority Review"
  }[level];
}

function rowClass(percent) {
  if (percent >= 85) return "clear";
  if (percent >= 60) return "watch";
  return "alert";
}

function scoreTone(level) {
  if (level === "low") return "clear";
  if (level === "medium" || level === "elevated") return "watch";
  return "alert";
}

function scoreColor(score) {
  if (score >= 90) return "#27a76f";
  if (score >= 60) return "#c56a16";
  return "#b43b45";
}

function reviewLabel(percent) {
  if (percent >= 85) return "Looks stable";
  if (percent >= 60) return "Review suggested";
  return "Priority review";
}

function renderScanProgress(website) {
  reportCard.innerHTML = `
    <div class="scan-progress" aria-live="polite">
      <div class="scan-orbit" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="scan-copy">
        <span class="report-badge">Scanning</span>
        <h3>Building SB37 report</h3>
        <p>${escapeHtml(website)}</p>
      </div>
      <div class="scan-bar" aria-hidden="true"><span></span></div>
      <div class="scan-phase">
        <strong id="scanPhaseLabel">${escapeHtml(scanPhases[0])}</strong>
        <span id="scanPercent">8%</span>
      </div>
      <div class="scan-modules" aria-label="Analysis modules">
        ${categories.map((category, index) => `
          <span class="${index === 0 ? "active" : ""}">${escapeHtml(category.name)}</span>
        `).join("")}
      </div>
    </div>
  `;
}

function startScanMotion() {
  window.clearInterval(scanMotionTimer);
  let step = 0;
  scanMotionTimer = window.setInterval(() => {
    step += 1;
    const phaseLabel = document.querySelector("#scanPhaseLabel");
    const percentLabel = document.querySelector("#scanPercent");
    const moduleChips = Array.from(document.querySelectorAll(".scan-modules span"));
    if (!phaseLabel || !percentLabel || !moduleChips.length) return;

    const phase = scanPhases[step % scanPhases.length];
    const percent = Math.min(94, 8 + step * 6);
    phaseLabel.textContent = phase;
    percentLabel.textContent = `${percent}%`;
    moduleChips.forEach((chip, index) => {
      chip.classList.toggle("active", index === step % moduleChips.length);
      chip.classList.toggle("done", index < step % (moduleChips.length + 1));
    });
  }, 1450);
}

function stopScanMotion() {
  window.clearInterval(scanMotionTimer);
  scanMotionTimer = null;
}

function categoryPreviewReason(category) {
  if (!category.activeFindings.length) {
    return "No obvious preview signal triggered in this area.";
  }

  const teasers = category.activeFindings
    .map((finding) => findingTeasers[finding.id] || finding.label)
    .filter(Boolean);
  const uniqueTeasers = Array.from(new Set(teasers)).slice(0, 2);
  const suffix = category.activeFindings.length > uniqueTeasers.length ? " Additional signals may need review." : " Review this area in context.";
  return `${uniqueTeasers.join(" ")}${suffix}`;
}

function renderMarketBoard(categoryScores, limit = categoryScores.length) {
  const ordered = [...categoryScores].sort((a, b) => a.percent - b.percent).slice(0, limit);
  return ordered.map((category) => `
    <div class="review-row ${rowClass(category.percent)}">
      <div>
        <strong>${escapeHtml(category.name)}</strong>
        <span>${reviewLabel(category.percent)}</span>
        <p>${escapeHtml(categoryPreviewReason(category))}</p>
      </div>
    </div>
  `).join("");
}

function renderCompactStats(scoreData) {
  return `
    <div class="report-statline" aria-label="Scan summary">
      <span>${scoreData.urlsChecked} URLs</span>
      <span>${scoreData.pagesScanned} pages</span>
      <span>${scoreData.signalsChecked} signals</span>
    </div>
  `;
}

const categoryFixes = {
  disclosures: {
    risk: "Disclosure signals are a useful first place to improve clarity. If disclaimer language is only in a footer or legal page, the next step is to make the right context easier to see near important claims and forms.",
    firstFix: "Place attorney advertising, responsible attorney, firm identity, office address, and disclaimer language in visible page-level locations.",
    implementation: [
      "Create a reusable disclosure block for every landing page template.",
      "Place the block near high-intent CTAs, chat widgets, case-result sections, testimonial sections, and footer.",
      "Confirm the responsible attorney or firm identity appears in crawlable text, not only inside an image.",
      "Snapshot before and after versions for the compliance file."
    ],
    evidence: [
      "Screenshots of each page template after update.",
      "Responsible attorney approval note.",
      "Version date and URL inventory."
    ],
    serviceNeed: "A guided review can help confirm which page templates need small edits and which claims need closer context."
  },
  claims: {
    risk: "Result and compensation language deserves careful review because consumers may read it as an expectation about their own matter unless the page gives enough context.",
    firstFix: "Pair every result, recovery, settlement, verdict, and compensation claim with nearby context and past-results disclaimer language.",
    implementation: [
      "Inventory every dollar amount, verdict, settlement, recovered, won, success, and compensation phrase.",
      "Add matter-specific context where allowed: jurisdiction, case type, date range, and that every case is different.",
      "Move past-results disclaimer language close to the claim, not only in the footer.",
      "Remove guarantee, quick-cash, fast-settlement, and maximum-compensation phrasing unless counsel approves exact wording."
    ],
    evidence: [
      "Result-claim spreadsheet with URL, claim text, source, approval date, and disclaimer placement.",
      "Backup documents for each published number or outcome.",
      "Attorney signoff for edited copy."
    ],
    serviceNeed: "A guided review can separate routine success language from claims that should be rewritten or supported with better context."
  },
  awards: {
    risk: "Award, ranking, top, best, expert, and specialist language is easier to trust when the source, date, and limits are visible.",
    firstFix: "Add source, date, ranking body, eligibility criteria, and limitations near award, best, top, or specialist claims.",
    implementation: [
      "Build an awards and rankings substantiation file.",
      "Add source/date language beside each badge or superiority claim.",
      "Separate certified-specialist claims from informal expert/top/best marketing language.",
      "Remove unsupported best/top/#1 wording or replace it with sourced, factual language."
    ],
    evidence: [
      "Award certificates or source pages.",
      "Selection methodology where available.",
      "Attorney approval for each claim."
    ],
    serviceNeed: "A guided review can help organize which badges are already supported and which need source language added."
  },
  ai: {
    risk: "AI-assisted content is easier to manage when the firm can show who reviewed it before publication.",
    firstFix: "Document attorney review for AI-assisted content and avoid any copy that implies automated legal advice or synthetic attorney endorsement.",
    implementation: [
      "Label AI-assisted workflows internally, even if not public-facing.",
      "Require attorney review before AI-assisted content, images, video, or chat copy goes live.",
      "Avoid AI lawyer, virtual lawyer, automated legal advice, synthetic voice, or avatar claims.",
      "Keep prompts, drafts, approvals, and final copy in a review log."
    ],
    evidence: [
      "AI content review log.",
      "Approval workflow screenshots.",
      "Vendor AI-use disclosure and takedown terms."
    ],
    serviceNeed: "A guided workflow can help create a simple approval log before AI-assisted content spreads across pages and vendors."
  },
  chatbot: {
    risk: "Chat and case-evaluation flows are more customer-friendly when users understand what the tool can and cannot do before they submit details.",
    firstFix: "Add no-legal-advice and no-attorney-client language before chat or case-evaluation flows, with clear attorney escalation rules.",
    implementation: [
      "Add pre-chat disclaimer language before the user submits facts.",
      "Block the bot from giving case-specific legal conclusions.",
      "Create escalation rules for urgent, jurisdictional, conflict, and representation questions.",
      "Sample transcripts monthly and document follow-up changes."
    ],
    evidence: [
      "Chat script and prompt policy.",
      "Transcript QA samples.",
      "Escalation and conflict-screen procedure."
    ],
    serviceNeed: "A guided review can test the flow itself, not just the page where the chat or form appears."
  },
  intake: {
    risk: "Intake copy and call-center scripts are where website interest becomes a real conversation, so clear scripts help protect both the consumer and the firm.",
    firstFix: "Review intake scripts for outcome promises and document attorney supervision for non-attorney staff or call center workflows.",
    implementation: [
      "Collect scripts, form autoresponders, SMS templates, call prompts, and CRM nurture copy.",
      "Remove promises about settlement speed, payment, case value, or guaranteed help.",
      "Add supervision and escalation rules for non-attorney staff.",
      "Train intake staff and record the training date."
    ],
    evidence: [
      "Approved script library.",
      "Training records.",
      "Call QA checklist and sample review log."
    ],
    serviceNeed: "A guided review can help locate the forms, scripts, autoresponders, and CRM messages that are easy to miss from a website-only scan."
  },
  vendor: {
    risk: "Vendor-created SEO, PPC, landing pages, and lead funnels often change quickly, so the next step is making review and approval easier to prove.",
    firstFix: "Require attorney approval before vendor-created SEO, PPC, landing pages, content updates, or lead-generation copy goes live.",
    implementation: [
      "List every vendor with publishing access or campaign control.",
      "Add attorney approval rights and takedown timing to vendor workflows.",
      "Review paid landing pages, ad copy, dynamic inserts, and SEO pages against the same rules as the main site.",
      "Create a monthly change-detection process."
    ],
    evidence: [
      "Vendor roster and access list.",
      "Approval workflow records.",
      "Ad and landing-page archive."
    ],
    serviceNeed: "A guided review can help connect the main website, ad accounts, landing pages, and vendor workflows into one approval trail."
  },
  referral: {
    risk: "Referral, matching, network, affiliate, partner, and co-counsel language is more useful when consumers can tell who owns the advertising and who will contact them.",
    firstFix: "Clarify referral, co-counsel, partner, network, affiliate, and lead-generator relationships wherever those signals appear.",
    implementation: [
      "Inventory every page and funnel that mentions referrals, partners, networks, co-counsel, or powered-by language.",
      "Clarify who owns the advertising and who will contact the consumer.",
      "Add required relationship disclosures near lead forms and comparison pages.",
      "Confirm lead-generator contracts match the public-facing language."
    ],
    evidence: [
      "Referral and lead-source inventory.",
      "Co-counsel or lead-gen agreements.",
      "Screenshots of relationship disclosures."
    ],
    serviceNeed: "A guided review can compare the public wording against the firm’s actual referral, co-counsel, or lead-source process."
  },
  transparency: {
    risk: "Attorney and firm identity details help visitors understand who is responsible for the advertisement and how to verify the firm.",
    firstFix: "Make attorney identity, firm ownership, office location, and responsible-contact details easy to find from the scanned pages.",
    implementation: [
      "Make attorney and firm identity visible in crawlable text.",
      "Add office/contact details to footer, contact page, attorney page, and landing-page templates.",
      "Link attorney bios from practice pages and high-conversion pages.",
      "Archive screenshots after deployment."
    ],
    evidence: [
      "Attorney bio inventory.",
      "Office-address screenshots.",
      "Responsible-contact approval record."
    ],
    serviceNeed: "A guided review can make sure those details stay consistent across the main site and any standalone landing pages."
  }
};

function categoryFix(category) {
  return categoryFixes[category.id] || {
    risk: "This area is worth a closer look because the preview found public-facing signals that may benefit from clearer context, documentation, or supervision.",
    firstFix: "Review this category and document a simple next-step plan.",
    implementation: [
      "Inventory affected pages and assets.",
      "Confirm the correct disclaimer, substantiation, and approval record.",
      "Update the public copy and archive the before/after version."
    ],
    evidence: [
      "URL inventory.",
      "Attorney approval record.",
      "Before/after screenshots."
    ],
    serviceNeed: "A guided review can separate true issues from noisy public-page signals."
  };
}

function renderProduceReportForm() {
  return `
    <section class="produce-report-card">
      <div class="produce-copy">
        <span class="report-badge">Free first step</span>
        <h4>Send me the executive PDF</h4>
        <p>Get a short score summary, the top three review areas, and the recommended first move.</p>
        <div class="report-benefits" aria-label="Report includes">
          <span>1-page style</span>
          <span>Top 3 issues</span>
          <span>Next step</span>
        </div>
      </div>
      <form id="produceReportForm">
        <label>
          <span>Name</span>
          <input id="reportName" type="text" autocomplete="name" placeholder="Full name" required>
        </label>
        <label>
          <span>Email</span>
          <input id="reportEmail" type="email" autocomplete="email" placeholder="name@firm.com" required>
        </label>
        <label class="phone-field">
          <span>Phone</span>
          <div>
            <select id="phoneCountryCode" aria-label="Phone country code" required>
              <option value="+1" selected>USA +1</option>
            </select>
            <input id="reportPhone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(555) 555-5555" required>
          </div>
        </label>
        <label class="consent-field">
          <input id="leadConsent" type="checkbox" required>
          <span>${escapeHtml(LEAD_CONSENT_TEXT)}</span>
        </label>
        <button class="button primary" type="submit">Create executive PDF</button>
      </form>
      <p class="form-note" id="produceReportNote">The PDF is generated in this browser from the current scan. Educational preview only, not legal advice.</p>
    </section>
  `;
}

function renderNextStepCard() {
  return `
    <section class="next-step-card">
      <div>
        <span class="report-badge">Optional next step</span>
        <h4>Schedule a 15-minute review</h4>
        <p>The free report covers public website signals. A paid COA review can also look at ads, landing pages, chatbots, intake scripts, CRM messages, referral funnels, vendor pages, and monthly monitoring.</p>
      </div>
      <a class="button secondary" href="${CALENDLY_URL}" target="_blank" rel="noopener">Schedule time</a>
    </section>
  `;
}

function renderReport({ firmName, website, practice, scoreData }) {
  const tone = scoreTone(scoreData.level);
  latestReportData = { firmName, website, practice, scoreData };
  reportCard.innerHTML = `
    <div class="report-result status-${tone}">
      <div class="score-hero">
        <div class="score-ring ${tone}" data-score="${scoreData.score}" style="--score: 0deg; --score-color: ${scoreColor(scoreData.score)}">
          <div class="score-pointer" aria-hidden="true"></div>
          <div class="score-ring-core">
            <strong class="score-value">0</strong>
            <span>SB37 score</span>
          </div>
        </div>
        <div>
          <span class="report-badge">${escapeHtml(levelLabel(scoreData.level))}</span>
          <h3>${escapeHtml(firmName || "Website")} scan complete</h3>
          <p>${escapeHtml(website)}</p>
          <p class="form-note">Detected practice: ${escapeHtml(practice)}.</p>
          ${renderCompactStats(scoreData)}
        </div>
      </div>
      ${renderProduceReportForm()}
      <section>
        <h4>Top review areas</h4>
        <div class="market-board">${renderMarketBoard(scoreData.categoryScores, 3)}</div>
      </section>
      <details class="full-breakdown">
        <summary>View full category breakdown</summary>
        <div class="market-board">${renderMarketBoard(scoreData.categoryScores)}</div>
      </details>
      ${renderNextStepCard()}
      <p class="form-note">Educational preliminary screen only. Not legal advice and not a compliance certification.</p>
    </div>
  `;
  animateScoreWheel(scoreData.score);
  wireProduceReportForm();
}

function executiveReportData(contact, reportData) {
  const { website, practice, scoreData } = reportData;
  const priorityCategories = scoreData.categoryScores
    .filter((category) => category.percent < 100)
    .sort((a, b) => a.percent - b.percent);
  const topCategories = priorityCategories.slice(0, 5);
  const reviewCount = priorityCategories.length;
  const phone = contact.phoneE164 || `${contact.phoneCountryCode || ""} ${contact.phone}`.trim();
  const reviewAreas = topCategories.length
    ? topCategories.map((category) => ({
      name: category.name,
      reason: categoryPreviewReason(category),
      move: categoryFix(category).firstFix
    }))
    : [{
      name: "No obvious priority area",
      reason: "No obvious public-facing gaps were surfaced in this preview.",
      move: "Continue verifying disclosures, ads, chat, intake, vendor content, and monitoring records before relying on the score."
    }];

  return {
    title: "SB37 COA Executive Preview",
    website,
    practice,
    score: scoreData.score,
    status: levelLabel(scoreData.level),
    preparedFor: contact.name,
    email: contact.email,
    phone,
    generated: new Date().toLocaleDateString(),
    scope: `${scoreData.urlsChecked} URLs checked | ${scoreData.pagesScanned} pages analyzed | ${scoreData.signalsChecked} signals reviewed`,
    summary: `${reviewCount} of ${scoreData.categoryScores.length} SB37 areas need a closer look. This preview flags public marketing signals that may need clearer wording, placement, or documentation.`,
    why: "Primary signals: disclosures, claims, intake/chat, vendor pages, referrals, and attorney responsibility.",
    reviewAreas,
    recommendation: "Book a short COA review to confirm the scan, rule out false positives, and identify the first fixes.",
    calendlyUrl: CALENDLY_URL,
    contactEmail: REPORT_CONTACT_EMAIL,
    disclaimer: "Educational preliminary screen only. Not legal advice, not an attorney-client relationship, and not a compliance certification."
  };
}

function wrapPdfLine(line, maxLength = 88) {
  const words = String(line).split(/\s+/);
  const output = [];
  let current = "";
  words.forEach((word) => {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= maxLength) {
      current = `${current} ${word}`;
    } else {
      output.push(current);
      current = word;
    }
  });
  output.push(current);
  return output;
}

function escapePdfText(value) {
  return String(value)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function pdfColor(hex) {
  const clean = hex.replace("#", "");
  const parts = [0, 2, 4].map((start) => parseInt(clean.slice(start, start + 2), 16) / 255);
  return parts.map((part) => part.toFixed(3)).join(" ");
}

function pdfText(x, y, size, text, font = "F1", color = "#121927") {
  return `BT /${font} ${size} Tf ${pdfColor(color)} rg ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

function pdfRect(x, y, width, height, color) {
  return `${pdfColor(color)} rg ${x} ${y} ${width} ${height} re f`;
}

function pdfCircle(cx, cy, radius, color) {
  const kappa = 0.5522847498;
  const c = radius * kappa;
  return [
    `${pdfColor(color)} rg`,
    `${cx + radius} ${cy} m`,
    `${cx + radius} ${cy + c} ${cx + c} ${cy + radius} ${cx} ${cy + radius} c`,
    `${cx - c} ${cy + radius} ${cx - radius} ${cy + c} ${cx - radius} ${cy} c`,
    `${cx - radius} ${cy - c} ${cx - c} ${cy - radius} ${cx} ${cy - radius} c`,
    `${cx + c} ${cy - radius} ${cx + radius} ${cy - c} ${cx + radius} ${cy} c`,
    "f"
  ].join(" ");
}

function pdfLine(x1, y1, x2, y2, color = "#dbe3e8", width = 1) {
  return `${pdfColor(color)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`;
}

function pdfLinkAnnotation(x1, y1, x2, y2, url) {
  return `<< /Type /Annot /Subtype /Link /Rect [${x1} ${y1} ${x2} ${y2}] /Border [0 0 0] /A << /S /URI /URI (${escapePdfText(url)}) >> >>`;
}

function pdfWrap(text, maxChars) {
  return wrapPdfLine(text, maxChars).filter(Boolean);
}

function addPdfWrappedText(commands, text, x, y, options = {}) {
  const size = options.size || 10;
  const maxChars = options.maxChars || 78;
  const lineHeight = options.lineHeight || size + 4;
  const font = options.font || "F1";
  const color = options.color || "#121927";
  const lines = pdfWrap(text, maxChars).slice(0, options.maxLines || Infinity);
  lines.forEach((line, index) => {
    commands.push(pdfText(x, y - index * lineHeight, size, line, font, color));
  });
  return y - lines.length * lineHeight;
}

function buildPdfBlob(report) {
  const commands = [];
  const annotations = [];
  const pageWidth = 420;
  const pageHeight = 720;
  const scoreColorValue = scoreColor(report.score);
  const scoreText = String(report.score);
  const scoreTextX = scoreText.length >= 3 ? 337 : scoreText.length === 2 ? 343 : 348;
  const scoreLabel = /priority/i.test(report.status) ? "PRIORITY" : report.status.split(/\s+/)[0].slice(0, 7).toUpperCase();

  commands.push(pdfRect(0, 656, pageWidth, 64, "#121927"));
  commands.push(pdfRect(0, 646, pageWidth, 10, "#078c86"));
  commands.push(pdfText(28, 686, 24, "SB37", "F2", "#ffffff"));
  commands.push(pdfText(96, 691, 8.5, "COA EXECUTIVE PREVIEW", "F2", "#d7edf4"));
  commands.push(pdfText(28, 670, 8.5, "California legal advertising scan | sb37score.com", "F1", "#dbe3e8"));

  commands.push(pdfRect(28, 574, 364, 56, "#f3fbfa"));
  commands.push(pdfRect(28, 574, 6, 56, "#078c86"));
  commands.push(pdfText(44, 608, 15, report.website, "F2", "#121927"));
  commands.push(pdfText(44, 592, 8.5, `Practice: ${report.practice}`, "F1", "#5f6b7b"));
  commands.push(pdfText(44, 581, 7.5, report.scope, "F1", "#5f6b7b"));
  commands.push(pdfCircle(354, 602, 25, scoreColorValue));
  commands.push(pdfText(scoreTextX, 606, 14, scoreText, "F2", "#ffffff"));
  commands.push(pdfText(337, 593, 5.8, scoreLabel, "F2", "#ffffff"));

  commands.push(pdfText(28, 550, 8.5, `Prepared for: ${report.preparedFor}`, "F2", "#121927"));
  commands.push(pdfText(28, 537, 8.2, `Email: ${report.email}`, "F1", "#5f6b7b"));
  commands.push(pdfText(236, 550, 8.2, `Generated: ${report.generated}`, "F1", "#5f6b7b"));
  commands.push(pdfText(236, 537, 8.2, `Phone: ${report.phone}`, "F1", "#5f6b7b"));
  commands.push(pdfLine(28, 520, 392, 520));

  commands.push(pdfText(28, 494, 13, "Executive Summary", "F2", "#078c86"));
  let y = addPdfWrappedText(commands, report.summary, 28, 476, { size: 9.5, maxChars: 64, lineHeight: 12, maxLines: 3, color: "#121927" });
  y = addPdfWrappedText(commands, report.why, 28, y - 4, { size: 8.7, maxChars: 66, lineHeight: 11, maxLines: 2, color: "#5f6b7b" });

  commands.push(pdfText(28, y - 16, 13, "Top Review Areas", "F2", "#078c86"));
  y -= 38;
  report.reviewAreas.slice(0, 5).forEach((area, index) => {
    commands.push(pdfRect(28, y - 28, 364, 33, index === 0 ? "#fff4f5" : "#f9fbfb"));
    commands.push(pdfText(42, y - 13, 10.5, `${index + 1}. ${area.name}`, "F2", "#121927"));
    addPdfWrappedText(commands, area.reason, 42, y - 25, { size: 7.8, maxChars: 76, lineHeight: 9, maxLines: 1, color: "#3f4b5a" });
    y -= 39;
  });

  commands.push(pdfRect(28, 72, 364, 70, "#fffdf8"));
  commands.push(pdfText(42, 121, 12, "Recommended First Move", "F2", "#c56a16"));
  addPdfWrappedText(commands, report.recommendation, 42, 106, { size: 8.4, maxChars: 58, lineHeight: 10, maxLines: 2, color: "#121927" });
  commands.push(pdfRect(42, 80, 336, 24, "#078c86"));
  commands.push(pdfText(137, 88, 10, "Schedule 15-minute review", "F2", "#ffffff"));
  annotations.push(pdfLinkAnnotation(42, 80, 378, 104, report.calendlyUrl));

  commands.push(pdfLine(28, 44, 392, 44));
  addPdfWrappedText(commands, report.disclaimer, 28, 31, { size: 6.5, maxChars: 92, lineHeight: 8, color: "#5f6b7b" });
  commands.push(pdfText(28, 12, 7, `SB37 Score | sb37score.com | ${report.contactEmail}`, "F2", "#078c86"));
  annotations.push(pdfLinkAnnotation(141, 8, 252, 19, `mailto:${report.contactEmail}`));

  const objects = [null];
  const addObject = (body) => {
    objects.push(body);
    return objects.length - 1;
  };
  const catalogId = addObject("");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const stream = commands.join("\n");
  const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  const annotationIds = annotations.map((annotation) => addObject(annotation));
  const annotsRef = annotationIds.length ? ` /Annots [${annotationIds.map((id) => `${id} 0 R`).join(" ")}]` : "";
  const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R${annotsRef} >>`);

  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] = `<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function leadPayload(contact, reportData) {
  return {
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    phoneCountryCode: contact.phoneCountryCode,
    phoneNational: contact.phoneNational,
    phoneE164: contact.phoneE164,
    website: reportData.website,
    practice: reportData.practice,
    score: reportData.scoreData.score,
    status: levelLabel(reportData.scoreData.level),
    urlsChecked: reportData.scoreData.urlsChecked,
    pagesScanned: reportData.scoreData.pagesScanned,
    signalsChecked: reportData.scoreData.signalsChecked,
    schedulingUrl: CALENDLY_URL,
    consentGiven: Boolean(contact.consentGiven),
    consentText: LEAD_CONSENT_TEXT,
    consentTimestamp: contact.consentTimestamp,
    consentSource: "SB37 executive PDF form",
    createdAt: new Date().toISOString()
  };
}

async function submitLead(payload) {
  const storedLeads = JSON.parse(window.localStorage.getItem("sb37Leads") || "[]");
  storedLeads.push(payload);
  window.localStorage.setItem("sb37Leads", JSON.stringify(storedLeads.slice(-50)));

  if (!LEAD_WEBHOOK_URL) {
    return { sent: false };
  }

  await fetch(LEAD_WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    keepalive: true
  });
  return { sent: true };
}

function wireProduceReportForm() {
  const form = document.querySelector("#produceReportForm");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!latestReportData) return;

    const submitButton = form.querySelector("button[type='submit']");
    const note = document.querySelector("#produceReportNote");
    const phone = normalizeUsPhone(document.querySelector("#reportPhone").value);
    const contact = {
      name: document.querySelector("#reportName").value.trim(),
      email: document.querySelector("#reportEmail").value.trim(),
      phone: document.querySelector("#reportPhone").value.trim(),
      phoneCountryCode: document.querySelector("#phoneCountryCode").value,
      phoneNational: phone ? phone.national : "",
      phoneE164: phone ? phone.e164 : "",
      consentGiven: document.querySelector("#leadConsent").checked,
      consentTimestamp: new Date().toISOString()
    };

    if (!contact.name || !contact.email || !contact.phone || !contact.phoneCountryCode) {
      if (note) note.textContent = "Please complete every field to create the PDF report.";
      form.reportValidity();
      return;
    }

    if (!isValidEmail(contact.email)) {
      if (note) note.textContent = "Please enter a valid email address.";
      document.querySelector("#reportEmail").focus();
      return;
    }

    if (contact.phoneCountryCode !== "+1" || !phone) {
      if (note) note.textContent = "Please enter a valid USA +1 phone number.";
      document.querySelector("#reportPhone").focus();
      return;
    }

    if (!contact.consentGiven) {
      if (note) note.textContent = "Please check the consent box to create the PDF report.";
      form.reportValidity();
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Creating...";
    }

    const report = executiveReportData(contact, latestReportData);
    const blob = buildPdfBlob(report);
    const link = document.createElement("a");
    const domain = latestReportData.website.replace(/^https?:\/\//i, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "sb37-report";
    link.href = URL.createObjectURL(blob);
    link.download = `${domain}-sb37-preview-report.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);

    try {
      await submitLead(leadPayload(contact, latestReportData));
    } catch (error) {
      console.warn("Lead submission failed", error);
    }

    if (note) {
      note.innerHTML = `PDF created. <a href="${CALENDLY_URL}" target="_blank" rel="noopener">Schedule a 15-minute review</a> to go through the results.`;
    }
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Create executive PDF";
    }
  });
}

function animateScoreWheel(score) {
  const ring = reportCard.querySelector(".score-ring");
  const value = reportCard.querySelector(".score-value");
  if (!ring || !value) return;

  const duration = 1300;
  const start = performance.now();
  const target = Math.max(0, Math.min(100, score));

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = easeOutCubic(progress);
    const currentScore = Math.round(target * eased);
    const currentAngle = target * 3.6 * eased;
    ring.style.setProperty("--score", `${currentAngle}deg`);
    value.textContent = String(currentScore);
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      ring.style.setProperty("--score", `${target * 3.6}deg`);
      value.textContent = String(target);
    }
  }

  requestAnimationFrame(frame);
}

function setScanStatus(state, message) {
  if (!scanStatus) return;
  scanStatus.textContent = message || state || "";
}

if (assessmentForm) {
  assessmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const websiteInput = document.querySelector("#website");
    const submitButton = assessmentForm.querySelector("button[type='submit']");
    const rawWebsite = websiteInput.value.trim();
    const firmName = "";
    const normalizedWebsite = normalizeWebsite(rawWebsite);

    submitButton.disabled = true;
    submitButton.textContent = "Analyzing...";
    renderScanProgress(normalizedWebsite);
    startScanMotion();
    setScanStatus("scanning", "Running fast preview scan across key pages, structured data, legal pages, and visible marketing signals.");

    let scanData;
    try {
      scanData = await readWebsiteText(normalizedWebsite);
      setScanStatus("", `Scan complete. ${scanData.extractionStatus}.`);
    } catch (error) {
      scanData = {
        normalizedUrl: normalizedWebsite,
        sourceText: normalizedWebsite,
        pagesScanned: 0,
        filesScanned: 0,
        urlsChecked: 1,
        extractionStatus: "Limited scan: the site blocked or failed public text extraction, so the report used URL-level signals only"
      };
      setScanStatus("warning", "The site blocked public extraction. The report still ran every category using URL-level signals.");
    }

    const practice = inferPractice(scanData.sourceText, scanData.normalizedUrl);
    const { signals, evidence } = detectSignals(scanData.sourceText, scanData.normalizedUrl);
    const scoreData = scoreAssessment({
      signals,
      url: scanData.normalizedUrl,
      sourceText: scanData.sourceText,
      evidence,
      extractionStatus: scanData.extractionStatus,
      pagesScanned: scanData.pagesScanned,
      filesScanned: scanData.filesScanned,
      urlsChecked: scanData.urlsChecked
    });

    renderReport({ firmName, website: scanData.normalizedUrl, practice, scoreData });
    stopScanMotion();
    document.querySelector("#assessment").scrollIntoView({ behavior: "smooth", block: "start" });
    submitButton.disabled = false;
    submitButton.textContent = "Analyze";
  });
}
