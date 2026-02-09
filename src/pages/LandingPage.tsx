import { useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import {
  CircuitBoard, ArrowRight, Sparkles, Zap, Camera, FileText,
  ChevronRight, Shield, GitBranch, Layers, Play, CheckCircle2, Brain,
  Eye, IterationCcw, Bot,
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-sans text-white overflow-x-hidden">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 w-full bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <CircuitBoard className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">CircuitMind</span>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2 bg-white text-[#0a0a0f] rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Launch App <ArrowRight className="inline h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-40">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[128px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[96px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="container mx-auto px-6 text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 mb-10 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-slate-300">Powered by Google Gemini 3</span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>

          <h1 className="text-5xl lg:text-8xl font-black tracking-tight mb-8 max-w-5xl mx-auto leading-[1.05]">
            <span className="text-white">Design Circuits</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              with AI Agents
            </span>
          </h1>

          <p className="text-lg lg:text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            The first autonomous circuit design agent. Sketch a circuit on paper, describe it in one sentence,
            or let our 4-step AI pipeline generate production-ready hardware solutions — with self-validation
            and auto-correction.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button
              onClick={() => navigate('/project-create')}
              className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-300 flex items-center space-x-3"
            >
              <Play className="h-5 w-5" />
              <span>Try Live Demo</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/circuit-cases')}
              className="px-8 py-4 bg-white/5 text-white rounded-2xl font-semibold text-lg border border-white/10 hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
            >
              <span>View Examples</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Pipeline visualization */}
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                4-STEP AGENTIC PIPELINE
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                <PipelineStep
                  num="01"
                  icon={<Eye className="h-5 w-5" />}
                  title="Perceive"
                  desc="Analyze requirements & extract parameters"
                  gradient="from-blue-500 to-indigo-500"
                />
                <PipelineStep
                  num="02"
                  icon={<Brain className="h-5 w-5" />}
                  title="Generate"
                  desc="Create 3 circuit solutions with JSON Schema"
                  gradient="from-indigo-500 to-purple-500"
                />
                <PipelineStep
                  num="03"
                  icon={<Shield className="h-5 w-5" />}
                  title="Validate"
                  desc="AI self-review for engineering errors"
                  gradient="from-purple-500 to-pink-500"
                />
                <PipelineStep
                  num="04"
                  icon={<IterationCcw className="h-5 w-5" />}
                  title="Iterate"
                  desc="Auto-fix critical issues found"
                  gradient="from-pink-500 to-rose-500"
                />
              </div>
              {/* Connection line */}
              <div className="hidden md:block absolute top-1/2 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-rose-500/30 -translate-y-4" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent" />
        <div className="container mx-auto px-6 relative">
          <div className="text-center mb-20">
            <span className="text-indigo-400 font-semibold text-sm uppercase tracking-widest mb-4 block">Gemini 3 Capabilities</span>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Three AI Superpowers
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Deep integration with Google's most capable model family
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Camera className="h-7 w-7" />}
              badge="Multimodal Vision"
              title="Sketch Recognition"
              desc="Photograph a hand-drawn circuit sketch. Gemini 3 identifies every component, signal path, and bus connection — converting paper designs into structured digital schematics in seconds."
              gradient="from-blue-500 to-indigo-600"
            />
            <FeatureCard
              icon={<FileText className="h-7 w-7" />}
              badge="Structured Output"
              title="Type-Safe Engineering"
              desc="JSON Schema enforcement guarantees every AI output matches our TypeScript interfaces — L1 architecture graphs, R&D workflows, BOM lists, milestones. Zero parsing errors."
              gradient="from-purple-500 to-pink-600"
            />
            <FeatureCard
              icon={<Bot className="h-7 w-7" />}
              badge="Agentic Reasoning"
              title="Self-Validating Agent"
              desc="Not a single prompt — a 4-step autonomous pipeline. The AI generates, reviews its own work for voltage mismatches and bus conflicts, then auto-corrects critical issues."
              gradient="from-cyan-500 to-blue-600"
            />
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-24 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <StatCard value="4+" label="Gemini API Calls Per Project" icon={<Zap className="h-5 w-5 text-amber-400" />} />
            <StatCard value="3" label="Alternative Solutions Generated" icon={<Layers className="h-5 w-5 text-indigo-400" />} />
            <StatCard value="< 60s" label="Sketch to Full Design" icon={<Camera className="h-5 w-5 text-emerald-400" />} />
            <StatCard value="0" label="JSON Parse Errors" icon={<CheckCircle2 className="h-5 w-5 text-cyan-400" />} />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-indigo-400 font-semibold text-sm uppercase tracking-widest mb-4 block">Workflow</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              From Idea to Hardware Design
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Three ways to start. One autonomous agent to finish.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            <WorkflowCard
              num="1"
              title="Sketch It"
              desc="Upload a photo of your hand-drawn circuit diagram. Gemini 3 Vision identifies MCUs, sensors, power regulators, connectors, and all signal paths between them."
              icon={<Camera className="h-6 w-6" />}
              tag="Multimodal"
            />
            <WorkflowCard
              num="2"
              title="Describe It"
              desc='Type a single sentence like "smart home temperature monitor with WiFi and OLED display" — our Smart Generate feature creates the entire project specification instantly.'
              icon={<Sparkles className="h-6 w-6" />}
              tag="Natural Language"
            />
            <WorkflowCard
              num="3"
              title="Build It"
              desc="The agentic pipeline generates 3 differentiated solutions, validates each for engineering correctness, auto-fixes issues, and delivers L1 architecture diagrams, R&D workflows, and BOM lists."
              icon={<GitBranch className="h-6 w-6" />}
              tag="Agentic Pipeline"
            />
          </div>
        </div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Built With</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 max-w-3xl mx-auto">
            {['React 19', 'TypeScript', 'Vite 7', 'Tailwind CSS', 'Gemini 3 API', '@xyflow/react', 'dagre', 'i18next'].map((tech) => (
              <span key={tech} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-32 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/15 rounded-full blur-[128px]" />
        </div>
        <div className="container mx-auto px-6 text-center relative">
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Ready to Design<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Smarter?</span>
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            No login required. No paywall. Start building now.
          </p>
          <button
            onClick={() => navigate('/project-create')}
            className="group px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-300"
          >
            Launch CircuitMind
            <ArrowRight className="inline h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-6 text-center space-y-3">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CircuitBoard className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">CircuitMind</span>
          </div>
          <p className="text-sm text-slate-500">
            Built with Gemini 3 for the Google DeepMind Hackathon 2026
          </p>
          <p className="text-xs text-slate-600">
            React 19 &middot; TypeScript &middot; Vite &middot; Tailwind CSS &middot; @xyflow/react
          </p>
        </div>
      </footer>
    </div>
  );
}

// ===== Sub-components =====

function PipelineStep({ num, icon, title, desc, gradient }: {
  num: string; icon: React.ReactNode; title: string; desc: string; gradient: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center p-4 group">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Step {num}</span>
      <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatureCard({ icon, badge, title, desc, gradient }: {
  icon: React.ReactNode; badge: string; title: string; desc: string; gradient: string;
}) {
  return (
    <div className="group relative bg-white/[0.03] border border-white/10 rounded-3xl p-8 hover:bg-white/[0.06] hover:border-white/15 transition-all duration-500">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{badge}</span>
      <h3 className="text-xl font-bold text-white mt-2 mb-4">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="text-center p-6">
      <div className="flex items-center justify-center mb-3">{icon}</div>
      <div className="text-4xl lg:text-5xl font-black text-white mb-2">{value}</div>
      <div className="text-sm text-slate-500 font-medium">{label}</div>
    </div>
  );
}

function WorkflowCard({ num, title, desc, icon, tag }: {
  num: string; title: string; desc: string; icon: React.ReactNode; tag: string;
}) {
  return (
    <div className="flex items-start space-x-6 bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300">
      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
        {num}
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <span className="text-xs bg-white/10 text-slate-400 px-2.5 py-0.5 rounded-full font-medium">{tag}</span>
        </div>
        <p className="text-slate-400 leading-relaxed">{desc}</p>
      </div>
      <div className="flex-shrink-0 text-slate-600 mt-1">{icon}</div>
    </div>
  );
}
