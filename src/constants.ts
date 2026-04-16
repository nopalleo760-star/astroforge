import { CelestialBody, RocketPart, Mission } from './types';

export const G = 6.67430e-11;
export const PHYSICS_STEPS_PER_FRAME = 5;
export const TIME_STEP = 1 / 60;

export const EARTH: CelestialBody = {
  id: 'earth',
  name: 'Bumi',
  mass: 5.972e24,
  radius: 6371000, // meters
  position: { x: 0, y: 0 },
  color: '#3b82f6',
  atmosphereHeight: 100000,
  surfaceGravity: 9.81,
};

export const MOON: CelestialBody = {
  id: 'moon',
  name: 'Bulan',
  mass: 7.347e22,
  radius: 1737000,
  position: { x: 384400000, y: 0 },
  color: '#9ca3af',
  surfaceGravity: 1.62,
};

export const MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Garisan Karman',
    description: 'Capai ketinggian 100km untuk memasuki angkasa lepas secara rasmi.',
    objective: { type: 'altitude', target: 100000 },
    reward: 'Tangki Bahan Api Termaju',
    completed: false,
  },
  {
    id: 'm2',
    title: 'Orbit Stabil',
    description: 'Capai orbit yang stabil di sekeliling Bumi.',
    objective: { type: 'orbit', target: 200000 },
    reward: 'Enjin Kecekapan Tinggi',
    completed: false,
  },
  {
    id: 'm3',
    title: 'Pendaratan Bulan',
    description: 'Mendarat dengan selamat di permukaan Bulan.',
    objective: { type: 'land', target: 1737000 }, // target is moon radius check
    reward: 'Pod Kawalan Antara Planet',
    completed: false,
  }
];

export const CUSTOM_COLORS = [
  '#ececec', // White
  '#d1d1d1', // Light Gray
  '#94a3b8', // Slate
  '#334155', // Dark Slate
  '#3a86ff', // Blue
  '#ffbe0b', // Yellow
  '#ff006e', // Pink
  '#fb5607', // Orange
];

export const DECALS = [
  'Tiada',
  'Bendera USA',
  'Logo NASA',
  'Logo SpaceX',
  'AstroForge',
  'Jalur Perlumbaan',
  'Tengkorak',
  'Bintang',
];

export const AVAILABLE_PARTS: RocketPart[] = [
  {
    id: 'capsule-1',
    type: 'command',
    name: 'Kapsul Kawalan',
    mass: 1000,
    dryMass: 1000,
    width: 2,
    height: 2,
    position: { x: 0, y: 0 },
    color: '#d1d1d1',
  },
  {
    id: 'fuel-tank-small',
    type: 'fuel',
    name: 'Tangki Bahan Api Kecil',
    mass: 2500, // total mass with fuel
    dryMass: 500,
    fuelCapacity: 2000,
    width: 2,
    height: 3,
    position: { x: 0, y: 0 },
    color: '#ececec',
  },
  {
    id: 'fuel-tank-large',
    type: 'fuel',
    name: 'Tangki Bahan Api Besar',
    mass: 10000,
    dryMass: 1000,
    fuelCapacity: 9000,
    width: 2,
    height: 6,
    position: { x: 0, y: 0 },
    color: '#ececec',
  },
  {
    id: 'engine-1',
    type: 'engine',
    name: 'Enjin Reliant',
    mass: 500,
    dryMass: 500,
    thrust: 250000, // 250kN
    isp: 300,
    width: 2,
    height: 1.5,
    position: { x: 0, y: 0 },
    color: '#333333',
  },
];
