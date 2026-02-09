<p align="center">
  <img src="https://img.shields.io/badge/Gemini_3-Powered-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini 3" />
  <img src="https://img.shields.io/badge/React_19-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite_7-Fast-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT" />
</p>

<h1 align="center">CircuitMind.AI</h1>

<p align="center">
  <strong>The first autonomous AI circuit design agent — Sketch it. Describe it. Build it.</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="https://circuitmind-ai.vercel.app">Live Demo</a> •
  <a href="#gemini-3-integration">Gemini 3 Integration</a> •
  <a href="#key-features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="./README.zh-CN.md">中文文档</a>
</p>

---

## What is CircuitMind?

**CircuitMind** is an AI-native circuit design platform that transforms hand-drawn sketches and natural language descriptions into production-ready hardware solutions. It leverages Google **Gemini 3**'s multimodal reasoning through a **4-step autonomous agentic pipeline** — not a single-prompt wrapper.

> **Built for the [Google DeepMind Gemini 3 Hackathon 2026](https://gemini3.devpost.com/)**

### The Problem

Designing electronic circuits requires deep expertise in component selection, power management, bus protocols, and PCB layout. Students and makers face a steep learning curve. Even experienced engineers spend days iterating on system architecture.

### Our Solution

CircuitMind lets anyone design circuits in 3 ways:

1. **Sketch it** — Upload a hand-drawn circuit photo; Gemini 3 Vision identifies all components
2. **Describe it** — Type one sentence; AI generates the complete project specification
3. **Build it** — A 4-step agent pipeline produces 3 validated, production-ready solutions

---

## Gemini 3 Integration

CircuitMind orchestrates **4+ Gemini 3 API calls per project** through an autonomous agentic pipeline:

| Step | Model | What It Does |
|------|-------|-------------|
| **1. Perceive** | `gemini-3-flash-preview` | Analyzes requirements, extracts key electrical parameters, identifies ambiguities |
| **2. Generate** | `gemini-3-flash-preview` + JSON Schema | Generates 3 differentiated circuit solutions with enforced type-safe structured output |
| **3. Validate** | `gemini-3-pro-preview` | AI self-reviews solutions for voltage mismatches, bus conflicts, missing components; scores 0-100 |
| **4. Iterate** | `gemini-3-flash-preview` | Auto-fixes critical issues found in validation — self-healing without human intervention |

**Additional capabilities:**
- **Multimodal Sketch Analysis** — Gemini 3 Vision converts hand-drawn circuit photos into structured JSON
- **Smart Generate** — One sentence → complete project specification with modules and connections
- **JSON Schema Enforcement** — `responseMimeType: "application/json"` + `responseSchema` guarantees type-safe output

---

## Key Features

| Feature | Description |
|---------|------------|
| **4-Step Agentic Pipeline** | Perceive → Generate → Validate → Iterate with real-time step progress UI |
| **AI Self-Validation** | Gemini reviews its own output for engineering errors and auto-corrects |
| **Multimodal Sketch Recognition** | Upload a photo of a hand-drawn circuit diagram |
| **Smart Generate** | One-sentence project idea → complete circuit specification |
| **3 Alternative Solutions** | Compare cost, complexity, and performance trade-offs |
| **L1 Architecture Graphs** | Interactive system topology with ports, edges, and signal paths |
| **R&D Workflow** | Swim-lane diagrams: hardware/software/test lanes, milestones, gate reviews |
| **Real-time Validation** | Voltage mismatch, bus compatibility, pull-up resistor detection |
| **Module Library** | Power, MCU, sensor, interface, glue, and protection modules |
| **Circuit Case Library** | 8 reference designs (Arduino, STM32, ESP32, automotive, medical) |
| **Component Database** | Searchable catalog with specs and datasheets |
| **Bilingual UI** | Full English and Chinese (i18n) support |

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│                   CircuitMind Frontend                     │
│               React 19 + TypeScript + Vite 7               │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   Sketch     │  │    Smart     │  │    Agentic      │ │
│  │  Analyzer    │  │  Generator   │  │    Pipeline     │ │
│  │ (Multimodal) │  │ (One-liner)  │  │  (4-step agent) │ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬─────────┘ │
│         │                 │                   │           │
│         └─────────────────┼───────────────────┘           │
│                           │                               │
│              ┌────────────▼────────────┐                  │
│              │   Gemini 3 API Client   │                  │
│              │   (src/lib/gemini.ts)   │                  │
│              └────────────┬────────────┘                  │
└───────────────────────────┼───────────────────────────────┘
                            │
               ┌────────────▼────────────┐
               │   Google Gemini 3 API   │
               │                         │
               │  Step 1: Perceive       │  ← Requirement analysis
               │  Step 2: Generate       │  ← Structured output + JSON Schema
               │  Step 3: Validate       │  ← AI self-review
               │  Step 4: Iterate        │  ← Auto-fix critical issues
               │                         │
               │  + Multimodal Vision    │  ← Sketch-to-design
               └─────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 7 |
| Styling | Tailwind CSS 3 + CSS Modules |
| Graph Visualization | @xyflow/react (ReactFlow) + dagre |
| AI Engine | Google Gemini 3 API (`gemini-3-flash-preview`, `gemini-3-pro-preview`) |
| Icons | Lucide React + FontAwesome 6 |
| Internationalization | react-i18next |
| Routing | React Router v7 |
| Persistence | Browser LocalStorage |
| CI | GitHub Actions (`pnpm lint` + `pnpm build`) |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ZhanlinCui/CircuitMind.AI.git
cd CircuitMind.AI

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open `http://localhost:5173` in your browser.

### Live Test Link

- Public test URL: **https://circuitmind-ai.vercel.app**
- Important: before using AI features, configure your own Google Gemini API key in **Settings → AI Compute Config**.

### Configure Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/) and get your API key
2. In CircuitMind, navigate to **Settings → AI Compute Config**
3. Select **Google Gemini** as provider
4. Paste your API key and click **Test Connection**
5. Start creating projects!

### Build for Production

```bash
pnpm build    # TypeScript check + Vite build
pnpm preview  # Preview production build locally
```

---

## Project Structure

```
src/
├── components/                    # Shared UI components
│   ├── AppShell.tsx               # Main layout (sidebar + header)
│   ├── CircuitSketchAnalyzer.tsx  # Multimodal AI sketch analysis
│   ├── ArchitectureGraph/         # L0/L1 architecture renderers
│   ├── WorkflowGraph/             # Circuit workflow visualizer
│   ├── RDWorkflowGraph/           # R&D swim-lane renderer
│   └── ui/                        # Design system primitives
├── domain/                        # Domain models & business logic
│   ├── workflow.ts                # Workflow types + validation engine
│   ├── project.ts                 # Project + Solution types (L1, R&D, BOM)
│   └── moduleCatalog.ts           # Module library catalog
├── lib/                           # Core utilities
│   ├── gemini.ts                  # Gemini 3 API client + agentic pipeline
│   ├── storage.ts                 # LocalStorage + AI config management
│   └── projectsStore.ts           # Project CRUD operations
├── pages/                         # Route-level page components
│   ├── LandingPage.tsx            # Dark premium landing page
│   ├── p-dashboard/               # Dashboard with AI status + stats
│   ├── p-project_create/          # Smart Generate + Sketch Analyzer
│   ├── p-project_detail/          # Agentic pipeline + solution viewer
│   ├── p-circuit_cases/           # Circuit reference library
│   ├── p-component_db/            # Component database
│   └── p-user_profile/            # Settings + Gemini API config
├── locales/                       # i18n translations
│   ├── en/translation.json        # English (default)
│   └── zh/translation.json        # Chinese
└── router/                        # React Router configuration
```

---

## Demo

> **Live Demo (Testing URL): [https://circuitmind-ai.vercel.app](https://circuitmind-ai.vercel.app)**
>
> **Important:** Configure your own Google API key first in **Settings → AI Compute Config**.
>
> **[Watch the 3-minute demo video](#)** *(link to be added)*

### Quick Demo Steps

1. Open https://circuitmind-ai.vercel.app
2. Go to **Settings → AI Compute Config**, paste your own Google API key, then click **Test Connection**
3. Return to dashboard and click **"Try Live Demo"**
4. You'll see a pre-filled prompt: *"A portable air quality monitor..."*
5. Click **Generate** — watch the 4-step pipeline in action
6. Review 3 generated solutions with L1 architecture and R&D workflow
7. Try **Sketch Recognition**: upload any hand-drawn circuit photo

---

## Judging Criteria Alignment

| Criteria | Weight | How CircuitMind Addresses It |
|----------|--------|------------------------------|
| **Technical Execution** | 40% | 4-step agentic pipeline with 4+ Gemini API calls, JSON Schema structured output, TypeScript strict mode, CI pipeline |
| **Innovation / Wow Factor** | 30% | Self-validating AI agent (not a prompt wrapper), multimodal sketch-to-design, autonomous error correction |
| **Potential Impact** | 20% | Democratizes hardware design for students/makers, reduces circuit design iteration from days to minutes |
| **Presentation / Demo** | 10% | Professional landing page, architecture diagram, bilingual docs, clear 3-minute demo flow |

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[MIT](./LICENSE)

---

<p align="center">
  <strong>Built with Google Gemini 3 for the <a href="https://gemini3.devpost.com/">Google DeepMind Hackathon 2026</a></strong>
</p>
