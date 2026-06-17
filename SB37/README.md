# SB37 COA Landing Page

Static landing page for an SB37 California lawyer advertising readiness funnel.

## Run Locally

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 4173 --directory SB37
```

Then visit `http://localhost:4173`.

## Internal Score Model

The current front-end model uses the reference campaign strategy's 100-point SB37 structure:

- Required disclosures: `20`
- Case results and success claims: `15`
- Awards and specialization claims: `10`
- AI / synthetic content: `10`
- Chatbot risk: `10`
- Intake and call center risk: `10`
- Vendor-created content: `10`
- Referral and joint advertising: `10`
- Attorney identification and transparency: `5`

Score bands:

- `90-100`: Low Risk
- `75-89`: Moderate Risk
- `60-74`: Elevated Risk
- `40-59`: High Risk
- `<40`: Critical Risk

The report displays a percentage-style risk board for each category. Some signals intentionally affect more than one category because SB37 exposure can stack across AI content, vendor supervision, and attorney transparency.

## Pages

- `index.html`: landing page, automatic website scan form, inferred practice type, free assessment, report preview, package ladder.
- `about.html`: public assessment deltas without internal scoring weights.
- `terms.html`: starter TOS and disclaimer language for counsel review.

## Notes

The free assessment is a front-end demo. It attempts a deep same-domain crawl through public reader endpoints: homepage, structured data, sitemap URLs, internal links, headers/footers, likely legal/contact/about/attorney pages, and common text/PDF-style file URLs. It then infers practice type and runs all SB37 signal categories automatically. The browser version caps crawl size for performance; some sites may block extraction or hide risk in scripts, chatbots, paid ads, third-party vendors, or intake workflows. Production launch should connect the form to a backend crawler/workflow, update the contact email, and have counsel review all legal language.
