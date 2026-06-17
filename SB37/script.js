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
  { id: "missingResponsibleAttorney", type: "missing", pattern: /\b(attorney advertising|responsible attorney|principal attorney|law offices of|law firm|esq\.|attorney at law)\b/gi, evidence: "No obvious responsible attorney or firm identity phrase was detected in the extracted text." },
  { id: "missingOfficeAddress", type: "missing", pattern: /\b(\d{2,6}\s+[a-z0-9.' -]+\s+(street|st\.|avenue|ave\.|boulevard|blvd\.|road|rd\.|drive|dr\.|suite|ste\.|floor|fl\.|california| ca )|state bar)\b/gi, evidence: "No obvious office address or State Bar address signal was detected in the extracted text." },
  { id: "missingAdDisclosure", type: "missing", pattern: /\b(advertisement|attorney advertising|actor portrayal|dramatization|spokesperson|paid spokesperson|results may vary|past results)\b/gi, evidence: "No obvious advertising, dramatization, spokesperson, or results disclaimer language was detected." },
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

async function readWebsiteText(url) {
  const normalized = normalizeWebsite(url);
  const attempts = [
    {
      url: `https://r.jina.ai/http://${normalized}`,
      status: "Extracted homepage text through public reader"
    },
    {
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(normalized)}`,
      status: "Extracted homepage HTML through public CORS reader"
    }
  ];

  for (const attempt of attempts) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      const response = await fetch(attempt.url, { cache: "no-store", signal: controller.signal });
      window.clearTimeout(timeout);
      if (!response.ok) continue;
      const raw = await response.text();
      const text = raw.replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (text && text.length >= 80) {
        return {
          normalizedUrl: normalized,
          sourceText: text.slice(0, 120000),
          extractionStatus: attempt.status
        };
      }
    } catch (error) {
      // Try the next public extraction route before falling back to URL-level signals.
    }
  }

  throw new Error("Website extraction failed");
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

function scoreAssessment({ signals, url, sourceText, evidence, extractionStatus }) {
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
    "Run the full COA review against all public pages, landing pages, paid ads, referral funnels, intake scripts, and chatbots.",
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
    wordsScanned: sourceText.split(/\s+/).filter(Boolean).length,
    signalsChecked: signalRules.length,
    triggeredCount: signals.size + inferredFindings.length
  };
}

function levelLabel(level) {
  return {
    low: "Low Risk",
    medium: "Moderate Risk",
    elevated: "Elevated Risk",
    high: "High Risk",
    critical: "Critical Risk"
  }[level];
}

function rowClass(percent) {
  if (percent >= 80) return "";
  if (percent >= 55) return "watch";
  return "alert";
}

function renderMarketBoard(categoryScores) {
  return categoryScores.map((category) => `
    <div class="market-row ${rowClass(category.percent)}">
      <div class="market-name">${escapeHtml(category.name)}</div>
      <div class="market-track" aria-label="${escapeHtml(category.name)} ${category.percent}%">
        <div class="market-fill" style="--pct: ${category.percent}%"></div>
      </div>
      <div class="market-percent">${category.percent}%</div>
    </div>
  `).join("");
}

function renderEvidence(evidence) {
  const visible = evidence.slice(0, 8);
  if (!visible.length) {
    return '<p class="form-note">No specific homepage evidence snippets were detected by the automatic scan.</p>';
  }
  return `
    <div class="evidence-grid">
      ${visible.map((item) => `
        <div class="evidence-card">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${item.matches.length ? `Detected terms: ${escapeHtml(item.matches.join(", "))}` : "Absence-based signal from extracted homepage text."}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderReport({ firmName, website, practice, scoreData }) {
  reportCard.innerHTML = `
    <div class="report-result status-${scoreData.level === "low" ? "low" : scoreData.level === "medium" || scoreData.level === "elevated" ? "medium" : "high"}">
      <div class="report-score">
        <div class="score-number">${scoreData.score}</div>
        <div>
          <span class="report-badge">${escapeHtml(levelLabel(scoreData.level))}</span>
          <h3>${escapeHtml(firmName || "Detected firm")} SB37 snapshot</h3>
          <p class="form-note">${escapeHtml(website)} | Detected practice: ${escapeHtml(practice)}</p>
          <p class="form-note">${escapeHtml(scoreData.extractionStatus)}</p>
        </div>
      </div>
      <div class="report-stats">
        <div class="report-stat"><strong>${scoreData.signalsChecked}</strong><span>Signals screened</span></div>
        <div class="report-stat"><strong>${scoreData.triggeredCount}</strong><span>Potential deltas</span></div>
        <div class="report-stat"><strong>${scoreData.wordsScanned}</strong><span>Words scanned</span></div>
      </div>
      <section>
        <h4>SB37 risk board</h4>
        <div class="market-board">${renderMarketBoard(scoreData.categoryScores)}</div>
      </section>
      <section>
        <h4>Detected evidence</h4>
        ${renderEvidence(scoreData.evidence)}
      </section>
      <section>
        <h4>Likely deltas</h4>
        <ul class="report-list">
          ${scoreData.deltas.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>
      <section>
        <h4>Recommended next steps</h4>
        <ul class="report-list">
          ${scoreData.nextSteps.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>
      <a class="button primary wide" href="mailto:compliance@sb37coa.com?subject=Full%20SB37%20COA%20Review&body=Please%20send%20pricing%20for%20a%20full%20COA%20review%20including%20chatbots%2C%20third-party%20vendors%2C%20intake%20scripts%2C%20and%20monitoring.">Request full COA review</a>
      <p class="form-note">Educational preliminary screen only. Not legal advice and not a compliance certification.</p>
    </div>
  `;
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
    const firmName = document.querySelector("#firmName").value.trim();
    const normalizedWebsite = normalizeWebsite(rawWebsite);

    submitButton.disabled = true;
    submitButton.textContent = "Scanning...";
    setScanStatus("scanning", "Reading homepage text, inferring practice area, and running all SB37 risk markets.");

    let scanData;
    try {
      scanData = await readWebsiteText(normalizedWebsite);
      setScanStatus("", "Scan complete. The report used extracted homepage text plus URL-level signals.");
    } catch (error) {
      scanData = {
        normalizedUrl: normalizedWebsite,
        sourceText: normalizedWebsite,
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
      extractionStatus: scanData.extractionStatus
    });

    renderReport({ firmName, website: scanData.normalizedUrl, practice, scoreData });
    submitButton.disabled = false;
    submitButton.textContent = "Run test";
  });
}
