import React, { useState } from 'react';
import { Rocket, RocketPart, PartType } from '../types';
import { AVAILABLE_PARTS, CUSTOM_COLORS, DECALS } from '../constants';
import { Trash2, Play, ChevronLeft, Plus, Palette, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RocketBuilderProps {
  rocket: Rocket;
  setRocket: React.Dispatch<React.SetStateAction<Rocket>>;
  onLaunch: () => void;
  onBack: () => void;
}

export default function RocketBuilder({ rocket, setRocket, onLaunch, onBack }: RocketBuilderProps) {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'build' | 'parts' | 'custom'>('build');

  const addPart = (partTemplate: RocketPart) => {
    const newPart = { ...partTemplate, id: `${partTemplate.id}-${Date.now()}` };
    
    let newY = 0;
    if (rocket.parts.length > 0) {
      const lastPart = rocket.parts[rocket.parts.length - 1];
      newY = lastPart.position.y + lastPart.height / 2 + newPart.height / 2;
    }

    newPart.position = { x: 0, y: newY };

    setRocket(prev => ({
      ...prev,
      parts: [...prev.parts, newPart]
    }));
    setSelectedPartId(newPart.id);
    if (window.innerWidth < 768) {
      setActiveTab('build');
    }
  };

  const removePart = (id: string) => {
    if (rocket.parts.length <= 1) return;
    setRocket(prev => ({
      ...prev,
      parts: prev.parts.filter(p => p.id !== id)
    }));
    if (selectedPartId === id) setSelectedPartId(null);
  };

  const updatePart = (id: string, updates: Partial<RocketPart>) => {
    setRocket(prev => ({
      ...prev,
      parts: prev.parts.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const selectedPart = rocket.parts.find(p => p.id === selectedPartId);
  const totalMass = rocket.parts.reduce((sum, p) => sum + p.mass, 0);
  const totalThrust = rocket.parts.reduce((sum, p) => sum + (p.thrust || 0), 0);
  const twr = totalThrust / (totalMass * 9.81);

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#050507]">
      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex border-b border-white/10 bg-[#0a0a0c]">
        <button 
          onClick={() => setActiveTab('parts')}
          className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'parts' ? 'text-[#3a86ff] border-[#3a86ff]' : 'text-[#8e9299] border-transparent'}`}
        >
          Komponen
        </button>
        <button 
          onClick={() => setActiveTab('build')}
          className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'build' ? 'text-[#3a86ff] border-[#3a86ff]' : 'text-[#8e9299] border-transparent'}`}
        >
          Binaan
        </button>
        <button 
          onClick={() => {
            if (selectedPartId) setActiveTab('custom');
          }}
          className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${!selectedPartId ? 'opacity-30 cursor-not-allowed' : ''} ${activeTab === 'custom' ? 'text-[#3a86ff] border-[#3a86ff]' : 'text-[#8e9299] border-transparent'}`}
        >
          Ubah Suai
        </button>
      </div>

      {/* Sidebar: Parts Palette */}
      <div className={`${activeTab === 'parts' ? 'flex' : 'hidden'} md:flex w-full md:w-72 bg-[#050507] border-r border-white/10 p-6 flex-col space-y-6 overflow-y-auto h-full`}>
        <div className="flex items-center space-x-2 mb-2">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-sm transition-colors text-[#8e9299]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#e0e0e6]">Perpustakaan Komponen</h2>
        </div>
        {/* ... rest of sidebar content remains the same ... */}

        <div className="space-y-8">
          <div>
            <h3 className="text-[10px] font-mono text-[#8e9299] uppercase tracking-[0.2em] mb-4 pb-2 border-b border-white/5">Kawalan</h3>
            {AVAILABLE_PARTS.filter(p => p.type === 'command').map(part => (
              <PartCard key={part.id} part={part} onAdd={() => addPart(part)} />
            ))}
          </div>
          
          <div>
            <h3 className="text-[10px] font-mono text-[#8e9299] uppercase tracking-[0.2em] mb-4 pb-2 border-b border-white/5">Tangki Bahan Api</h3>
            <div className="space-y-3">
              {AVAILABLE_PARTS.filter(p => p.type === 'fuel').map(part => (
                <PartCard key={part.id} part={part} onAdd={() => addPart(part)} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-mono text-[#8e9299] uppercase tracking-[0.2em] mb-4 pb-2 border-b border-white/5">Enjin</h3>
            {AVAILABLE_PARTS.filter(p => p.type === 'engine').map(part => (
              <PartCard key={part.id} part={part} onAdd={() => addPart(part)} />
            ))}
          </div>
        </div>
      </div>

      {/* Main: Rocket Preview */}
      <div className={`${activeTab === 'build' ? 'flex' : 'hidden'} md:flex flex-1 relative bg-[#050507] flex-col items-center justify-center overflow-hidden blueprint-grid min-h-[400px]`}>
        <div className="relative flex flex-col items-center py-20">
          {rocket.parts.map((part) => (
            <motion.div
              layout
              key={part.id}
              onClick={() => setSelectedPartId(part.id)}
              className={`relative group border rounded-sm transition-all cursor-pointer ${selectedPartId === part.id ? 'border-[#3a86ff] ring-2 ring-[#3a86ff]/20' : 'border-transparent hover:border-[#3a86ff]/50'}`}
              style={{
                width: part.width * 40,
                height: part.height * 40,
                backgroundColor: part.color || (part.type === 'command' ? '#d1d1d1' : part.type === 'fuel' ? '#ececec' : '#333'),
                clipPath: part.type === 'command' ? 'polygon(50% 0%, 100% 60%, 100% 100%, 0% 100%, 0% 60%)' : part.type === 'engine' ? 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' : 'none',
              }}
            >
              {part.decal && part.decal !== 'None' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[6px] font-bold text-black/40 uppercase tracking-tighter rotate-[-45deg]">{part.decal}</span>
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-[#050507]/60 backdrop-blur-sm transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removePart(part.id);
                  }}
                  className="p-1 bg-[#ff006e] text-white rounded-sm hover:brightness-110 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Overlay */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row justify-between items-center md:items-end space-y-4 md:space-y-0">
          <div className="bg-[#121218]/90 backdrop-blur-xl border border-white/10 p-4 md:p-6 rounded-sm space-y-4 w-full md:min-w-[260px] md:w-auto shadow-2xl">
            <h2 className="text-[10px] font-mono text-[#8e9299] uppercase tracking-[0.2em] mb-2 text-center md:text-left">Analisis Telemetri</h2>
            <div className="grid grid-cols-2 md:flex md:flex-col gap-3 md:gap-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-[#8e9299]">Jumlah Jisim</span>
                <span className="font-mono text-xs md:text-sm text-[#3a86ff]">{(totalMass/1000).toFixed(2)} T</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-[#8e9299]">Jumlah Tujahan</span>
                <span className="font-mono text-xs md:text-sm text-[#3a86ff]">{(totalThrust/1000).toFixed(1)} KN</span>
              </div>
              <div className="flex justify-between items-baseline col-span-2 md:col-span-1">
                <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-[#8e9299]">TWR (Bumi)</span>
                <span className={`font-mono text-xs md:text-sm ${twr > 1.1 ? 'text-[#3a86ff]' : 'text-[#ff006e]'}`}>
                  {twr.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="hidden md:block h-[2px] bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#3a86ff]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, twr * 50)}%` }}
              />
            </div>
          </div>

          <button
            onClick={onLaunch}
            disabled={twr < 1}
            className="w-full md:w-auto flex items-center justify-center space-x-3 bg-[#3a86ff] hover:brightness-110 disabled:bg-white/5 disabled:text-[#8e9299] text-white py-4 md:py-5 px-8 md:px-12 rounded-sm font-bold text-xs md:text-sm uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl shadow-[#3a86ff]/20"
          >
            <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            <span>Hidupkan Enjin</span>
          </button>
        </div>
      </div>

      {/* Right Sidebar: Customization */}
      <AnimatePresence>
        {selectedPart && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className={`${activeTab === 'custom' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-[#050507] border-l border-white/10 p-6 flex-col space-y-8 overflow-y-auto h-full absolute md:relative inset-0 z-40`}
          >
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#e0e0e6] mb-1">{selectedPart.name}</h2>
              <p className="text-[10px] font-mono text-[#8e9299] uppercase tracking-widest">ID: {selectedPart.id.split('-')[0]}</p>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Palette className="w-4 h-4 text-[#3a86ff]" />
                  <h3 className="text-[10px] font-mono text-[#e0e0e6] uppercase tracking-[0.2em]">Penampilan</h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {CUSTOM_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => updatePart(selectedPart.id, { color })}
                      className={`w-full aspect-square rounded-sm border-2 transition-all ${selectedPart.color === color ? 'border-[#3a86ff] scale-110' : 'border-transparent hover:border-white/20'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <ImageIcon className="w-4 h-4 text-[#3a86ff]" />
                  <h3 className="text-[10px] font-mono text-[#e0e0e6] uppercase tracking-[0.2em]">Pelekat</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DECALS.map(decal => (
                    <button
                      key={decal}
                      onClick={() => updatePart(selectedPart.id, { decal })}
                      className={`py-2 px-3 text-[9px] font-mono uppercase tracking-widest rounded-sm border transition-all ${selectedPart.decal === decal ? 'bg-[#3a86ff] text-white border-[#3a86ff]' : 'bg-[#121218] text-[#8e9299] border-white/10 hover:bg-white/5'}`}
                    >
                      {decal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="text-[10px] font-mono text-[#8e9299] uppercase tracking-[0.2em]">Spesifikasi</div>
              <div className="space-y-2">
                <SpecRow label="Jisim" value={`${selectedPart.mass} KG`} />
                {selectedPart.thrust && <SpecRow label="Tujahan" value={`${selectedPart.thrust/1000} KN`} />}
                {selectedPart.fuelCapacity && <SpecRow label="Bahan Api" value={`${selectedPart.fuelCapacity} KG`} />}
                <SpecRow label="Dimensi" value={`${selectedPart.width}m x ${selectedPart.height}m`} />
              </div>
            </div>

            <button
              onClick={() => setSelectedPartId(null)}
              className="mt-auto w-full py-3 bg-white/5 hover:bg-white/10 text-[#8e9299] text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors"
            >
              Nyahpilih Komponen
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SpecRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between text-xs md:text-[10px] font-mono">
      <span className="text-[#8e9299] uppercase">{label}</span>
      <span className="text-[#e0e0e6]">{value}</span>
    </div>
  );
}

function PartCard({ part, onAdd }: { part: RocketPart, onAdd: () => void, key?: string }) {
  return (
    <button
      onClick={onAdd}
      className="w-full text-left bg-[#121218] hover:bg-white/5 border border-white/10 p-4 rounded-sm transition-all group"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-xs text-[#e0e0e6] uppercase tracking-wider">{part.name}</span>
        <Plus className="w-5 h-5 text-[#8e9299] group-hover:text-[#3a86ff] transition-colors" />
      </div>
      <div className="flex space-x-4 text-xs md:text-[10px] font-mono text-[#8e9299] uppercase tracking-widest">
        <span>{part.mass} KG</span>
        {part.thrust && <span className="text-[#3a86ff]">{part.thrust/1000} KN</span>}
      </div>
    </button>
  );
}
