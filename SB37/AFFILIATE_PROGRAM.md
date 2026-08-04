# SB37 Affiliate Tracking

This is an owner-managed referral attribution workflow. It records which registered affiliate code sent a completed executive PDF/report request so the owner can review eligibility and calculate payouts manually.

## First Affiliate

- Display name: Dinesh
- Referral code: `SB`
- Canonical link: `https://sb37score.com/?ref=SB`
- Optional vanity link: `https://sb37score.com/questionSB/`

## How Attribution Works

1. A visitor lands on SB37 Score with a registered referral code.
2. The browser stores only referral metadata for up to 90 days: affiliate code, source parameter/path, landing URL, first/last seen timestamps, and a click ID.
3. When the visitor completes the executive PDF/report form, the referral metadata is submitted with the lead payload.
4. Apps Script validates the affiliate code against the owner-maintained `AFFILIATES` registry.
5. Valid attributed submissions are written to the main lead sheet and to the owner-only `SB37 Affiliate Referrals` reporting sheet.

Direct leads still work normally and do not create affiliate reporting rows.

## Owner-Only Reporting

The `SB37 Affiliate Referrals` sheet intentionally excludes lead name, email, and phone. It includes:

- Affiliate display name and code
- Click ID and landing URL
- Lead website, practice, score, and report status
- Payout status, payout amount, payout notes, and payout updated timestamp

Payouts are not automatic. Use `payoutStatus`, `payoutAmount`, `payoutNotes`, and `payoutUpdatedAt` for manual review and settlement tracking.

## Adding Another Affiliate

Add a new entry to `AFFILIATES` in `SB37/lead-capture-apps-script.js`:

```js
const AFFILIATES = {
  sb: {
    displayName: "Dinesh",
    referralCode: "SB",
    status: "active"
  },
  examplecode: {
    displayName: "Example Partner",
    referralCode: "ExampleCode",
    status: "active"
  }
};
```

Accepted codes must be 2-40 characters and may use letters, numbers, underscores, and hyphens. The first character must be a letter or number.

After changing Apps Script:

1. Paste the updated `SB37/lead-capture-apps-script.js` into the Apps Script project.
2. Run `setupSb37LeadSheet` once so the new columns and affiliate reporting sheet exist.
3. Deploy a new web app version.
4. Submit a controlled referral test and verify the affiliate reporting row.
