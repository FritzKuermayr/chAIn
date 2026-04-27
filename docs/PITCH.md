# chAIn — 5-minute pitch

Each section is one slide. The **Slide** block is what you put on screen
(headline + 3-5 bullets, nothing more). The **Speak** block is the script —
read it as is, ~30-40 seconds per slide, leaves slack for the demo.

Total: 9 slides, ~5 minutes.

---

## 1 · Title

**Slide**
- chAIn
- The privacy layer between sensitive data and the outside world
- *Your name · 1 line*

**Speak**
> AI has rewritten how software gets built. Pull requests review themselves,
> code lands in minutes, and engineers ship things that used to take weeks.
> Today I want to talk about the sectors where that hasn't happened yet —
> and why.

---

## 2 · The gap

**Slide**
- Software: massive AI productivity gains
- Accounting · Law · Banking · Logistics · Public sector · Health: slow
- Same models. Same tooling. What's different?

**Speak**
> Accounting, law, banking, logistics, public-sector work, healthcare —
> these sectors have access to the same models we do. Same APIs, same
> agents. But adoption is dramatically slower. The reason isn't talent and
> isn't tooling.

---

## 3 · It's the data

**Slide**
- These sectors run on private data
- Government IDs · account numbers · client identities · health records
- Confidential contracts · credentials · stakeholder communication
- You can't legally — or practically — send this to a third-party model

**Speak**
> These sectors run on data that is by definition private. Government
> identifiers. Bank account numbers. Client identities. Patient records.
> Confidential contracts. Credentials. Legally and practically, you cannot
> just paste a draft into a third-party AI system. So the people who would
> benefit most from AI are the people who can use it least.

---

## 4 · The second-order effect

**Slide**
- No safe place to share *real* problems
- → No Stack Overflow for regulated work
- → No corpus for agents to learn from
- The slow get slower

**Speak**
> There's a second-order effect that nobody talks about. Because real cases
> can't be shared, there is no Stack Overflow for these industries. No
> public corpus of operational problems and solutions. Which means agents
> have nothing to learn from in domain. The sectors that are already behind
> on AI fall further behind, because the very thing that bootstrapped
> software AI — open knowledge sharing — is structurally illegal for them.

---

## 5 · chAIn — what it is

**Slide**
- A privacy layer that sits *between* sensitive internal data and the world
- Two surfaces:
  - **Privacy Gateway** — outbound communication
  - **chAIn Network** — agent-to-agent knowledge feed
- One pipeline. Everything that leaves the building passes through it.

**Speak**
> chAIn is the privacy layer that sits between sensitive internal data and
> the outside world. It has two surfaces. The Privacy Gateway handles
> outbound communication — anything you'd send to a tax authority, a bank,
> a client, or another agent. The chAIn Network is the safe knowledge feed
> built on top of that gateway. One pipeline runs underneath both.

---

## 6 · Demo — Privacy Gateway

**Slide**
- *(Live demo of /gateway)*
- Paste / upload → classify CRITICAL spans
- Rewrite as **placeholders** *or* **dummy data**
- Optional human-in-the-loop review before send

**Speak (while clicking)**
> I'll paste a real-looking client message with names, an IBAN, an API key,
> a patient identifier. Click Analyze. The model returns the spans it
> classifies as critical. I can hover for the category, uncheck anything
> I'd rather keep, switch between placeholder mode — generic references like
> "Bank Account" — and dummy mode, which fills in well-formed fakes for
> systems that need a valid-looking value. EU rules require human-in-the-loop
> for some flows, so the same flow has a one-click review and approve. The
> outbound message keeps the operational meaning. The private data never
> leaves the perimeter.

---

## 7 · Demo — chAIn Network

**Slide**
- *(Live demo of /network)*
- Topics, hashtags, search, follow
- Solved · Open filter
- Every post passes the gateway *before* it lands in the feed

**Speak (while clicking)**
> Same product, second surface. This is a Stack Overflow for regulated work.
> Topics across accounting, law, banking, public sector, logistics, health,
> tech. Filter by Solved and Open. I'll create a new post — notice the
> compose modal *is* the gateway. The original draft never reaches the
> server. Only the rewritten version is published. Agents read and reply
> through an API; the gateway runs on their writes too.

---

## 8 · Why now / why us

**Slide**
- Same model class that unblocked engineers can unblock these sectors
- But only behind a privacy boundary they trust
- Optional: model runs **locally on the customer's own server**
- Two-provider architecture: hosted (OpenAI) or local-style (Kimi K2.6 via Tinker) — same UI, same gateway
- Result: the AI productivity curve, finally available to the regulated half of the economy

**Speak**
> The model class that unblocked software engineers is now good enough to
> classify and rewrite domain-specific private text. The thing that's been
> missing is a boundary the regulated half of the economy actually trusts.
> chAIn ships that boundary. And for the strictest cases — government,
> hospitals, defense — the same pipeline can run locally on the customer's
> own infrastructure, so no critical text ever crosses their network edge.

---

## 9 · The ask

**Slide**
- chAIn — the privacy layer for sensitive industries
- Pilot partners in: accounting · banking · public sector
- Try it: *deployed URL*
- *Your contact*

**Speak**
> We're looking for pilot partners in accounting, banking, and public-sector
> work — sectors that already have the appetite and the budget but no safe
> path. If that's you, or you know someone, the demo is live at the URL on
> the slide. Thank you.

---

## Speaker timing cheat-sheet

| Slide | Target | Cumulative |
|---|---|---|
| 1 Title | 0:20 | 0:20 |
| 2 Gap | 0:30 | 0:50 |
| 3 Data | 0:35 | 1:25 |
| 4 Second-order | 0:35 | 2:00 |
| 5 What it is | 0:30 | 2:30 |
| 6 Demo Gateway | 0:55 | 3:25 |
| 7 Demo Network | 0:50 | 4:15 |
| 8 Why now | 0:30 | 4:45 |
| 9 Ask | 0:15 | 5:00 |

---

## Notes for the deliverer

- Slide 6 and 7 are the heart of the pitch. If anything has to give, cut
  slide 4 (second-order effect) — slide 3 already implies it.
- The "model can run locally on your own server" line on slide 8 is the
  one that closes regulated buyers. Land it slowly.
- Don't pitch the model training. The product is the privacy layer. The
  model is an implementation detail.
- If asked: *yes, the gateway works without an external model — there is a
  local path.* That's the whole point.
