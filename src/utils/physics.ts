import { Vector2, CelestialBody, Rocket, RocketPart } from '../types';
import { G, TIME_STEP } from '../constants';

export function getDistance(v1: Vector2, v2: Vector2): number {
  const dx = v1.x - v2.x;
  const dy = v1.y - v2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getGravityForce(rocket: Rocket, body: CelestialBody): Vector2 {
  const dist = getDistance(rocket.position, body.position);
  if (dist < body.radius) return { x: 0, y: 0 };

  const totalMass = rocket.parts.reduce((sum, p) => sum + p.mass, 0);
  const forceMag = (G * totalMass * body.mass) / (dist * dist);
  
  const dx = body.position.x - rocket.position.x;
  const dy = body.position.y - rocket.position.y;
  
  return {
    x: (forceMag * dx) / dist,
    y: (forceMag * dy) / dist,
  };
}

export function calculateRocketProperties(rocket: Rocket) {
  let totalMass = 0;
  let thrust = 0;
  let fuelConsumption = 0;
  let centerOfMass = { x: 0, y: 0 };

  rocket.parts.forEach(part => {
    totalMass += part.mass;
    if (part.type === 'engine' && rocket.isThrusting && rocket.fuel > 0) {
      thrust += part.thrust || 0;
      // Fuel consumption = Thrust / (Isp * g0)
      fuelConsumption += (part.thrust || 0) / ((part.isp || 300) * 9.81);
    }
  });

  return { totalMass, thrust, fuelConsumption };
}

export function updatePhysics(rocket: Rocket, bodies: CelestialBody[], dt: number): Rocket {
  const { totalMass, thrust, fuelConsumption } = calculateRocketProperties(rocket);
  
  // Gravity
  let totalForce = { x: 0, y: 0 };
  bodies.forEach(body => {
    const gForce = getGravityForce(rocket, body);
    totalForce.x += gForce.x;
    totalForce.y += gForce.y;
  });

  // Thrust
  if (rocket.isThrusting && rocket.fuel > 0) {
    totalForce.x += Math.sin(rocket.rotation) * thrust;
    totalForce.y -= Math.cos(rocket.rotation) * thrust;
  }

  // Acceleration
  const acc = {
    x: totalForce.x / totalMass,
    y: totalForce.y / totalMass,
  };

  // Update velocity and position
  const newVelocity = {
    x: rocket.velocity.x + acc.x * dt,
    y: rocket.velocity.y + acc.y * dt,
  };

  const newPosition = {
    x: rocket.position.x + newVelocity.x * dt,
    y: rocket.position.y + newVelocity.y * dt,
  };

  // Update fuel
  let newFuel = rocket.fuel;
  let newParts = [...rocket.parts];

  if (rocket.isThrusting && rocket.fuel > 0) {
    newFuel = Math.max(0, rocket.fuel - fuelConsumption * dt);
    
    // Update part masses based on fuel consumption
    const totalFuelCapacity = rocket.parts.reduce((s, p) => s + (p.fuelCapacity || 0), 0) || 1;
    const fuelLost = fuelConsumption * dt;
    
    newParts = rocket.parts.map(part => {
      if (part.type === 'fuel' && part.fuelCapacity) {
        const proportion = part.fuelCapacity / totalFuelCapacity;
        return {
          ...part,
          mass: Math.max(part.dryMass || 0, part.mass - fuelLost * proportion)
        };
      }
      return part;
    });
  }

  // Collision with Earth (simplified)
  const earth = bodies.find(b => b.id === 'earth')!;
  const distToEarth = getDistance(newPosition, earth.position);
  
  if (distToEarth < earth.radius) {
    const normal = {
      x: (newPosition.x - earth.position.x) / distToEarth,
      y: (newPosition.y - earth.position.y) / distToEarth,
    };
    
    return {
      ...rocket,
      parts: newParts,
      position: {
        x: earth.position.x + normal.x * earth.radius,
        y: earth.position.y + normal.y * earth.radius,
      },
      velocity: { x: 0, y: 0 },
      fuel: newFuel,
    };
  }

  return {
    ...rocket,
    parts: newParts,
    position: newPosition,
    velocity: newVelocity,
    fuel: newFuel,
  };
}
