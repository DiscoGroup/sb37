const CONFIG = {
  sheetName: "SB37 Leads",
  alertEmail: "info@sb37score.com",
  replyToEmail: "info@sb37score.com",
  fromEmail: "info@sb37score.com",
  senderName: "SB37 COA",
  siteUrl: "https://sb37score.com",
  calendlyUrl: "https://calendly.com/vnsfirm/15min?back=1&month=2026-06",
  emailTemplateVersion: "SB37-email-2026-06-25-run-score-link",
  sendEmailsForTestLeads: false
};

const HEADERS = [
  "createdAt",
  "name",
  "email",
  "phone",
  "phoneCountryCode",
  "phoneNational",
  "phoneE164",
  "website",
  "practice",
  "score",
  "status",
  "urlsChecked",
  "pagesScanned",
  "signalsChecked",
  "schedulingUrl",
  "consentGiven",
  "consentText",
  "consentTimestamp",
  "consentSource",
  "immediateSentAt",
  "day1SentAt",
  "day3SentAt",
  "day7SentAt",
  "week2SentAt",
  "week3SentAt",
  "week4SentAt",
  "week5SentAt",
  "week6SentAt"
];

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    validateLead_(payload);
    const sheet = getSheet_();
    appendLead_(sheet, payload);
    if (!isTestLead_(payload) || CONFIG.sendEmailsForTestLeads) {
      sendImmediateEmails_(payload);
    }

    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, error: String(error) });
  }
}

function setupSb37LeadSheet() {
  const sheet = getSheet_();
  ensureHeaders_(sheet);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, sheet.getLastColumn());
}

function ensureHeaders_(sheet) {
  const existingHeaders = sheet.getLastColumn()
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    : [];
  if (!existingHeaders.filter(Boolean).length) {
    sheet.appendRow(HEADERS);
  } else {
    HEADERS.forEach((header) => {
      if (existingHeaders.indexOf(header) === -1) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      }
    });
  }
}

function runDailyDrip() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return;

  const headers = values[0];
  const rows = values.slice(1);
  const now = new Date();

  rows.forEach((row, rowIndex) => {
    const lead = rowToLead_(headers, row);
    if (!lead.email || !lead.createdAt) return;
    if (isTestLead_(lead) && !CONFIG.sendEmailsForTestLeads) return;

    const ageDays = Math.floor((now - new Date(lead.createdAt)) / (24 * 60 * 60 * 1000));
    const sheetRow = rowIndex + 2;

    if (ageDays >= 1 && !lead.day1SentAt) {
      if (sendLeadEmail_(lead, "day1")) {
        sheet.getRange(sheetRow, headers.indexOf("day1SentAt") + 1).setValue(new Date().toISOString());
      }
    }

    if (ageDays >= 3 && !lead.day3SentAt) {
      if (sendLeadEmail_(lead, "day3")) {
        sheet.getRange(sheetRow, headers.indexOf("day3SentAt") + 1).setValue(new Date().toISOString());
      }
    }

    if (ageDays >= 7 && !lead.day7SentAt) {
      if (sendLeadEmail_(lead, "day7")) {
        sheet.getRange(sheetRow, headers.indexOf("day7SentAt") + 1).setValue(new Date().toISOString());
      }
    }

    if (hasMarketingConsent_(lead)) {
      const weeklyStages = [
        { day: 14, stage: "week2", sentAt: "week2SentAt" },
        { day: 21, stage: "week3", sentAt: "week3SentAt" },
        { day: 28, stage: "week4", sentAt: "week4SentAt" },
        { day: 35, stage: "week5", sentAt: "week5SentAt" },
        { day: 42, stage: "week6", sentAt: "week6SentAt" }
      ];
      weeklyStages.forEach((stage) => {
        if (ageDays >= stage.day && !lead[stage.sentAt]) {
          if (sendLeadEmail_(lead, stage.stage)) {
            sheet.getRange(sheetRow, headers.indexOf(stage.sentAt) + 1).setValue(new Date().toISOString());
          }
        }
      });
    }
  });
}

function hasMarketingConsent_(lead) {
  return /^(yes|true|1)$/i.test(String(lead.consentGiven || "").trim());
}

function parsePayload_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
  const payload = JSON.parse(raw);
  payload.createdAt = payload.createdAt || new Date().toISOString();
  payload.schedulingUrl = payload.schedulingUrl || CONFIG.calendlyUrl;
  return payload;
}

function validateLead_(lead) {
  if (!lead.email) {
    throw new Error("Missing required lead email");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(lead.email))) {
    throw new Error("Invalid lead email");
  }
  if (lead.phoneCountryCode !== "+1") {
    throw new Error("Missing required USA +1 phone country code");
  }
  if (!/^\+1\d{10}$/.test(String(lead.phoneE164 || ""))) {
    throw new Error("Invalid USA +1 phone number");
  }
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.sheetName);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendLead_(sheet, payload) {
  ensureHeaders_(sheet);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map((header) => payload[header] || "");
  row[headers.indexOf("immediateSentAt")] = new Date().toISOString();
  sheet.appendRow(row);
}

function rowToLead_(headers, row) {
  return headers.reduce((lead, header, index) => {
    lead[header] = row[index];
    return lead;
  }, {});
}

function sendImmediateEmails_(lead) {
  const prospectEmailSent = sendLeadEmail_(lead, "immediate");
  const adminHtml = `
    <p><strong>New SB37 executive preview lead.</strong></p>
    <p>
      Name: ${escapeHtml_(lead.name)}<br>
      Email: ${escapeHtml_(lead.email)}<br>
      Phone: ${escapeHtml_(lead.phoneE164 || lead.phone)}<br>
      Country code: ${escapeHtml_(lead.phoneCountryCode)}<br>
      Website: ${escapeHtml_(lead.website)}<br>
      Practice: ${escapeHtml_(lead.practice)}<br>
      Score: ${escapeHtml_(lead.score)}<br>
      Status: ${escapeHtml_(lead.status)}
    </p>
    <p>
      Consent: ${escapeHtml_(lead.consentGiven)}<br>
      Consent source: ${escapeHtml_(lead.consentSource)}<br>
      Consent time: ${escapeHtml_(lead.consentTimestamp)}
    </p>
    <p>Prospect receipt email sent: ${escapeHtml_(prospectEmailSent)}</p>
    <p>
      <a href="${CONFIG.calendlyUrl}">Calendly link</a><br>
      <a href="${CONFIG.siteUrl}">Run another free SB37 report</a><br>
      Direct report link: ${CONFIG.siteUrl}
    </p>
    <p style="color:#6b7280;font-size:12px;">Template version: ${CONFIG.emailTemplateVersion}</p>
  `;
  sendSb37Email_(CONFIG.alertEmail, `New SB37 report lead: ${lead.website || lead.email}`, plainTextFromHtml_(adminHtml), adminHtml);
}

function sendLeadEmail_(lead, stage) {
  if (!lead || !lead.email) {
    console.warn(`Skipped ${stage || "unknown"} email because recipient email was blank.`);
    return false;
  }

  const message = emailForStage_(lead, stage);
  sendSb37Email_(lead.email, message.subject, message.textBody, message.htmlBody);
  return true;
}

function sendSb37Email_(to, subject, textBody, htmlBody) {
  const fromEmail = String(CONFIG.fromEmail || "").toLowerCase();
  const effectiveUser = String(Session.getEffectiveUser().getEmail() || "").toLowerCase();
  const aliases = GmailApp.getAliases().map((alias) => String(alias).toLowerCase());
  if (fromEmail && effectiveUser !== fromEmail && aliases.indexOf(fromEmail) === -1) {
    throw new Error(`Configured sender ${CONFIG.fromEmail} is not the executing account or a verified Gmail send-as alias.`);
  }

  const options = {
    name: CONFIG.senderName,
    replyTo: CONFIG.replyToEmail,
    htmlBody
  };
  if (CONFIG.fromEmail) {
    options.from = CONFIG.fromEmail;
  }

  GmailApp.sendEmail(to, subject, textBody, options);
}

function emailForStage_(lead, stage) {
  const name = lead.name ? lead.name.split(" ")[0] : "there";
  const website = lead.website || "your site";
  const score = lead.score || "your preview score";
  const runScoreLink = runScoreLinkHtml_();

  const messages = {
    immediate: {
      subject: `Receipt: your SB37 executive preview for ${website}`,
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>This is your receipt confirming that your SB37 executive preview was created for <strong>${escapeHtml_(website)}</strong>. The preview score was <strong>${escapeHtml_(score)}</strong>.</p>
        <p>We saved the information you submitted so we can help you review the scan if you choose to schedule a follow-up.</p>
        <p>The next useful step is a short review of the top findings before changing ads, landing pages, intake scripts, chat, or vendor content.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
        ${runScoreLink}
        <p>This preview is educational only and is not legal advice or a compliance certification.</p>
        <p style="color:#6b7280;font-size:12px;">Template version: ${CONFIG.emailTemplateVersion}</p>
      `
    },
    day1: {
      subject: "The first 3 SB37 areas to review",
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>Most law firm marketing reviews start with three practical checks: disclosures near claims, result/award language, and intake or chat language.</p>
        <p>If those areas are clean, the next layer is usually ads, vendor-created landing pages, referral funnels, and monitoring.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
        ${runScoreLink}
        <p style="color:#6b7280;font-size:12px;">Template version: ${CONFIG.emailTemplateVersion}</p>
      `
    },
    day3: {
      subject: "Website scan vs. full COA review",
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>The website scan is only a first pass. A full COA review looks at the places public visitors may not see: paid ads, landing pages, intake scripts, chat prompts, CRM messages, vendors, and referral flows.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
        ${runScoreLink}
        <p style="color:#6b7280;font-size:12px;">Template version: ${CONFIG.emailTemplateVersion}</p>
      `
    },
    day7: {
      subject: "Do you want a quick SB37 review?",
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>If you want to go through the preview findings, we can use a short call to identify what is worth fixing, what is just scan noise, and what should be reviewed more carefully.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
        ${runScoreLink}
        <p style="color:#6b7280;font-size:12px;">Template version: ${CONFIG.emailTemplateVersion}</p>
      `
    },
    week2: {
      subject: "A practical next step after your SB37 preview",
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>Your SB37 preview is most useful when it becomes a short list of practical next steps instead of a long list of possible issues.</p>
        <p>We can help you separate the items that need attention from items that need more context before you spend time or money changing them.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
        ${runScoreLink}
        ${weeklyOptOutNoticeHtml_()}
        <p style="color:#6b7280;font-size:12px;">Template version: ${CONFIG.emailTemplateVersion}</p>
      `
    },
    week3: {
      subject: "Where law firm marketing risk often hides",
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>Website copy is only one part of the picture. Intake scripts, chat, paid ads, landing pages, vendor content, and follow-up messages can all need the same level of review.</p>
        <p>A short SB37 review can help you decide where to look first.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
        ${runScoreLink}
        ${weeklyOptOutNoticeHtml_()}
        <p style="color:#6b7280;font-size:12px;">Template version: ${CONFIG.emailTemplateVersion}</p>
      `
    },
    week4: {
      subject: "Turning an SB37 score into a workable plan",
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>A score is a starting point, not a verdict. The useful work is organizing the highest-impact questions, confirming the facts, and assigning a sensible next step.</p>
        <p>If you would like help reading your preview in context, we are available for a brief review.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
        ${runScoreLink}
        ${weeklyOptOutNoticeHtml_()}
        <p style="color:#6b7280;font-size:12px;">Template version: ${CONFIG.emailTemplateVersion}</p>
      `
    },
    week5: {
      subject: "A second look at your SB37 preview",
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>If your team has made changes since the original preview, a second score can help show whether the most visible issues are clearer now.</p>
        <p>Use the scoring page when you are ready, or schedule a short review if you want help prioritizing the next pass.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
        ${runScoreLink}
        ${weeklyOptOutNoticeHtml_()}
        <p style="color:#6b7280;font-size:12px;">Template version: ${CONFIG.emailTemplateVersion}</p>
      `
    },
    week6: {
      subject: "Your SB37 follow-up options",
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>This is the last scheduled follow-up from your SB37 preview. If you would like help sorting the findings, you can schedule a brief review whenever it is useful.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
        ${runScoreLink}
        ${weeklyOptOutNoticeHtml_()}
        <p style="color:#6b7280;font-size:12px;">Template version: ${CONFIG.emailTemplateVersion}</p>
      `
    }
  };

  Object.keys(messages).forEach((key) => {
    messages[key].textBody = plainTextFromHtml_(messages[key].htmlBody);
  });
  return messages[stage];
}

function weeklyOptOutNoticeHtml_() {
  return `<p style="color:#6b7280;font-size:12px;">You are receiving this because you requested an SB37 preview. To stop weekly follow-ups, reply to this email and request removal.</p>`;
}

function runScoreLinkHtml_() {
  return `
    <p><strong>Want to run another score?</strong><br>
    Use the free SB37 scoring page here: <a href="${CONFIG.siteUrl}">${CONFIG.siteUrl}</a></p>
    <p>
      <a href="${CONFIG.siteUrl}" style="background:#078c86;color:#ffffff;padding:10px 14px;text-decoration:none;border-radius:4px;display:inline-block;font-weight:bold;">
        Run another free SB37 report
      </a>
    </p>
  `;
}

function plainTextFromHtml_(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isTestLead_(lead) {
  const source = String(lead.consentSource || "").toLowerCase();
  const name = String(lead.name || "").toLowerCase();
  const website = String(lead.website || "").toLowerCase();
  return Boolean(lead.testMode) ||
    source.indexOf("test") !== -1 ||
    name === "test lead" ||
    website === "https://example.com" ||
    website === "example.com";
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
