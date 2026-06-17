const assessmentForm = document.querySelector("#assessmentForm");
const reportCard = document.querySelector("#reportCard");

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

function getCheckedSignals() {
  return new Set(Array.from(document.querySelectorAll("input[name='signals']:checked")).map((input) => input.value));
}

function scoreCategory(category, signals) {
  const activeFindings = category.findings.filter((finding) => signals.has(finding.id));
  const rawPenalty = activeFindings.reduce((sum, finding) => sum + finding.penalty, 0);
  const cappedPenalty = Math.min(category.weight, rawPenalty);
  const percent = Math.max(0, Math.round(((category.weight - cappedPenalty) / category.weight) * 100));
  return { ...category, activeFindings, rawPenalty, cappedPenalty, percent };
}

function scoreAssessment(signals, url) {
  const categoryScores = categories.map((category) => scoreCategory(category, signals));
  let totalPenalty = categoryScores.reduce((sum, category) => sum + category.cappedPenalty, 0);
  const urlText = url.toLowerCase();
  const inferredFindings = [];

  if (urlText.includes("settlement") || urlText.includes("cash") || urlText.includes("win")) {
    totalPenalty += 5;
    inferredFindings.push("URL language suggests outcome, settlement, cash, or win positioning. Review page copy for guarantees and context.");
  }

  const score = Math.max(0, Math.min(100, 100 - totalPenalty));
  const level = score >= 90 ? "low" : score >= 75 ? "medium" : score >= 60 ? "elevated" : score >= 40 ? "high" : "critical";
  const activeFindings = categoryScores.flatMap((category) =>
    category.activeFindings.map((finding) => `${category.name}: ${finding.label}`)
  );

  const deltas = activeFindings.concat(inferredFindings);
  if (!deltas.length) {
    deltas.push("No high-risk signals selected. Confirm required disclosures, attorney identity, review records, and monitoring cadence before relying on the score.");
  }

  const nextSteps = [
    "Inventory every advertising channel, including website pages, paid ads, landing pages, referral funnels, intake scripts, and chatbots.",
    "Assign California attorney oversight and require approval before vendor-created content goes live.",
    "Archive versions, substantiation files, scripts, chatbot transcripts, and takedown/remediation records.",
    "Run a deeper COA review for chatbots, third-party lead generators, call centers, AI content, and joint advertising partners."
  ];

  return {
    score,
    level,
    categoryScores,
    deltas,
    nextSteps,
    signalsChecked: categories.reduce((sum, category) => sum + category.findings.length, 0),
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
      <div class="market-name">${category.name}</div>
      <div class="market-track" aria-label="${category.name} ${category.percent}%">
        <div class="market-fill" style="--pct: ${category.percent}%"></div>
      </div>
      <div class="market-percent">${category.percent}%</div>
    </div>
  `).join("");
}

function renderReport({ firmName, website, practice, scoreData }) {
  reportCard.innerHTML = `
    <div class="report-result status-${scoreData.level === "low" ? "low" : scoreData.level === "medium" || scoreData.level === "elevated" ? "medium" : "high"}">
      <div class="report-score">
        <div class="score-number">${scoreData.score}</div>
        <div>
          <span class="report-badge">${levelLabel(scoreData.level)}</span>
          <h3>${firmName || "Your firm"} SB37 snapshot</h3>
          <p class="form-note">${website} | ${practice}</p>
        </div>
      </div>
      <div class="report-stats">
        <div class="report-stat"><strong>${scoreData.signalsChecked}</strong><span>Signals screened</span></div>
        <div class="report-stat"><strong>${scoreData.triggeredCount}</strong><span>Potential deltas</span></div>
        <div class="report-stat"><strong>9</strong><span>Risk markets</span></div>
      </div>
      <section>
        <h4>SB37 risk board</h4>
        <div class="market-board">${renderMarketBoard(scoreData.categoryScores)}</div>
      </section>
      <section>
        <h4>Likely deltas</h4>
        <ul class="report-list">
          ${scoreData.deltas.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </section>
      <section>
        <h4>Recommended next steps</h4>
        <ul class="report-list">
          ${scoreData.nextSteps.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </section>
      <a class="button primary wide" href="mailto:compliance@sb37coa.com?subject=Full%20SB37%20COA%20Review&body=Please%20send%20pricing%20for%20a%20full%20COA%20review%20including%20chatbots%2C%20third-party%20vendors%2C%20intake%20scripts%2C%20and%20monitoring.">Request full COA review</a>
      <p class="form-note">Educational preliminary screen only. Not legal advice and not a compliance certification.</p>
    </div>
  `;
}

if (assessmentForm) {
  assessmentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const website = document.querySelector("#website").value.trim();
    const firmName = document.querySelector("#firmName").value.trim();
    const practice = document.querySelector("#practice").value;
    const signals = getCheckedSignals();
    const scoreData = scoreAssessment(signals, website);

    renderReport({ firmName, website, practice, scoreData });
  });
}
