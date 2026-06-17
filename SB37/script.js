const assessmentForm = document.querySelector("#assessmentForm");
const reportCard = document.querySelector("#reportCard");
const scanStatus = document.querySelector("#scanStatus");

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
      { id: "settlementNoDisclaimer", penalty: 10, label: "Settlement or verdict claims without context/disclaimer" },
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
  { id: "coBrandedPages", pattern: /\b(partner|co-counsel|network|affiliate|joint|sponsored by|in partnership with|powered by)\b/gi, evidence: "The site appears to reference partner, network, affiliate, co-counsel, or powered-by relationships." },
  { id: "unclearReferral", pattern: /\b(referral|referred|lead generator|matching service|legal network|find a lawyer|connect you with)\b/gi, evidence: "The site appears to reference referral, matching, lead-generator, or legal-network relationships." }
];

const findingTeasers = {
  missingResponsibleAttorney: "Responsible attorney or firm identity was not obvious in the scanned text.",
  missingOfficeAddress: "Office or State Bar address signals were not obvious in the scanned text.",
  missingAdDisclosure: "Advertising, spokesperson, dramatization, or result-disclaimer language was not obvious.",
  settlementNoDisclaimer: "Result, settlement, verdict, recovery, or win language appeared in the preview.",
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

const MAX_DEEP_PAGES = 4;
const MAX_FILE_URLS = 0;
const CRAWL_BATCH_SIZE = 8;
const PAGE_TIMEOUT_MS = 2600;
const FILE_TIMEOUT_MS = 2600;

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

function isLikelyDisclosureLink(url) {
  return /\b(disclaimer|terms|privacy|contact|about|attorney|lawyer|team|firm|state-bar|statebar|bar|profile|bio)\b/i.test(url);
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
    const aDisclosure = isLikelyDisclosureLink(a) ? 0 : 1;
    const bDisclosure = isLikelyDisclosureLink(b) ? 0 : 1;
    if (aDisclosure !== bDisclosure) return aDisclosure - bDisclosure;
    return a.length - b.length;
  });
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
  const [html, readable] = await Promise.allSettled([
    fetchWithTimeout(allOriginsUrl, timeoutMs),
    fetchWithTimeout(readerUrl, timeoutMs)
  ]);
  const rawHtml = html.status === "fulfilled" ? html.value : "";
  const readerText = readable.status === "fulfilled" ? readable.value : "";
  const text = `${htmlToText(rawHtml)} ${readerText}`.replace(/\s+/g, " ").trim();
  return { rawHtml, text };
}

async function readWebsiteText(url) {
  const normalized = normalizeWebsite(url);
  const homepage = await extractOnePage(normalized);
  if (!homepage.text || homepage.text.length < 80) {
    throw new Error("Website extraction failed");
  }

  if (scanStatus) setScanStatus("scanning", "Discovering sitemap, internal pages, headers, footers, legal pages, attorney pages, and text/PDF-style files.");

  const sitemapUrls = await discoverSitemapUrls(normalized);
  const homepageLinks = extractLinkedUrls(`${homepage.rawHtml} ${homepage.text}`, normalized);
  const fileUrls = prioritizeUrls(sitemapUrls.concat(homepageLinks)).filter(isTextFileUrl).slice(0, MAX_FILE_URLS);
  const pageUrls = prioritizeUrls(sitemapUrls.concat(homepageLinks))
    .filter((linkedUrl) => linkedUrl !== normalized && isProbablyHtmlPage(linkedUrl))
    .slice(0, MAX_DEEP_PAGES);

  if (scanStatus) setScanStatus("scanning", `Building preview from ${pageUrls.length + 1} key pages and ${fileUrls.length} file URLs.`);

  const pageResults = await runInBatches(pageUrls, CRAWL_BATCH_SIZE, (link) => extractOnePage(link, PAGE_TIMEOUT_MS));
  const successfulPages = pageResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((page) => page.text && page.text.length >= 40);

  const fileResults = await runInBatches(fileUrls, CRAWL_BATCH_SIZE, (link) => fetchWithTimeout(`https://r.jina.ai/http://${link}`, FILE_TIMEOUT_MS));
  const successfulFiles = fileResults
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value);

  const combinedText = [homepage.text]
    .concat(successfulPages.map((page) => page.text), successfulFiles)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const pagesScanned = 1 + successfulPages.length;
  const filesScanned = successfulFiles.length;

  return {
    normalizedUrl: normalized,
    sourceText: combinedText.slice(0, 450000),
    pagesScanned,
    filesScanned,
    extractionStatus: `Preview scan checked ${pagesScanned} key pages${filesScanned ? ` and ${filesScanned} file URLs` : ""}`
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
  const rawPenalty = activeFindings.reduce((sum, finding) => sum + finding.penalty, 0);
  const cappedPenalty = Math.min(category.weight, rawPenalty);
  const percent = Math.max(0, Math.round(((category.weight - cappedPenalty) / category.weight) * 100));
  return { ...category, activeFindings, rawPenalty, cappedPenalty, percent };
}

function scoreAssessment({ signals, url, sourceText, evidence, extractionStatus, pagesScanned = 1, filesScanned = 0 }) {
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
    "Run the full COA review against every public page, landing page, paid ad, referral funnel, intake script, chatbot, and vendor-controlled asset.",
    "Verify attorney identity, office address, advertising disclosures, spokesperson disclosures, and case-result disclaimers on each high-traffic page.",
    "Collect substantiation files for awards, rankings, success claims, settlement numbers, and recovery statistics.",
    "Document vendor approval rights, takedown obligations, chatbot scripts, transcript sampling, and quarterly monitoring cadence."
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

function categoryPreviewReason(category) {
  if (!category.activeFindings.length) {
    return "No obvious preview signal triggered in this area.";
  }

  const teasers = category.activeFindings
    .map((finding) => findingTeasers[finding.id] || finding.label)
    .filter(Boolean);
  const uniqueTeasers = Array.from(new Set(teasers)).slice(0, 2);
  const suffix = category.activeFindings.length > uniqueTeasers.length ? " Full trigger list is locked." : " Exact locations are locked.";
  return `${uniqueTeasers.join(" ")}${suffix}`;
}

function renderMarketBoard(categoryScores) {
  const ordered = [...categoryScores].sort((a, b) => a.percent - b.percent);
  return ordered.map((category) => `
    <div class="review-row ${rowClass(category.percent)}">
      <div>
        <strong>${escapeHtml(category.name)}</strong>
        <span>${category.percent < 100 ? "Locked delta available" : reviewLabel(category.percent)}</span>
        <p>${escapeHtml(categoryPreviewReason(category))}</p>
      </div>
      <div class="review-pill">${category.percent < 100 ? "Locked" : `${category.percent}%`}</div>
    </div>
  `).join("");
}

function renderReviewAreas(categoryScores) {
  const needsReview = categoryScores.filter((category) => category.percent < 100).sort((a, b) => a.percent - b.percent).slice(0, 5);
  if (!needsReview.length) {
    return `
      <ul class="report-list compact">
        <li>No obvious public-facing gaps were surfaced in this pass. A full review can still verify pages, ads, chat, intake, vendors, and monitoring records.</li>
      </ul>
    `;
  }

  return `
    <div class="locked-deltas">
      ${needsReview.map((category, index) => `
        <div class="locked-card ${rowClass(category.percent)}">
          <div>
            <span class="lock-label">Locked delta ${index + 1}</span>
            <strong>${escapeHtml(category.name)}</strong>
            <p>${escapeHtml(categoryPreviewReason(category))}</p>
          </div>
          <span class="lock-chip">Unlock</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderUnlockForm(website, scoreData) {
  return `
    <form class="unlock-form" id="unlockForm" data-website="${escapeHtml(website)}" data-score="${scoreData.score}">
      <div>
        <span class="lock-label">Unlock exact deltas</span>
        <h4>Send the full trigger list</h4>
        <p>Enter a work email and phone to request the page-level reasons, priority fixes, and monitoring package options.</p>
      </div>
      <label>
        <span>Work email</span>
        <input id="unlockEmail" type="email" autocomplete="email" placeholder="name@firm.com" required>
      </label>
      <label>
        <span>Phone</span>
        <input id="unlockPhone" type="tel" autocomplete="tel" placeholder="(555) 555-5555">
      </label>
      <button class="button primary" type="submit">Request unlock</button>
      <p class="form-note unlock-note" id="unlockNote">Exact triggers, affected pages, and fix order stay locked until review.</p>
    </form>
  `;
}

function renderReport({ firmName, website, practice, scoreData }) {
  const tone = scoreTone(scoreData.level);
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
          <p class="form-note">Detected practice: ${escapeHtml(practice)}. Your free preview found locked SB37 deltas that need a closer look.</p>
          <a class="button primary" href="mailto:compliance@sb37coa.com?subject=Unlock%20SB37%20Deltas&body=Please%20send%20pricing%20to%20unlock%20the%20full%20SB37%20delta%20report%20and%20book%20a%20COA%20review.">Unlock deltas</a>
        </div>
      </div>
      <div class="report-stats">
        <div class="report-stat"><strong>${scoreData.pagesScanned}</strong><span>Pages scanned</span></div>
        <div class="report-stat"><strong>${scoreData.filesScanned}</strong><span>Files scanned</span></div>
        <div class="report-stat"><strong>${scoreData.wordsScanned}</strong><span>Words scanned</span></div>
        <div class="report-stat"><strong>${scoreData.triggeredCount}</strong><span>Review flags</span></div>
      </div>
      <section>
        <h4>Preview breakdown</h4>
        <div class="market-board">${renderMarketBoard(scoreData.categoryScores)}</div>
      </section>
      <section>
        <h4>Locked deltas</h4>
        ${renderReviewAreas(scoreData.categoryScores)}
      </section>
      ${renderUnlockForm(website, scoreData)}
      <section>
        <h4>What unlock includes</h4>
        <ul class="report-list">
          <li>The exact deltas behind each locked category.</li>
          <li>Priority fixes for pages, claims, vendors, intake, chat, and referrals.</li>
          <li>A COA review path for monitoring and documentation.</li>
        </ul>
      </section>
      <a class="button primary wide" href="mailto:compliance@sb37coa.com?subject=Unlock%20Full%20SB37%20Deltas&body=Please%20send%20pricing%20for%20the%20full%20delta%20report%20including%20chatbots%2C%20third-party%20vendors%2C%20intake%20scripts%2C%20and%20monitoring.">Unlock all deltas</a>
      <p class="form-note">Educational preliminary screen only. Not legal advice and not a compliance certification.</p>
    </div>
  `;
  animateScoreWheel(scoreData.score);
  wireUnlockForm();
}

function wireUnlockForm() {
  const unlockForm = document.querySelector("#unlockForm");
  if (!unlockForm) return;

  unlockForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.querySelector("#unlockEmail").value.trim();
    const phone = document.querySelector("#unlockPhone").value.trim();
    const website = unlockForm.dataset.website || "";
    const score = unlockForm.dataset.score || "";
    const body = [
      "Please unlock the full SB37 delta report.",
      "",
      `Website: ${website}`,
      `Preview score: ${score}`,
      `Contact email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      "",
      "Please send the exact triggers, affected pages, priority fixes, and package options."
    ].join("\n");
    window.location.href = `mailto:compliance@sb37coa.com?subject=${encodeURIComponent("Unlock SB37 Deltas")}&body=${encodeURIComponent(body)}`;

    const note = document.querySelector("#unlockNote");
    if (note) note.textContent = "Opening your email app with the unlock request. We will use this to route the full review.";
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
  scanStatus.classList.remove("scanning", "warning");
  if (state) scanStatus.classList.add(state);
  scanStatus.innerHTML = `
    <strong>${state === "scanning" ? "Scanning website..." : state === "warning" ? "Scan completed with limited extraction" : "Automatic scan checks every SB37 market"}</strong>
    <span>${escapeHtml(message)}</span>
  `;
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
    submitButton.textContent = "Scanning...";
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
        extractionStatus: "Limited scan: the site blocked or failed public text extraction, so the report used URL-level signals only"
      };
      setScanStatus("warning", "The site blocked public extraction. The report still ran every category using URL-level signals, but a full COA review should inspect the site directly.");
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
      filesScanned: scanData.filesScanned
    });

    renderReport({ firmName, website: scanData.normalizedUrl, practice, scoreData });
    document.querySelector("#assessment").scrollIntoView({ behavior: "smooth", block: "start" });
    submitButton.disabled = false;
    submitButton.textContent = "Run test";
  });
}
