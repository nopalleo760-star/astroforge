/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, GameState, RocketPart, CelestialBody, Mission } from './types';
import { EARTH, AVAILABLE_PARTS, MISSIONS } from './constants';
import RocketBuilder from './components/RocketBuilder';
import FlightScene from './components/FlightScene';
import { Rocket as RocketIcon, Play, Settings, Info, Target, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [missions, setMissions] = useState<Mission[]>(MISSIONS);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [rocket, setRocket] = useState<Rocket>({
    parts: [AVAILABLE_PARTS[0]], // Start with just a capsule
    position: { x: 0, y: -EARTH.radius },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    angularVelocity: 0,
    fuel: 0,
    isThrusting: false,
  });

  const startFlight = () => {
    // Calculate initial fuel
    const totalFuel = rocket.parts.reduce((sum, p) => sum + (p.fuelCapacity || 0), 0);
    setRocket(prev => ({
      ...prev,
      fuel: totalFuel,
      position: { x: 0, y: -EARTH.radius },
      velocity: { x: 0, y: 0 },
      rotation: 0,
      isThrusting: false,
    }));
    setGameState('flight');
  };

  const completeMission = (id: string) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m));
  };

  return (
    <div className="fixed inset-0 bg-[#050507] text-[#e0e0e6] font-sans overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {gameState === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full space-y-8 p-6 text-center"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-8 md:-inset-12 bg-[#3a86ff]/10 rounded-full blur-3xl"
              />
              <h1 className="text-4xl md:text-6xl font-serif italic tracking-tight text-[#e0e0e6]">
                AstroForge
              </h1>
              <p className="text-[#8e9299] font-mono tracking-[0.2em] uppercase text-[10px] md:text-xs mt-2">
                Simulator Pembinaan Orbit
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:gap-4 w-full max-w-[280px] md:max-w-xs">
              <button
                onClick={() => setGameState('build')}
                className="group relative flex items-center justify-center space-x-3 bg-[#3a86ff] text-white py-3.5 md:py-4 px-6 md:px-8 rounded-sm font-bold text-xs md:text-sm uppercase tracking-[0.2em] transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-[#3a86ff]/20"
              >
                <RocketIcon className="w-4 h-4 md:w-5 md:h-5" />
                <span>Mulakan Pembinaan</span>
              </button>

              <button
                onClick={() => setGameState('missions')}
                className="flex items-center justify-center space-x-3 bg-[#121218] border border-white/10 py-3.5 md:py-4 px-6 md:px-8 rounded-sm font-bold text-xs md:text-sm uppercase tracking-[0.1em] transition-all hover:bg-white/5"
              >
                <Target className="w-4 h-4 md:w-5 md:h-5" />
                <span>Kawalan Misi</span>
              </button>
              
              <button
                className="flex items-center justify-center space-x-3 bg-[#121218] border border-white/10 py-3.5 md:py-4 px-6 md:px-8 rounded-sm font-bold text-xs md:text-sm uppercase tracking-[0.1em] transition-all hover:bg-white/5"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                <span>Konfigurasi Sistem</span>
              </button>
            </div>

            <div className="absolute bottom-8 text-[#8e9299] font-mono text-[10px] uppercase tracking-[0.2em]">
              v2.5.0 // BINAAN STABIL // LESEN KEPADA: JURUTERBANG_BETA_01
            </div>
          </motion.div>
        )}

        {gameState === 'missions' && (
          <motion.div
            key="missions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-full flex flex-col items-center justify-start md:justify-center p-6 md:p-10 bg-[#050507] overflow-y-auto"
          >
            <div className="w-full max-w-4xl space-y-6 md:space-y-8 py-8 md:py-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <h2 className="text-2xl md:text-3xl font-serif italic text-[#e0e0e6]">Kawalan Misi</h2>
                <button 
                  onClick={() => setGameState('menu')}
                  className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-[#8e9299] hover:text-white transition-colors text-left md:text-right"
                >
                  [ Kembali ke Menu ]
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {missions.map(mission => (
                  <div 
                    key={mission.id}
                    className={`bg-[#121218] border ${mission.completed ? 'border-[#3a86ff]/50' : 'border-white/10'} p-6 rounded-sm space-y-4 relative overflow-hidden group`}
                  >
                    {mission.completed && (
                      <div className="absolute top-4 right-4 text-[#3a86ff]">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                    <h3 className="text-lg font-bold uppercase tracking-wider text-[#e0e0e6]">{mission.title}</h3>
                    <p className="text-xs text-[#8e9299] leading-relaxed">{mission.description}</p>
                    <div className="pt-4 border-t border-white/5">
                      <div className="text-[10px] font-mono text-[#3a86ff] uppercase tracking-widest mb-2">Ganjaran</div>
                      <div className="text-xs text-[#e0e0e6]">{mission.reward}</div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveMission(mission);
                        setGameState('build');
                      }}
                      className={`w-full py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${mission.completed ? 'bg-white/5 text-[#8e9299]' : 'bg-[#3a86ff] text-white hover:brightness-110'}`}
                    >
                      {mission.completed ? 'Main Semula Misi' : 'Terima Misi'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'build' && (
          <motion.div
            key="build"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="h-full"
          >
            <RocketBuilder 
              rocket={rocket} 
              setRocket={setRocket} 
              onLaunch={startFlight}
              onBack={() => setGameState('menu')}
            />
          </motion.div>
        )}

        {gameState === 'flight' && (
          <motion.div
            key="flight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <FlightScene 
              rocket={rocket} 
              setRocket={setRocket} 
              onEnd={() => setGameState('build')}
              activeMission={activeMission}
              onMissionComplete={completeMission}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
