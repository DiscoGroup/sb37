const CONFIG = {
  sheetName: "SB37 Leads",
  alertEmail: "chaz@vnsfirm.com",
  replyToEmail: "chaz@vnsfirm.com",
  senderName: "SB37 COA",
  calendlyUrl: "https://calendly.com/vnsfirm/15min?back=1&month=2026-06",
  sendEmailsForTestLeads: false
};

const HEADERS = [
  "createdAt",
  "name",
  "email",
  "phone",
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
  "day7SentAt"
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
  sheet.clear();
  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
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
  });
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
  const row = HEADERS.map((header) => payload[header] || "");
  row[HEADERS.indexOf("immediateSentAt")] = new Date().toISOString();
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
  MailApp.sendEmail({
    to: CONFIG.alertEmail,
    subject: `New SB37 report lead: ${lead.website || lead.email}`,
    name: CONFIG.senderName,
    replyTo: CONFIG.replyToEmail,
    htmlBody: `
      <p><strong>New SB37 executive preview lead.</strong></p>
      <p>
        Name: ${escapeHtml_(lead.name)}<br>
        Email: ${escapeHtml_(lead.email)}<br>
        Phone: ${escapeHtml_(lead.phone)}<br>
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
      <p><a href="${CONFIG.calendlyUrl}">Calendly link</a></p>
    `
  });
}

function sendLeadEmail_(lead, stage) {
  if (!lead || !lead.email) {
    console.warn(`Skipped ${stage || "unknown"} email because recipient email was blank.`);
    return false;
  }

  const message = emailForStage_(lead, stage);
  MailApp.sendEmail({
    to: lead.email,
    subject: message.subject,
    name: CONFIG.senderName,
    replyTo: CONFIG.replyToEmail,
    htmlBody: message.htmlBody
  });
  return true;
}

function emailForStage_(lead, stage) {
  const name = lead.name ? lead.name.split(" ")[0] : "there";
  const website = lead.website || "your site";
  const score = lead.score || "your preview score";

  const messages = {
    immediate: {
      subject: `Receipt: your SB37 executive preview for ${website}`,
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>This is your receipt confirming that your SB37 executive preview was created for <strong>${escapeHtml_(website)}</strong>. The preview score was <strong>${escapeHtml_(score)}</strong>.</p>
        <p>We saved the information you submitted so we can help you review the scan if you choose to schedule a follow-up.</p>
        <p>The next useful step is a short review of the top findings before changing ads, landing pages, intake scripts, chat, or vendor content.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
        <p>This preview is educational only and is not legal advice or a compliance certification.</p>
      `
    },
    day1: {
      subject: "The first 3 SB37 areas to review",
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>Most law firm marketing reviews start with three practical checks: disclosures near claims, result/award language, and intake or chat language.</p>
        <p>If those areas are clean, the next layer is usually ads, vendor-created landing pages, referral funnels, and monitoring.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
      `
    },
    day3: {
      subject: "Website scan vs. full COA review",
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>The website scan is only a first pass. A full COA review looks at the places public visitors may not see: paid ads, landing pages, intake scripts, chat prompts, CRM messages, vendors, and referral flows.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
      `
    },
    day7: {
      subject: "Do you want a quick SB37 review?",
      htmlBody: `
        <p>Hi ${escapeHtml_(name)},</p>
        <p>If you want to go through the preview findings, we can use a short call to identify what is worth fixing, what is just scan noise, and what should be reviewed more carefully.</p>
        <p><a href="${CONFIG.calendlyUrl}">Schedule a 15-minute review</a></p>
      `
    }
  };

  return messages[stage];
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
