# ClinicalDoc AI — Demo Guide

## Access
Open the app: **https://your-app.vercel.app** *(update this URL after deployment)*

No login required — the app runs in demo mode.

---

## How to Test (30 seconds)

1. Open the app in Chrome or Firefox
2. Click the **"Paste Text"** tab
3. Paste one of the sample transcripts below
4. Click **"Generate SOAP Note"**
5. Wait 5–15 seconds — a loading overlay will appear
6. The right panel populates with:
   - **SOAP Note** — Subjective / Objective / Assessment / Plan with AI confidence scores
   - **ICD-10 Codes** — AI-suggested codes with clinical rationale
   - **Visit Summary** — key findings and follow-up action items
7. All past encounters appear in the **left sidebar** — click any to reload it

---

## Sample Transcripts

Download and paste into the "Paste Text" tab:

| Scenario | Download | What to expect |
|---|---|---|
| Type 2 Diabetes Follow-Up | [demo_diabetes_followup.txt](/samples/demo_diabetes_followup.txt) | HbA1c 9.2%, foot exam, 5+ ICD codes, medication changes, ophthalmology referral |
| Respiratory Infection / Pneumonia | [demo_respiratory_infection.txt](/samples/demo_respiratory_infection.txt) | Crackles on exam, penicillin allergy flagged, doxycycline Rx, 4 ICD codes |
| Hypertension + Palpitations | [demo_hypertension_palpitations.txt](/samples/demo_hypertension_palpitations.txt) | PACs on EKG, drug-induced cause identified, Holter + echo ordered |

---

## Tips

- **Live Record** — click the mic tab and record yourself reading a transcript aloud; audio is transcribed locally via Whisper
- **Upload File** — drag and drop a `.wav`, `.mp3`, or `.m4a` file
- **Edit SOAP sections** inline and hit "Save Draft" or "Finalize Note"
- **Approve / reject ICD codes** individually in the ICD panel

---

## Deployment

See the plan at `.claude/plans/if-i-want-to-typed-brook.md` for Railway + Vercel setup steps.

After Railway is deployed:
1. Update `VITE_API_URL` in `frontend/.env.production` with your Railway URL
2. Update `FRONTEND_ORIGINS` in Railway env vars with your Vercel URL
3. Rebuild and redeploy the frontend on Vercel
4. Replace the placeholder URL at the top of this file
