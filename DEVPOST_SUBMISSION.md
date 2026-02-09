# Devpost Submission — CircuitMind

## Gemini Integration (~200 words)

CircuitMind leverages three core Gemini 3 capabilities to transform circuit design:

**Multimodal Vision (gemini-3-pro-preview):** Users photograph hand-drawn circuit sketches and upload them directly. Gemini 3's vision model analyzes the image to identify electronic components (MCUs, sensors, power regulators, connectors), signal paths, and bus connections. The AI converts analog sketches into structured JSON containing identified modules and their interconnections — enabling a paper-to-digital circuit design workflow in under 30 seconds.

**Structured Output with JSON Schema (gemini-3-flash-preview):** We use Gemini 3's native JSON Schema enforcement (responseMimeType + responseSchema) to guarantee type-safe engineering output. Every AI-generated solution strictly conforms to our ProjectSolution TypeScript interface — including L1 architecture graphs with ports and edges, R&D workflow swim-lane diagrams, module dependency lists, BOM cost estimates, development milestones, and open engineering questions. This eliminates all JSON parsing errors.

**Advanced Reasoning:** Gemini 3 powers real-time circuit validation (voltage mismatch detection, bus compatibility checks, missing pull-up resistor warnings) and generates 3 differentiated solutions per project — varying by cost, component selection, power architecture, and development timeline. The reasoning capability also drives our "Smart Generate" feature where a single sentence like "smart home temperature monitor with WiFi" produces a complete circuit specification.

## Links

- **Live Demo:** [Vercel URL]
- **Code Repository:** [GitHub URL]
- **Demo Video:** [YouTube/Loom URL]
