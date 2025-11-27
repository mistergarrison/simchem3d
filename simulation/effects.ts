
import { Particle } from '../types';

export const createExplosion = (particles: Particle[], x: number, y: number, z: number, color: string, count: number) => {
    // Safety Check for NaN
    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
        console.warn("Attempted to spawn explosion at invalid coordinates:", {x, y, z});
        return;
    }
    
    // "Bigger and Brighter" Multipliers
    const particleCount = count * 4; 
    
    for (let i = 0; i < particleCount; i++) {
      // Spherical Distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // High velocity for "Big" explosion radius
      const speed = Math.random() * 15 + 5;
      
      particles.push({
        id: Math.random().toString(36),
        x,
        y,
        z,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.sin(phi) * Math.sin(theta) * speed,
        vz: Math.cos(phi) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: color,
        // Larger particles for "Bright" appearance
        size: Math.random() * 6 + 3
      });
    }
};
