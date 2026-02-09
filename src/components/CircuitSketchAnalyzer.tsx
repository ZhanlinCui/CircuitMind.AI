import React, { useRef, useState } from 'react';
import { callGemini, SKETCH_ANALYSIS_SCHEMA } from '../lib/gemini';
import { loadAiConfig } from '../lib/storage';
import { Camera, Upload, Sparkles, Loader2, X } from 'lucide-react';

export interface SketchAnalysisResult {
  projectName: string;
  description: string;
  requirementsText: string;
  modules: {
    id: string;
    name: string;
    category: string;
  }[];
  connections: {
    fromModuleId: string;
    toModuleId: string;
    type: string;
    label: string;
  }[];
}

interface CircuitSketchAnalyzerProps {
  onAnalysisComplete: (result: SketchAnalysisResult) => void;
}

export default function CircuitSketchAnalyzer({ onAnalysisComplete }: CircuitSketchAnalyzerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ mimeType: string; base64: string } | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      // Extract base64 without prefix
      const base64 = dataUrl.split(',')[1];
      setImageData({ mimeType: file.type, base64 });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleAnalyze = async () => {
    if (!imageData) return;

    const config = loadAiConfig();
    if (!config?.apiKey) {
      setError('Please configure your Gemini API key in Settings first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await callGemini({
        apiKey: config.apiKey,
        model: config.model || 'gemini-3-pro-preview',
        systemPrompt: [
          'You are an expert circuit/PCB design engineer.',
          'Analyze the uploaded circuit sketch/diagram image.',
          'Identify all electronic modules, components, and their connections.',
          'For each module, determine its category: power, mcu, sensor, interface, glue, or other.',
          'Generate a complete project specification from the sketch.',
          'Use unique IDs for each module (e.g., mod_power_1, mod_mcu_1).',
          'Describe connections with their type (power, bus, or io).',
        ].join(' '),
        userPrompt: 'Analyze this circuit sketch and identify all modules, connections, and generate project requirements. Be thorough and specific about component types and signal connections.',
        images: [imageData],
        temperature: 0.1,
        jsonSchema: SKETCH_ANALYSIS_SCHEMA,
      });

      const parsed = JSON.parse(result) as SketchAnalysisResult;
      onAnalysisComplete(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setImageData(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-2">
        <Sparkles className="h-5 w-5 text-indigo-600" />
        <h4 className="font-semibold text-slate-900">AI Sketch Recognition</h4>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Powered by Gemini 3</span>
      </div>

      {!previewUrl ? (
        <div
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-200"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Camera className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-slate-700">Upload a circuit sketch or diagram</p>
              <p className="text-sm text-slate-500 mt-1">
                Hand-drawn sketches, block diagrams, or photos of circuits
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Choose Image</span>
              </button>
              <span className="text-xs text-slate-400">or drag & drop</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            <img
              src={previewUrl}
              alt="Circuit sketch"
              className="w-full max-h-64 object-contain"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-60 flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Gemini 3 is analyzing your sketch...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Analyze with Gemini 3</span>
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  );
}
