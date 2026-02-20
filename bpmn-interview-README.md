# BPMN Interview Agent

> Record a process interview → get a live BPMN 2.0 diagram

A browser-based tool that records process interviews with Subject Matter Experts and translates the transcript into a valid BPMN 2.0 diagram in real time. Zero dependencies, no build step — one HTML file.

## Features

- **🎤 Live Speech-to-BPMN** — Record interviews using browser speech recognition (Web Speech API)
- **📖 200+ Role Catalog** — Matches roles from a comprehensive Job Catalog spanning 7 departments and 16 functional areas
- **⬡ Live BPMN Rendering** — Powered by [bpmn-js](https://github.com/bpmn-io/bpmn-js) (bpmn.io)
- **🔍 NLP Extraction Engine** — Detects roles (swimlanes), activities (tasks), decisions (gateways), and process variants
- **✅ BPMN Skill Compliant** — Follows the [BPMN 2.0 Modeling Skill](./SKILL.md) for naming, gateway semantics, and anti-pattern avoidance
- **📥 Export** — Download valid `.bpmn` XML compatible with Camunda, Signavio, Bizagi, etc.

## BPMN Skill Compliance

The diagram generator follows [SKILL.md](./SKILL.md) rules:

| Rule | Skill ref | Implementation |
|------|-----------|---------------|
| Start Events named with trigger | §1.1 / AP#17 | Extracted from first sentence via `extractTriggerName()` |
| End Events named with outcome | §1.1 / AP#17 | Extracted from last sentence via `extractOutcomeName()` |
| Tasks use verb + object naming | §1.2 / AP#3 | NLP enforces `capFirst(verb) + object` pattern |
| XOR gateways labeled as questions | §1.3 R4 / AP#5 | `toGatewayQuestion()` appends `?` |
| XOR outgoing flows labeled | §1.3 R4 / AP#6 | "Yes"/"No" labels on conditional/default flows |
| Split gateways have matching joins | §1.3 R1 / AP#7 | Auto-inserted join gateway after each split+branch |
| XOR has a default flow | §1.3 R4 / AP#11 | "No" label on direct split→join path |
| Lanes named after roles | §2.1 / §4 | Matched from Job Catalog |
| Pool named after participant | §2.2 / AP#15 | Uses "Organization" not "Process" |
| Elements have incoming/outgoing refs | §7.1 | `<bpmn:incoming>` / `<bpmn:outgoing>` on every element |
| Cross-lane flows routed cleanly | §5.1 | L-shaped waypoints with midpoints |
| Namespaces correct | §7.4 | All four required BPMN 2.0 namespaces |

## Quick Start

### Open directly (no build required)

```bash
open index.html
```

### Via any static server

```bash
python3 -m http.server 8080
# or
npx serve .
```

### Deployment

Single `index.html` — deploy to any static host:
- **Antigravity** — push this repo
- **GitHub Pages** — enable in repo settings
- **Vercel / Netlify / Cloudflare Pages** — connect repo, zero config

## How It Works

1. **Type or dictate** a process description in the left panel
2. The **NLP parser** extracts:
   - **Roles** → matched against 200+ job archetypes → swimlanes
   - **Activities** → verb + noun patterns → BPMN tasks
   - **Gateways** → "if/when/unless" conditional language → XOR gateways with matching joins
   - **Variants** → thresholds, geographic conditions → gateway conditions
3. The **BPMN generator** produces valid XML with DI layout per [SKILL.md](./SKILL.md) rules
4. **bpmn-js** renders the diagram live

## Job Catalog

| Department | Example Roles |
|-----------|---------------|
| Technology & Engineering | Frontend Engineer, Data Scientist, DevOps Engineer, SRE, Product Manager |
| Marketing & Growth | Brand Manager, SEO Specialist, Social Media Manager |
| Sales & Revenue | Account Executive, CSM, Pre-Sales Engineer |
| Operations & Supply Chain | Procurement Manager, Warehouse Manager, QC Inspector |
| Finance & Legal | Corporate Controller, Compliance Officer, Financial Analyst |
| People & Admin | HR Business Partner, Technical Recruiter, Executive Assistant |

Abbreviations recognized: SRE, DBA, CSM, BDR, SDR, TAM, DPO, HRBP, and more.

## Tech Stack

- **bpmn-js** v17 — BPMN 2.0 rendering ([bpmn.io](https://bpmn.io))
- **Web Speech API** — Browser-native speech recognition
- **Vanilla JS** — Zero dependencies, no build step
- **Single HTML file** — Everything inlined

## License

MIT
