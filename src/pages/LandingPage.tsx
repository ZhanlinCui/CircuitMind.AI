import { useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CircuitBoard, ArrowRight, Sparkles, Cpu, Zap, Camera, FileText, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <CircuitBoard className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">CircuitMind</span>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
            >
              Start Building <ArrowRight className="inline h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-44 lg:pb-32 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 text-center relative">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Powered by Google Gemini 3</span>
          </div>

          <h1 className="text-4xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-5xl mx-auto leading-[1.1]">
            Design Circuits with
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> AI Intelligence</span>
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Sketch it. Describe it. Build it. CircuitMind transforms hand-drawn sketches and natural language into professional circuit designs using Gemini 3's multimodal reasoning.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/project-create')}
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all duration-300 flex items-center space-x-2"
            >
              <Sparkles className="h-5 w-5" />
              <span>Try Live Demo</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/circuit-cases')}
              className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold text-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center space-x-2"
            >
              <span>Browse Examples</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* 3-Step Flow */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              step="01"
              icon={<Camera className="h-6 w-6" />}
              title="Sketch or Describe"
              desc="Upload a hand-drawn circuit sketch or describe your idea in plain English"
              color="indigo"
            />
            <StepCard
              step="02"
              icon={<Sparkles className="h-6 w-6" />}
              title="AI Analysis"
              desc="Gemini 3 identifies components, validates connections, and generates solutions"
              color="purple"
            />
            <StepCard
              step="03"
              icon={<CircuitBoard className="h-6 w-6" />}
              title="Build & Iterate"
              desc="Get L1 architecture diagrams, R&D workflows, BOM lists, and milestones"
              color="emerald"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4">
              Three Gemini 3 Superpowers
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Deep integration with Google's most capable AI model family
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Camera className="h-8 w-8 text-indigo-600" />}
              badge="Multimodal"
              title="Sketch Recognition"
              desc="Upload photos of hand-drawn circuits. Gemini 3 Vision identifies every component, connection, and signal path — converting sketches into structured digital designs."
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8 text-purple-600" />}
              badge="Structured Output"
              title="Reliable Engineering Data"
              desc="JSON Schema-enforced output guarantees type-safe circuit architectures, BOM lists, and R&D workflows — no parsing errors, ever."
            />
            <FeatureCard
              icon={<Cpu className="h-8 w-8 text-emerald-600" />}
              badge="Advanced Reasoning"
              title="Design Intelligence"
              desc="Voltage mismatch detection, bus compatibility validation, and automatic 'glue component' recommendations powered by Gemini 3's deep reasoning."
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <StatCard value="3" label="AI-Generated Solutions Per Project" />
            <StatCard value="< 30s" label="From Sketch to Circuit Design" />
            <StatCard value="6+" label="Module Categories Supported" />
            <StatCard value="100%" label="Powered by Gemini 3" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">How CircuitMind Works</h2>
            <p className="text-xl text-slate-600">From idea to production-ready design in minutes</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <WorkflowStep
              num="1"
              title="Input Your Design"
              items={[
                'Upload a hand-drawn circuit sketch (photo or scan)',
                'Or describe your project in one sentence',
                'Or manually pick modules from the component library',
              ]}
            />
            <WorkflowStep
              num="2"
              title="Gemini 3 Generates Solutions"
              items={[
                'AI analyzes requirements and generates 3 alternative circuit solutions',
                'Each solution includes L1 architecture, module list, and cost estimation',
                'Real-time validation catches voltage mismatches and bus conflicts',
              ]}
            />
            <WorkflowStep
              num="3"
              title="Review & Iterate"
              items={[
                'Interactive workflow graph shows system topology',
                'R&D workflow with swim lanes, gates, and milestones',
                'Export project data and start building',
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Design Smarter?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join the future of hardware design. No login required — start building now.
          </p>
          <button
            onClick={() => navigate('/project-create')}
            className="px-10 py-4 bg-white text-indigo-700 rounded-xl font-bold text-lg hover:bg-indigo-50 shadow-xl transition-all duration-300"
          >
            Launch CircuitMind <ArrowRight className="inline h-5 w-5 ml-2" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <CircuitBoard className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">CircuitMind</span>
          </div>
          <p>Built with Gemini 3 for the Google DeepMind Hackathon 2026</p>
          <p>React 19 + TypeScript + Vite + Tailwind CSS + @xyflow/react</p>
        </div>
      </footer>
    </div>
  );
}

// ---- Sub-components ----

function StepCard({ step, icon, title, desc, color }: {
  step: string; icon: React.ReactNode; title: string; desc: string; color: string;
}) {
  const bgMap: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgMap[color]}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step}</span>
      </div>
      <h3 className="font-bold text-lg text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatureCard({ icon, badge, title, desc }: {
  icon: React.ReactNode; badge: string; title: string; desc: string;
}) {
  return (
    <div className="bg-slate-50 rounded-2xl p-8 hover:bg-slate-100 transition-colors group">
      <div className="mb-4">{icon}</div>
      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{badge}</span>
      <h3 className="text-xl font-bold text-slate-900 mt-2 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="p-6">
      <div className="text-4xl lg:text-5xl font-extrabold text-indigo-400 mb-2">{value}</div>
      <div className="text-slate-400 font-medium">{label}</div>
    </div>
  );
}

function WorkflowStep({ num, title, items }: { num: string; title: string; items: string[] }) {
  return (
    <div className="flex space-x-6">
      <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
        {num}
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start space-x-2 text-slate-600">
              <Zap className="h-4 w-4 text-indigo-500 mt-1 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
