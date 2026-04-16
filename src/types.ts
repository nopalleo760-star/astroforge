export interface Vector2 {
  x: number;
  y: number;
}

export type PartType = 'command' | 'fuel' | 'engine' | 'separator';

export interface RocketPart {
  id: string;
  type: PartType;
  name: string;
  mass: number; // kg
  dryMass: number; // kg (for fuel tanks)
  fuelCapacity?: number; // kg
  thrust?: number; // Newtons
  isp?: number; // Specific impulse (seconds)
  width: number; // meters
  height: number; // meters
  position: Vector2; // relative to rocket center
  color?: string; // Hex color
  decal?: string; // Decal name/id
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  objective: {
    type: 'altitude' | 'orbit' | 'land';
    target: number; // altitude in meters, or celestial body id
  };
  reward: string;
  completed: boolean;
}

export interface Rocket {
  parts: RocketPart[];
  position: Vector2;
  velocity: Vector2;
  rotation: number; // radians
  angularVelocity: number;
  fuel: number; // current total fuel
  isThrusting: boolean;
}

export interface CelestialBody {
  id: string;
  name: string;
  mass: number;
  radius: number;
  position: Vector2;
  color: string;
  atmosphereHeight?: number;
  surfaceGravity: number;
}

export type GameState = 'menu' | 'build' | 'flight' | 'map' | 'missions';

export interface EventChoice {
  label: string;
  description: string;
  impact: {
    fuel?: number; // relative change (e.g., -500)
    velocity?: Vector2; // delta velocity
    damage?: boolean; // if true, maybe some parts fail
    message: string;
    failure?: boolean; // if true, mission fails
  };
}

export interface FlightEvent {
  id: string;
  title: string;
  description: string;
  type: 'malfunction' | 'meteoroid' | 'communication' | 'discovery';
  choices: EventChoice[];
}
