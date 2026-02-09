# CircuitMind — AI-Native Circuit Design Platform

> **Sketch it. Describe it. Build it.**
> The first AI-native circuit design platform powered by Google Gemini 3.

Hardware design has always been the domain of specialized engineers. CircuitMind changes that by leveraging Gemini 3's multimodal reasoning to let anyone — students, makers, entrepreneurs — design professional circuit systems through hand-drawn sketches and natural language descriptions.

---

## The Problem

Designing electronic circuits requires deep knowledge of component selection, power management, bus protocols, and PCB layout. Students and makers face a steep learning curve, and even experienced engineers spend days iterating on system architecture before writing a single line of schematic.

## Our Solution

CircuitMind is a visual, AI-powered circuit design platform that transforms ideas into production-ready hardware solutions in minutes:

1. **Sketch or Describe** — Upload a hand-drawn circuit sketch or type a one-sentence project idea
2. **AI Analyzes** — Gemini 3 identifies components, validates connections, and generates 3 alternative solutions
3. **Review & Build** — Get L1 architecture diagrams, R&D workflows, BOM lists, and development milestones

---

## Gemini 3 Integration — Autonomous Agentic Pipeline

CircuitMind is **not a prompt wrapper**. It orchestrates a **4-step agentic pipeline** with multiple Gemini 3 API calls per project:

### Step 1: Perceive (gemini-3-flash-preview)
Gemini 3 analyzes raw requirements, extracts key electrical parameters (voltages, protocols, power budgets), identifies ambiguities, and produces an enriched requirement specification that feeds all downstream steps.

### Step 2: Generate (gemini-3-flash-preview + JSON Schema)
Using Gemini 3's native `responseSchema` enforcement, the model generates 3 differentiated circuit solutions — each with L1 architecture graphs, R&D workflow swim-lane diagrams, module lists, BOM estimates, milestones, and open questions. JSON Schema guarantees type-safe output.

### Step 3: Validate (gemini-3-pro-preview)
Gemini 3 Pro acts as an **independent EE quality auditor**, reviewing its own generated solutions for voltage mismatches, bus conflicts, missing components, power budget violations, and signal integrity issues. It scores confidence 0-100 and flags critical problems.

### Step 4: Iterate (gemini-3-flash-preview)
If critical issues are found, the pipeline **automatically feeds them back** for correction — producing a self-healed final output without human intervention.

### Additional: Multimodal Sketch Analysis (gemini-3-pro-preview)
Users photograph hand-drawn circuit sketches. Gemini 3 Vision identifies every component, signal path, and bus connection — converting analog sketches into structured digital designs in seconds.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CircuitMind Frontend                  │
│                React 19 + TypeScript + Vite              │
│                                                         │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────┐ │
│  │ Sketch       │  │ Smart       │  │ Agentic        │ │
│  │ Analyzer     │  │ Generator   │  │ Pipeline       │ │
│  │ (Multimodal) │  │ (One-liner) │  │ (4-step agent) │ │
│  └──────┬───────┘  └──────┬──────┘  └───────┬────────┘ │
│         │                 │                  │          │
│         └─────────────────┼──────────────────┘          │
│                           │                             │
│               ┌───────────▼───────────┐                 │
│               │   Gemini 3 API Client │                 │
│               │  (src/lib/gemini.ts)  │                 │
│               └───────────┬───────────┘                 │
└───────────────────────────┼─────────────────────────────┘
                            │
               ┌────────────▼────────────┐
               │   Google Gemini 3 API   │
               │                         │
               │  Step 1: Perceive       │ ← Requirement analysis
               │  Step 2: Generate       │ ← Structured output (JSON Schema)
               │  Step 3: Validate       │ ← AI self-review (gemini-3-pro)
               │  Step 4: Iterate        │ ← Auto-fix critical issues
               │                         │
               │  + Multimodal Vision    │ ← Sketch analysis (gemini-3-pro)
               └─────────────────────────┘
```

---

## Key Features

- **4-Step Agentic Pipeline** — Autonomous design agent: Perceive -> Generate -> Validate -> Iterate (4+ Gemini API calls per project)
- **AI Self-Validation** — Gemini 3 Pro reviews its own output for engineering errors and auto-fixes critical issues
- **AI Sketch Recognition** — Upload a photo of a hand-drawn circuit; Gemini 3 Vision identifies all components and connections
- **Smart Generate** — Describe your project in one sentence; AI generates the complete specification
- **3 Alternative Solutions** — Each project generates 3 differentiated circuit architectures for comparison
- **L1 Architecture Graphs** — Interactive hardware system topology diagrams with ports and signal paths
- **R&D Workflow** — Swim-lane diagrams with hardware/software/test lanes, milestones, and gate reviews
- **Real-time Validation** — Voltage mismatch, bus compatibility, and missing component detection
- **Module Library** — Power, MCU, sensor, interface, and protection module catalog
- **Circuit Case Library** — 8 reference designs (Arduino, STM32, ESP32, automotive, medical, etc.)
- **Component Database** — Searchable catalog with datasheets and pricing
- **Bilingual** — Full English and Chinese (i18n) support

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS 3 + CSS Modules |
| Graph Viz | @xyflow/react (ReactFlow) + dagre |
| AI | Google Gemini 3 API (Pro + Flash) |
| Icons | Lucide React + FontAwesome |
| i18n | react-i18next |
| Routing | React Router v7 |
| Storage | Browser LocalStorage |

---

## Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/circuitmind.git
cd circuitmind

# Install
pnpm install

# Run
pnpm dev
```

Open `http://localhost:5173` and configure your Gemini API key in **Settings > AI Compute Config**.

### Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Copy the key and paste it in CircuitMind settings

---

## Demo Video

[Watch the 3-minute demo on YouTube/Loom](#) *(link to be added)*

---

## Project Structure

```
src/
├── components/          # Shared components
│   ├── AppShell.tsx     # Main layout with sidebar
│   ├── CircuitSketchAnalyzer.tsx  # AI multimodal sketch analysis
│   ├── ArchitectureGraph/  # L0/L1 graph renderers
│   ├── WorkflowGraph/     # Circuit workflow visualizer
│   └── RDWorkflowGraph/   # R&D swim-lane renderer
├── domain/              # Domain models
│   ├── workflow.ts      # Workflow types + validation engine
│   ├── project.ts       # Project + Solution types
│   └── moduleCatalog.ts # Module library
├── lib/                 # Utilities
│   ├── gemini.ts        # Gemini 3 API client + JSON schemas
│   ├── storage.ts       # LocalStorage + AI config
│   └── projectsStore.ts # Project CRUD operations
├── pages/               # Page components
│   ├── LandingPage.tsx  # Marketing landing page
│   ├── p-dashboard/     # Dashboard with dynamic stats
│   ├── p-project_create/ # Project creation + AI features
│   ├── p-project_detail/ # Solution generation + visualization
│   ├── p-circuit_cases/  # Circuit reference library
│   ├── p-component_db/   # Component database
│   └── p-user_profile/   # Settings + Gemini API config
└── locales/             # i18n translations (en/zh)
```

---

## License

MIT

---

*Built with Gemini 3 for the Google DeepMind Hackathon 2026*
