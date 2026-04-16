import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Rocket, CelestialBody, Vector2, Mission, FlightEvent, EventChoice } from '../types';
import { EARTH, PHYSICS_STEPS_PER_FRAME, TIME_STEP } from '../constants';
import { updatePhysics, getDistance } from '../utils/physics';
import { SpaceSoundManager } from '../utils/sounds';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Map as MapIcon, Gauge, Wind, Zap, Target, CheckCircle2, AlertTriangle, Radio, Shield, Sparkles, ChevronRight } from 'lucide-react';
import { FLIGHT_EVENTS } from '../constants/events';

interface FlightSceneProps {
  rocket: Rocket;
  setRocket: React.Dispatch<React.SetStateAction<Rocket>>;
  onEnd: () => void;
  activeMission?: Mission | null;
  onMissionComplete?: (id: string) => void;
}

export default function FlightScene({ rocket, setRocket, onEnd, activeMission, onMissionComplete }: FlightSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const soundManager = useRef<SpaceSoundManager>(new SpaceSoundManager());
  
  const rocketRef = useRef<Rocket>(rocket);
  const zoomRef = useRef(0.5);
  const cameraPosRef = useRef<Vector2>({ x: 0, y: -EARTH.radius });
  const [isMapMode, setIsMapMode] = useState(false);
  const isMapModeRef = useRef(false);
  const keysPressed = useRef<Set<string>>(new Set());
  const [missionProgress, setMissionProgress] = useState(0);
  const [isMissionSuccess, setIsMissionSuccess] = useState(false);

  // Event State
  const [activeEvent, setActiveEvent] = useState<FlightEvent | null>(null);
  const [eventResult, setEventResult] = useState<string | null>(null);
  const lastEventAltitude = useRef(0);
  const isEventActiveRef = useRef(false);

  // Sync rocket prop to ref if it changes significantly (e.g. reset)
  useEffect(() => {
    const dist = getDistance(rocket.position, rocketRef.current.position);
    if (dist > 100 || rocket.fuel > rocketRef.current.fuel + 10) {
      rocketRef.current = rocket;
      cameraPosRef.current = { ...rocket.position };
    }
  }, [rocket]);

  // Sync isMapMode state to ref for the loop
  useEffect(() => {
    isMapModeRef.current = isMapMode;
  }, [isMapMode]);

  useEffect(() => {
    isEventActiveRef.current = !!activeEvent || !!eventResult;
  }, [activeEvent, eventResult]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.code);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      soundManager.current.stop();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const gameLoop = useCallback(() => {
    if (isEventActiveRef.current) {
      requestRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const currentRocket = rocketRef.current;
    const isThrusting = keysPressed.current.has('Space') || keysPressed.current.has('ArrowUp');
    const rotationInput = (keysPressed.current.has('ArrowLeft') ? -1 : 0) + (keysPressed.current.has('ArrowRight') ? 1 : 0);
    
    // 1. Update Physics
    let updatedRocket = { ...currentRocket };
    updatedRocket.isThrusting = isThrusting;
    updatedRocket.rotation += rotationInput * 0.05;

    for (let i = 0; i < PHYSICS_STEPS_PER_FRAME; i++) {
      updatedRocket = updatePhysics(updatedRocket, [EARTH], TIME_STEP / PHYSICS_STEPS_PER_FRAME);
    }
    rocketRef.current = updatedRocket;

    // 2. Update Camera & Zoom
    const altitude = getDistance(updatedRocket.position, EARTH.position) - EARTH.radius;
    const targetZoom = isMapModeRef.current 
      ? 0.00001 
      : 0.8; // Maintain constant zoom for flight immersion
    
    zoomRef.current += (targetZoom - zoomRef.current) * 0.1;

    const followStrength = altitude < 1000 ? 0.3 : 0.1;
    cameraPosRef.current = {
      x: cameraPosRef.current.x + (updatedRocket.position.x - cameraPosRef.current.x) * followStrength,
      y: cameraPosRef.current.y + (updatedRocket.position.y - cameraPosRef.current.y) * followStrength,
    };

    // 3. Mission Tracking
    if (activeMission && !activeMission.completed && !isMissionSuccess) {
      if (activeMission.objective.type === 'altitude') {
        const progress = Math.min(100, (altitude / activeMission.objective.target) * 100);
        setMissionProgress(progress);
        if (progress >= 100) {
          setIsMissionSuccess(true);
          onMissionComplete?.(activeMission.id);
        }
      } else if (activeMission.objective.type === 'orbit') {
        const velocity = Math.sqrt(updatedRocket.velocity.x ** 2 + updatedRocket.velocity.y ** 2);
        const orbitalVelocity = Math.sqrt(EARTH.mass * 6.67430e-11 / (EARTH.radius + altitude));
        if (altitude > activeMission.objective.target && Math.abs(velocity - orbitalVelocity) < 100) {
          setIsMissionSuccess(true);
          onMissionComplete?.(activeMission.id);
        }
      }
    }

    // 4. Random Events Trigger
    if (altitude > 10000 && Math.abs(altitude - lastEventAltitude.current) > 50000) {
      if (Math.random() < 0.001) { // Low chance per frame
        const randomEvent = FLIGHT_EVENTS[Math.floor(Math.random() * FLIGHT_EVENTS.length)];
        setActiveEvent(randomEvent);
        lastEventAltitude.current = altitude;
      }
    }

    // 5. Update Sounds
    soundManager.current.update(updatedRocket.isThrusting, updatedRocket.fuel, altitude);

    // 6. Render to Canvas
    render(updatedRocket);

    // 7. Sync to React State (for HUD)
    if (Math.random() > 0.8) {
      setRocket(updatedRocket);
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [setRocket, activeMission, onMissionComplete, isMissionSuccess]);

  const handleEventChoice = (choice: EventChoice) => {
    const currentRocket = rocketRef.current;
    let updatedRocket = { ...currentRocket };

    if (choice.impact.fuel) {
      updatedRocket.fuel = Math.max(0, updatedRocket.fuel + choice.impact.fuel);
    }
    if (choice.impact.velocity) {
      updatedRocket.velocity.x += choice.impact.velocity.x;
      updatedRocket.velocity.y += choice.impact.velocity.y;
    }
    if (choice.impact.failure) {
      onEnd(); // Mission failed
      return;
    }

    rocketRef.current = updatedRocket;
    setRocket(updatedRocket);
    setActiveEvent(null);
    setEventResult(choice.impact.message);
  };

  const render = (drawRocket: Rocket) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const zoom = zoomRef.current;
    const cameraPos = cameraPosRef.current;

    let shakeX = 0;
    let shakeY = 0;
    if (drawRocket.isThrusting && drawRocket.fuel > 0) {
      shakeX = (Math.random() - 0.5) * 5;
      shakeY = (Math.random() - 0.5) * 5;
    }

    ctx.save();
    ctx.translate(centerX + shakeX, centerY + shakeY);
    ctx.scale(zoom, zoom);
    ctx.translate(-cameraPos.x, -cameraPos.y);

    // Stars
    ctx.fillStyle = 'white';
    const starSeed = 12345;
    for (let i = 0; i < 200; i++) {
      const x = ((Math.sin(i * starSeed) * 1000000) % width) - width / 2;
      const y = ((Math.cos(i * starSeed) * 1000000) % height) - height / 2;
      const px = x + (cameraPos.x * 0.0001 * (i % 5 + 1));
      const py = y + (cameraPos.y * 0.0001 * (i % 5 + 1));
      ctx.beginPath();
      ctx.arc(cameraPos.x + px / zoom, cameraPos.y + py / zoom, (i % 3 + 1) / zoom, 0, Math.PI * 2);
      ctx.fill();
    }

    // Earth
    const atmosGradient = ctx.createRadialGradient(
      EARTH.position.x, EARTH.position.y, EARTH.radius,
      EARTH.position.x, EARTH.position.y, EARTH.radius + 150000
    );
    atmosGradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    atmosGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
    atmosGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = atmosGradient;
    ctx.beginPath();
    ctx.arc(EARTH.position.x, EARTH.position.y, EARTH.radius + 150000, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(EARTH.position.x, EARTH.position.y, EARTH.radius, 0, Math.PI * 2);
    ctx.fill();

    // Rocket
    ctx.save();
    ctx.translate(drawRocket.position.x, drawRocket.position.y);
    ctx.rotate(drawRocket.rotation);

    drawRocket.parts.forEach(part => {
      const px = (part.position.x - part.width / 2) * 20;
      const py = (part.position.y - part.height / 2) * 20;
      const pw = part.width * 20;
      const ph = part.height * 20;

      ctx.fillStyle = part.color || (part.type === 'command' ? '#d1d1d1' : part.type === 'fuel' ? '#ececec' : '#333');
      
      if (part.type === 'command') {
        ctx.beginPath();
        ctx.moveTo(px + pw * 0.5, py);
        ctx.lineTo(px + pw, py + ph * 0.8);
        ctx.lineTo(px + pw, py + ph);
        ctx.lineTo(px, py + ph);
        ctx.lineTo(px, py + ph * 0.8);
        ctx.closePath();
        ctx.fill();
        
        // Window
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(px + pw * 0.5, py + ph * 0.5, pw * 0.15, 0, Math.PI * 2);
        ctx.fill();
      } else if (part.type === 'fuel') {
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, pw, ph);
      } else if (part.type === 'engine') {
        ctx.beginPath();
        ctx.moveTo(px + pw * 0.2, py);
        ctx.lineTo(px + pw * 0.8, py);
        ctx.lineTo(px + pw, py + ph);
        ctx.lineTo(px, py + ph);
        ctx.closePath();
        ctx.fill();
      }

      // Decal
      if (part.decal && part.decal !== 'None') {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.font = 'bold 4px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(part.decal, px + pw/2, py + ph/2);
      }

      // Engine Flame
      if (part.type === 'engine' && drawRocket.isThrusting && drawRocket.fuel > 0) {
        const thrustScale = 1 + Math.random() * 0.2;
        const flameGlow = ctx.createRadialGradient(px + pw * 0.5, py + ph, 0, px + pw * 0.5, py + ph + ph * 3, ph * 2);
        flameGlow.addColorStop(0, 'rgba(255, 190, 11, 0.8)');
        flameGlow.addColorStop(0.5, 'rgba(255, 0, 110, 0.4)');
        flameGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = flameGlow;
        ctx.beginPath();
        ctx.moveTo(px + pw * 0.1, py + ph);
        ctx.quadraticCurveTo(px + pw * 0.5, py + ph + ph * 5 * thrustScale, px + pw * 0.9, py + ph);
        ctx.fill();
      }
    });
    ctx.restore();
    ctx.restore();
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameLoop]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const altitude = getDistance(rocket.position, EARTH.position) - EARTH.radius;
  const velocity = Math.sqrt(rocket.velocity.x ** 2 + rocket.velocity.y ** 2);
  const fuelPercentage = (rocket.fuel / rocket.parts.reduce((s, p) => s + (p.fuelCapacity || 0), 0)) * 100;

  return (
    <div className="relative h-full w-full bg-[#050507]">
      <canvas ref={canvasRef} className="block" />

      {/* Mission HUD */}
      {activeMission && (
        <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] md:w-full max-w-md pointer-events-none">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#121218]/80 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-sm shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className={`p-1.5 md:p-2 rounded-sm ${isMissionSuccess ? 'bg-[#3a86ff]/20' : 'bg-white/5'}`}>
                {isMissionSuccess ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-[#3a86ff]" /> : <Target className="w-4 h-4 md:w-5 md:h-5 text-[#8e9299]" />}
              </div>
              <div>
                <div className="text-[8px] md:text-[10px] font-mono text-[#8e9299] uppercase tracking-widest mb-0.5 md:mb-1">Misi Aktif</div>
                <div className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#e0e0e6] truncate max-w-[120px] md:max-w-none">{activeMission.title}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-[8px] md:text-[10px] font-mono text-[#8e9299] uppercase tracking-widest mb-0.5 md:mb-1">Objektif</div>
              <div className="text-[10px] md:text-xs font-bold text-[#3a86ff]">
                {activeMission.objective.type === 'altitude' ? `${(activeMission.objective.target/1000).toFixed(0)}KM` : 'ORBIT'}
              </div>
            </div>
          </motion.div>
          
          {!isMissionSuccess && activeMission.objective.type === 'altitude' && (
            <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#3a86ff]"
                animate={{ width: `${missionProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {isMissionSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-[#050507]/60 backdrop-blur-sm z-50 pointer-events-none p-6"
          >
            <div className="bg-[#121218] border border-[#3a86ff] p-6 md:p-10 rounded-sm text-center space-y-4 md:space-y-6 shadow-[0_0_50px_rgba(58,134,255,0.3)] pointer-events-auto w-full max-w-sm">
              <div className="flex justify-center">
                <div className="p-3 md:p-4 bg-[#3a86ff]/20 rounded-full">
                  <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12 text-[#3a86ff]" />
                </div>
              </div>
              <div>
                <h2 className="text-xl md:text-3xl font-serif italic text-[#e0e0e6] mb-1 md:mb-2 text-nowrap">Misi Selesai</h2>
                <p className="text-[#8e9299] text-[10px] md:text-sm uppercase tracking-widest">Objektif Berjaya Dicapai</p>
              </div>
              <button
                onClick={onEnd}
                className="w-full bg-[#3a86ff] text-white py-3 md:py-4 rounded-sm font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs hover:brightness-110 transition-all"
              >
                Kembali ke Pangkalan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD: Top Left - Flight Data */}
      <div className="absolute top-4 md:top-8 left-4 md:left-8 space-y-2 md:space-y-4 pointer-events-none">
        <div className="bg-[#121218]/80 backdrop-blur-xl border border-white/10 p-3 md:p-6 rounded-sm min-w-[200px] md:min-w-[280px] shadow-2xl">
          <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-4">
            <div className="p-1.5 md:p-2 bg-[#3a86ff]/10 rounded-sm">
              <Gauge className="w-4 h-4 md:w-5 md:h-5 text-[#3a86ff]" />
            </div>
            <span className="font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-xs text-[#e0e0e6]">Telemetri</span>
          </div>
          
          <div className="space-y-1.5 md:space-y-4">
            <DataRow label="Ketinggian" value={`${(altitude / 1000).toFixed(2)} KM`} />
            <DataRow label="Kelajuan" value={`${velocity.toFixed(1)} M/S`} />
            <DataRow label="V Menegak" value={`${(-rocket.velocity.y).toFixed(1)} M/S`} />
          </div>
        </div>

        <div className="bg-[#121218]/80 backdrop-blur-xl border border-white/10 p-3 md:p-6 rounded-sm min-w-[200px] md:min-w-[280px] shadow-2xl">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#ffbe0b]" />
              <span className="text-[10px] md:text-xs font-bold uppercase text-[#8e9299] tracking-widest">Bahan Api</span>
            </div>
            <span className="text-xs md:text-sm font-mono text-[#e0e0e6]">{fuelPercentage.toFixed(1)}%</span>
          </div>
          <div className="h-[3px] md:h-[4px] bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${fuelPercentage < 20 ? 'bg-[#ff006e]' : 'bg-[#ffbe0b]'}`}
              animate={{ width: `${fuelPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* HUD: Top Right - Controls Info */}
      <div className="absolute top-4 md:top-8 right-4 md:right-8 flex flex-col items-end space-y-2 md:space-y-3">
        <button 
          onClick={onEnd}
          className="p-3 md:p-4 bg-[#121218]/80 backdrop-blur-xl border border-white/10 rounded-sm hover:bg-white/5 transition-colors text-[#8e9299]"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button 
          onClick={() => {
            setRocket(prev => ({
              ...prev,
              position: { x: 0, y: -EARTH.radius },
              velocity: { x: 0, y: 0 },
              rotation: 0,
              fuel: prev.parts.reduce((s, p) => s + (p.fuelCapacity || 0), 0)
            }));
            setIsMissionSuccess(false);
          }}
          className="p-3 md:p-4 bg-[#121218]/80 backdrop-blur-xl border border-white/10 rounded-sm hover:bg-white/5 transition-colors text-[#8e9299]"
        >
          <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button 
          onClick={() => setIsMapMode(!isMapMode)}
          className={`p-3 md:p-4 backdrop-blur-xl border border-white/10 rounded-sm transition-colors ${isMapMode ? 'bg-[#3a86ff] text-white' : 'bg-[#121218]/80 text-[#8e9299]'}`}
        >
          <MapIcon className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-12 left-0 right-0 px-10 flex justify-between items-end pointer-events-none">
        <div className="flex space-x-6 pointer-events-auto">
          <ControlButton 
            onStart={() => keysPressed.current.add('ArrowLeft')} 
            onEnd={() => keysPressed.current.delete('ArrowLeft')}
            icon={<RotateCcw className="w-7 h-7 -scale-x-100" />}
          />
          <ControlButton 
            onStart={() => keysPressed.current.add('ArrowRight')} 
            onEnd={() => keysPressed.current.delete('ArrowRight')}
            icon={<RotateCcw className="w-7 h-7" />}
          />
        </div>

        <div className="pointer-events-auto">
          <button
            onMouseDown={() => keysPressed.current.add('Space')}
            onMouseUp={() => keysPressed.current.delete('Space')}
            onTouchStart={() => keysPressed.current.add('Space')}
            onTouchEnd={() => keysPressed.current.delete('Space')}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl ${rocket.isThrusting ? 'bg-[#ffbe0b] shadow-[#ffbe0b]/30' : 'bg-[#121218]/90 backdrop-blur-xl border border-white/10'}`}
          >
            <Zap className={`w-10 h-10 ${rocket.isThrusting ? 'text-white' : 'text-[#8e9299]'}`} />
          </button>
        </div>
      </div>

      {/* Atmosphere Indicator */}
      {altitude < 100000 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-[#3a86ff]/10 px-6 py-2 rounded-sm border border-[#3a86ff]/20 backdrop-blur-md">
          <Wind className="w-3 h-3 text-[#3a86ff]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#3a86ff]">Seretan Atmosfera Aktif</span>
        </div>
      )}

      {/* Event Overlays */}
      <AnimatePresence>
        {activeEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#121218] border border-white/10 p-8 rounded-sm max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className={`p-3 rounded-sm ${
                  activeEvent.type === 'malfunction' ? 'bg-[#ff006e]/20 text-[#ff006e]' :
                  activeEvent.type === 'meteoroid' ? 'bg-[#ffbe0b]/20 text-[#ffbe0b]' :
                  activeEvent.type === 'communication' ? 'bg-[#3a86ff]/20 text-[#3a86ff]' :
                  'bg-[#06d6a0]/20 text-[#06d6a0]'
                }`}>
                  {activeEvent.type === 'malfunction' && <AlertTriangle className="w-6 h-6" />}
                  {activeEvent.type === 'meteoroid' && <Shield className="w-6 h-6" />}
                  {activeEvent.type === 'communication' && <Radio className="w-6 h-6" />}
                  {activeEvent.type === 'discovery' && <Sparkles className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#e0e0e6]">{activeEvent.title}</h2>
                  <p className="text-[10px] font-mono text-[#8e9299] uppercase tracking-widest">ACARA {activeEvent.type}</p>
                </div>
              </div>

              <p className="text-sm text-[#8e9299] leading-relaxed mb-8">
                {activeEvent.description}
              </p>

              <div className="space-y-3">
                {activeEvent.choices.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleEventChoice(choice)}
                    className="w-full group flex items-center justify-between p-4 bg-white/5 hover:bg-[#3a86ff] border border-white/10 hover:border-[#3a86ff] rounded-sm transition-all text-left"
                  >
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[#e0e0e6] group-hover:text-white mb-1">{choice.label}</div>
                      <div className="text-[10px] text-[#8e9299] group-hover:text-white/80">{choice.description}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8e9299] group-hover:text-white" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {eventResult && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className="bg-[#121218] border border-[#3a86ff]/30 p-6 rounded-sm shadow-2xl flex flex-col items-center text-center min-w-[300px]">
              <div className="p-3 bg-[#3a86ff]/20 rounded-full mb-4">
                <Radio className="w-6 h-6 text-[#3a86ff]" />
              </div>
              <p className="text-sm text-[#e0e0e6] font-medium mb-6 max-w-xs">{eventResult}</p>
              <button
                onClick={() => setEventResult(null)}
                className="px-8 py-2 bg-[#3a86ff] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#3a86ff]/80 transition-colors"
              >
                Maklum
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DataRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs uppercase font-mono text-[#8e9299] tracking-widest">{label}</span>
      <span className="font-mono text-base text-[#3a86ff]">{value}</span>
    </div>
  );
}

function ControlButton({ onStart, onEnd, icon }: { onStart: () => void, onEnd: () => void, icon: React.ReactNode }) {
  return (
    <button
      onMouseDown={onStart}
      onMouseUp={onEnd}
      onTouchStart={onStart}
      onTouchEnd={onEnd}
      className="w-16 h-16 bg-[#121218]/90 backdrop-blur-xl border border-white/10 rounded-sm flex items-center justify-center active:bg-[#3a86ff] active:text-white text-[#8e9299] transition-colors"
    >
      {icon}
    </button>
  );
}

