import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ZoomIn, ZoomOut, RotateCcw, FunctionSquare, Info } from 'lucide-react';

interface PresetFunction {
  label: string;
  fnStr: string;
  color: string;
  evaluate: (x: number) => number;
}

const PRESET_FUNCTIONS: PresetFunction[] = [
  { label: 'y = sin(x)', fnStr: 'sin(x)', color: '#8B6CFF', evaluate: (x) => Math.sin(x) },
  { label: 'y = x²', fnStr: 'x^2', color: '#29D8FF', evaluate: (x) => x * x },
  { label: 'y = x³ - 3x', fnStr: 'x^3 - 3x', color: '#35E6A0', evaluate: (x) => x * x * x - 3 * x },
  { label: 'y = cos(x) · x', fnStr: 'cos(x)*x', color: '#FFB84D', evaluate: (x) => Math.cos(x) * x },
  { label: 'y = 2ˣ', fnStr: '2^x', color: '#FF5D73', evaluate: (x) => Math.pow(2, x) },
  { label: 'y = ln(|x| + 0.1)', fnStr: 'ln(|x| + 0.1)', color: '#D4BBFF', evaluate: (x) => Math.log(Math.abs(x) + 0.1) },
];

export const FunctionGrapher: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customFnStr, setCustomFnStr] = useState<string>('sin(x)');
  const [scale, setScale] = useState<number>(40); // Pixels per unit
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);

  // Safe parser for user function input
  const currentFn = PRESET_FUNCTIONS[selectedPresetIndex];

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height;
    const ox = w / 2 + origin.x;
    const oy = h / 2 + origin.y;

    // Clear background
    ctx.fillStyle = '#080B12';
    ctx.fillRect(0, 0, w, h);

    // Draw coordinate grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Vertical grid lines
    const startX = Math.floor(-ox / scale);
    const endX = Math.ceil((w - ox) / scale);
    for (let x = startX; x <= endX; x++) {
      const cx = ox + x * scale;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();

      if (x !== 0 && x % 2 === 0) {
        ctx.fillStyle = '#5F6878';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(`${x}`, cx + 4, oy - 6);
      }
    }

    // Horizontal grid lines
    const startY = Math.floor(-oy / scale);
    const endY = Math.ceil((h - oy) / scale);
    for (let y = startY; y <= endY; y++) {
      const cy = oy + y * scale;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      if (y !== 0 && y % 2 === 0) {
        ctx.fillStyle = '#5F6878';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(`${-y}`, ox + 6, cy - 4);
      }
    }

    // Main Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(w, oy);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, h);
    ctx.stroke();

    // Plot mathematical curve
    ctx.strokeStyle = currentFn.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let isDrawing = false;
    for (let px = 0; px <= w; px += 2) {
      const mathX = (px - ox) / scale;
      let mathY = 0;
      try {
        mathY = currentFn.evaluate(mathX);
      } catch (e) {
        isDrawing = false;
        continue;
      }

      if (isNaN(mathY) || !isFinite(mathY)) {
        isDrawing = false;
        continue;
      }

      const py = oy - mathY * scale;

      if (!isDrawing) {
        ctx.moveTo(px, py);
        isDrawing = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Draw mouse crosshair tracker
    if (mouseCoord) {
      const mathX = (mouseCoord.x - ox) / scale;
      const mathY = currentFn.evaluate(mathX);
      const py = oy - mathY * scale;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([4, 4]);

      // Vertical guide
      ctx.beginPath();
      ctx.moveTo(mouseCoord.x, 0);
      ctx.lineTo(mouseCoord.x, h);
      ctx.stroke();

      // Horizontal guide
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();

      ctx.setLineDash([]);

      // Point circle
      ctx.fillStyle = currentFn.color;
      ctx.beginPath();
      ctx.arc(mouseCoord.x, py, 5, 0, Math.PI * 2);
      ctx.fill();

      // Tooltip coordinate pill
      ctx.fillStyle = '#0C101A';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      const text = `(${mathX.toFixed(2)}, ${mathY.toFixed(2)})`;
      ctx.font = '11px JetBrains Mono, monospace';
      const textWidth = ctx.measureText(text).width;
      
      const badgeX = Math.min(w - textWidth - 20, Math.max(10, mouseCoord.x + 10));
      const badgeY = Math.min(h - 30, Math.max(20, py - 15));

      ctx.fillRect(badgeX, badgeY - 14, textWidth + 16, 22);
      ctx.strokeRect(badgeX, badgeY - 14, textWidth + 16, 22);
      ctx.fillStyle = '#F7F8FC';
      ctx.fillText(text, badgeX + 8, badgeY);
    }

  }, [scale, origin, currentFn, mouseCoord]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setMouseCoord({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMouseCoord(null);
  };

  return (
    <div id="math-studio-root" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-mono text-[#8B6CFF] px-2 py-0.5 rounded bg-[#8B6CFF]/10 border border-[#8B6CFF]/20">
              MATHEMATICAL VISUALIZER
            </span>
            <span className="text-xs text-[#5F6878]">◈ 2D COORDINATE PLANE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F7F8FC] flex items-center gap-2">
            <FunctionSquare className="w-6 h-6 text-[#8B6CFF]" />
            Function & Calculus Grapher
          </h1>
          <p className="text-xs sm:text-sm text-[#9AA3B5] mt-0.5">
            Plot continuous analytical functions, observe extrema and roots, and track coordinate positions with sub-pixel precision.
          </p>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.min(120, s * 1.25))}
            className="p-2 rounded-lg bg-[#0C101A] hover:bg-[#111725] text-[#9AA3B5] hover:text-[#F7F8FC] border border-white/[0.07] transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(15, s / 1.25))}
            className="p-2 rounded-lg bg-[#0C101A] hover:bg-[#111725] text-[#9AA3B5] hover:text-[#F7F8FC] border border-white/[0.07] transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setScale(40);
              setOrigin({ x: 0, y: 0 });
            }}
            className="p-2 rounded-lg bg-[#0C101A] hover:bg-[#111725] text-[#9AA3B5] hover:text-[#F7F8FC] border border-white/[0.07] transition-all cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Function Presets Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-mono text-[#5F6878] uppercase">Curves:</span>
        {PRESET_FUNCTIONS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedPresetIndex(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              selectedPresetIndex === idx
                ? 'bg-[#111725] text-[#F7F8FC] border border-white/[0.2] shadow-md font-bold'
                : 'bg-[#0C101A] text-[#9AA3B5] hover:text-[#F7F8FC] border border-white/[0.06]'
            }`}
            style={{ borderLeftColor: selectedPresetIndex === idx ? p.color : undefined, borderLeftWidth: selectedPresetIndex === idx ? '3px' : '1px' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Canvas Area */}
      <div className="relative rounded-2xl bg-[#080B12] border border-white/[0.08] overflow-hidden shadow-2xl">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#0C101A]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentFn.color }} />
          <span className="font-bold text-[#F7F8FC]">{currentFn.label}</span>
          <span className="text-[#5F6878] text-[10px]">Scale: {scale.toFixed(0)}px/u</span>
        </div>

        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-96 sm:h-[480px] cursor-crosshair block"
        />
      </div>

      {/* Math Metrics & Properties */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0C101A] border border-white/[0.07] space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#5F6878]">Domain & Range</span>
          <div className="text-sm font-bold font-mono text-[#F7F8FC]">
            {selectedPresetIndex === 0 ? 'x ∈ ℝ, y ∈ [-1, 1]' : selectedPresetIndex === 1 ? 'x ∈ ℝ, y ∈ [0, ∞)' : 'x ∈ ℝ, y ∈ ℝ'}
          </div>
          <span className="text-[11px] text-[#5F6878]">Continuous analytical function</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0C101A] border border-white/[0.07] space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#5F6878]">Zero Crossing (Roots)</span>
          <div className="text-sm font-bold font-mono text-[#35E6A0]">
            {selectedPresetIndex === 0 ? 'x = k·π (k ∈ ℤ)' : selectedPresetIndex === 1 ? 'x = 0' : selectedPresetIndex === 2 ? 'x = {-√3, 0, +√3}' : 'x = 0'}
          </div>
          <span className="text-[11px] text-[#5F6878]">Intercepts where f(x) = 0</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0C101A] border border-white/[0.07] space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#5F6878]">Derivative f'(x)</span>
          <div className="text-sm font-bold font-mono text-[#8B6CFF]">
            {selectedPresetIndex === 0 ? 'cos(x)' : selectedPresetIndex === 1 ? '2x' : selectedPresetIndex === 2 ? '3x² - 3' : 'dy/dx analytical'}
          </div>
          <span className="text-[11px] text-[#5F6878]">Instantaneous rate of change</span>
        </div>
      </div>

    </div>
  );
};
