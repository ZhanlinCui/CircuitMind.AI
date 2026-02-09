# Devpost Submission — CircuitMind

## Gemini Integration (~200 words)

CircuitMind is an **autonomous circuit design agent**, not a prompt wrapper. Every project runs through a 4-step agentic pipeline orchestrating multiple Gemini 3 API calls:

**Step 1 — Perceive (gemini-3-flash-preview):** Gemini 3 analyzes raw requirements text, extracts key electrical parameters (voltages, protocols, power budgets), identifies ambiguities, and produces an enriched requirement specification. This structured understanding feeds into all downstream steps.

**Step 2 — Generate (gemini-3-flash-preview + JSON Schema):** Using Gemini 3's native structured output with `responseSchema`, the model generates 3 differentiated circuit solutions — each containing L1 architecture graphs with ports/edges, R&D workflow swim-lane diagrams, module dependency lists, BOM cost estimates, milestones, and open engineering questions. JSON Schema enforcement guarantees type-safe output matching our TypeScript interfaces.

**Step 3 — Validate (gemini-3-pro-preview):** Gemini 3 Pro acts as an independent EE quality auditor, reviewing its own generated solutions for voltage mismatches, bus conflicts, missing components, power budget violations, and signal integrity issues. It scores overall confidence 0-100 and flags critical problems.

**Step 4 — Iterate (gemini-3-flash-preview):** If critical issues are found, the pipeline automatically feeds them back for correction — producing a self-healed final output without human intervention.

Additionally, our **multimodal sketch analyzer** uses Gemini 3 Pro Vision to convert hand-drawn circuit photographs into structured digital designs, and our **Smart Generate** feature transforms single-sentence project ideas into complete specifications.

## Links

- **Live Demo:** [Vercel URL]
- **Code Repository:** [GitHub URL]
- **Demo Video:** [YouTube/Loom URL]
