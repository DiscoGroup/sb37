# SB37 Free Lead Capture Setup

This uses Google Sheets + Google Apps Script as a no-cost CRM substitute.

## What It Does

- Receives form submissions from the SB37 site.
- Saves leads to a Google Sheet.
- Sends `info@sb37score.com` a new lead alert.
- Sends the prospect an immediate receipt email with the Calendly link.
- Includes the SB37 Score website link in each email.
- Supports Day 1, Day 3, and Day 7 follow-up emails.
- Skips emails/drips for obvious test leads such as `Test Lead` or `https://example.com`.

## Setup

1. Create a new Google Sheet from the `info@sb37score.com` Google account, or from an account where `info@sb37score.com` is a verified Gmail send-as alias.
2. Name it `SB37 Leads`.
3. In the Sheet, go to `Extensions` > `Apps Script`.
4. Delete the starter code.
5. Paste the contents of `SB37/lead-capture-apps-script.js`.
6. Save the project.
7. Run `setupSb37LeadSheet` once from Apps Script.
8. Approve the requested permissions.
9. Deploy:
   - Click `Deploy` > `New deployment`.
   - Type: `Web app`.
   - Execute as: `Me`.
   - Who has access: `Anyone`.
   - Deploy.
10. Copy the Web App URL.
11. Put that URL into `LEAD_WEBHOOK_URL` in root `script.js`.

## Drip Trigger

To enable Day 1, Day 3, and Day 7 follow-up emails:

1. In Apps Script, open `Triggers`.
2. Add a trigger.
3. Function: `runDailyDrip`.
4. Event source: `Time-driven`.
5. Type: `Day timer`.
6. Choose any time window.

## Notes

- This sends email through GmailApp using `info@sb37score.com` as the configured `from`, `replyTo`, and admin alert recipient. If the script is owned by another Google account, `info@sb37score.com` must be configured and verified in Gmail as a send-as alias for that account before deployment.
- After deploying a new Apps Script version, submit one non-test lead using a controlled recipient and inspect the received headers. The expected result is `From: SB37 COA <info@sb37score.com>`, `Reply-To: info@sb37score.com`, and the admin alert delivered to `info@sb37score.com`.
- Gmail/Apps Script has daily sending quotas. This is fine for early lead volume.
- Do not use this for SMS. Save phone numbers for manual follow-up until you use a compliant SMS platform.
- The site already collects consent metadata and will send it to this webhook.
- To allow test submissions to send emails, set `sendEmailsForTestLeads: true` in the script config.
- Only run `setupSb37LeadSheet` manually from the Apps Script editor. Do not manually run `sendLeadEmail_`, `sendImmediateEmails_`, or `doPost`; those need a lead payload from the website.
- After updates that add new columns, run `setupSb37LeadSheet` once. It adds missing headers without clearing existing lead rows.
