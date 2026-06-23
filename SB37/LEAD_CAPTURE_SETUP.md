# SB37 Free Lead Capture Setup

This uses Google Sheets + Google Apps Script as a no-cost CRM substitute.

## What It Does

- Receives form submissions from the SB37 site.
- Saves leads to a Google Sheet.
- Sends `chaz@vnsfirm.com` a new lead alert.
- Sends the prospect an immediate email with the Calendly link.
- Supports Day 1, Day 3, and Day 7 follow-up emails.

## Setup

1. Create a new Google Sheet from the `chaz@vnsfirm.com` Google account.
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
11. Put that URL into `LEAD_WEBHOOK_URL` in `SB37/script.js`.

## Drip Trigger

To enable Day 1, Day 3, and Day 7 follow-up emails:

1. In Apps Script, open `Triggers`.
2. Add a trigger.
3. Function: `runDailyDrip`.
4. Event source: `Time-driven`.
5. Type: `Day timer`.
6. Choose any time window.

## Notes

- This sends email through the Google account that owns the Apps Script.
- Gmail/Apps Script has daily sending quotas. This is fine for early lead volume.
- Do not use this for SMS. Save phone numbers for manual follow-up until you use a compliant SMS platform.
- The site already collects consent metadata and will send it to this webhook.
