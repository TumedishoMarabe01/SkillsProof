# SkillsProof — BACISS Frontend Demo

React + Vite + Tailwind CSS. This update adds a separated employer recruitment workspace while preserving the learner and assessor interfaces.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173/).

## Selectable demo accounts

| Role | Name | Email | Password |
|---|---|---|---|
| Learner | Lerato Mokoena | lerato@skillsproof.demo | Learner123! |
| Learner | Thabo Dlamini | thabo@skillsproof.demo | Learner123! |
| Learner | Naledi Khumalo | naledi@skillsproof.demo | Learner123! |
| Assessor | Sipho Ndlovu | sipho@skillsproof.demo | Assessor123! |
| Employer | Nomsa Mthembu — Ubuntu Digital Solutions (Pty) Ltd | recruitment@ubuntu-digital.demo | Employer123! |

These are **fictional demonstration identities**, not real accounts. Employer and learner registration forms are previews until a backend is connected. Do not use public demo credentials for production authentication.

## End-to-end employer test

1. Log in as Nomsa (Employer), open **Company Verification**, and choose **Simulate employer verification**. This is **not real company, domain, or identity verification**.
2. Open **My Vacancies**, create a job with title, description, required skills, proficiency, experience, location and work arrangement.
3. Sign out and sign in as a learner. In **Privacy & Discovery**, enable **Show me in employer searches**. Assessment evidence sharing is a separate opt-in.
4. Sign out and return to the employer. Open **Discover Talent**; only opted-in learners will appear. Open a candidate to see limited permitted information and save the profile to the shortlist.
5. Open **Messages**, enter an introduction, and send it to a discoverable learner.
6. Switch to that learner and visit **Employer Messages**. Test **Reply**, **Decline**, **Ignore**, or **Share my email**. Only the last action reveals the email to the employer in the corresponding conversation.
7. Return to the employer, open **Messages**, and inspect message status and any contact details explicitly shared.

The original technical assessment catalogue (SQL, Python, JavaScript, Excel, Power BI), Easy/Intermediate/Advanced selections, voice-only timed interviews, learner progress reset/deletion, assessor SQL/audio review, and decision reasons remain in place.

## Important limitations

This is a **frontend-only prototype**. All account sessions, role controls, vacancies, discovery preferences, conversations, audio, and assessor records live in React memory and **reset on refresh**. Real employer registration, email-domain verification, organisation checks, secure messaging, access control, consent audit trails, protected evidence delivery, SQL grading, speech-to-text, and blockchain credential verification require FastAPI and supporting services. Approval in the demo does not issue a credential.

For realistic candidate matching, the demo only compares the existing learner assessment pathway with vacancy keywords; it does not invent scores or imply candidates are verified without human-approved evidence.
