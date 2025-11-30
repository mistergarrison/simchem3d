
import { Particle } from '../../types/core';

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

export const createEnergyDissipation = (particles: Particle[], x: number, y: number, z: number, energy: number) => {
    // Normalize energy (max relevant is around 12 MeV in the tool)
    // We want the effect to scale up to this point
    const ratio = Math.min(energy / 12, 1.0);
    
    // Scale parameters based on energy
    const particleCount = 15 + Math.floor(ratio * 50); // 15 to 65 particles
    const baseSpeed = 10 + ratio * 100; // 10 to 110 velocity units
    
    // Color heat map based on intensity
    let color = '#44FFFF'; // Cyan (Low Energy)
    if (ratio > 0.3) color = '#FFFF00'; // Yellow (Mid)
    if (ratio > 0.6) color = '#FF4400'; // Orange-Red (High)
    if (ratio > 0.85) color = '#FFFFFF'; // White Hot (Critical)

    for (let i = 0; i < particleCount; i++) {
        // Random spherical direction
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        // Variance in speed for chaotic look
        const speed = baseSpeed * (0.5 + Math.random() * 1.0);
        
        particles.push({
            id: `dis-${Math.random().toString(36)}`,
            x, y, z,
            vx: Math.sin(phi) * Math.cos(theta) * speed,
            vy: Math.sin(phi) * Math.sin(theta) * speed,
            vz: Math.cos(phi) * speed,
            life: 0.3 + Math.random() * 0.4, // Short life (0.3s - 0.7s) for a "Flash" effect
            maxLife: 0.7,
            color: color,
            size: 2 + Math.random() * 4 * (0.5 + ratio) // Size grows slightly with energy
        });
    }
};
