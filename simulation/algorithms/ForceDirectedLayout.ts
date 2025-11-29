
import { ELEMENTS } from '../../elements';

interface LayoutNode {
    x: number;
    y: number;
    z: number;
    r: number;
    id: number;
    zNum: number; // Store atomic number for radius lookup
}

interface Vector3 {
    x: number;
    y: number;
    z: number;
}

/**
 * A specialized mini-physics engine used to calculate the ideal
 * geometric arrangement of atoms in a molecule before spawning them.
 * 
 * UPGRADE: Now uses physics-accurate bond lengths to minimize "wobble"
 * when handing off to the main simulation.
 */
export class ForceDirectedLayout {
    private nodes: LayoutNode[];
    private velocities: Vector3[];
    private bonds: [number, number, number][]; 
    private nodeCount: number;

    constructor(atomZs: number[], bonds: [number, number, number][]) {
        this.nodeCount = atomZs.length;
        
        // Filter invalid bonds
        this.bonds = bonds.filter((b, i) => {
            const valid = b[0] < this.nodeCount && b[1] < this.nodeCount;
            if (!valid) console.warn(`[Layout] Invalid bond index ${i}: ${b}`);
            return valid;
        });

        this.nodes = this.initializePositions(atomZs);
        this.velocities = Array(this.nodeCount).fill(null).map(() => ({x:0, y:0, z:0}));
    }

    private initializePositions(atomZs: number[]): LayoutNode[] {
        // Fibonacci Sphere Distribution
        // Guaranteed non-overlapping start
        const scale = 90.0; // Increased scale to prevent initial crumpling
        const offset = 2 / this.nodeCount;
        const increment = Math.PI * (3 - Math.sqrt(5));

        return atomZs.map((z, i) => {
            const y = ((i * offset) - 1) + (offset / 2);
            const r = Math.sqrt(1 - Math.pow(y, 2));
            const phi = ((i + 1) % this.nodeCount) * increment;

            const x = Math.cos(phi) * r * scale;
            const zPos = Math.sin(phi) * r * scale; 
            
            if (isNaN(x) || isNaN(y) || isNaN(zPos)) {
                throw new Error(`Layout Init Failed: NaN position at index ${i}`);
            }

            return {
                x, 
                y: y * scale, 
                z: zPos,
                r: this.getRadius(z),
                id: i,
                zNum: z
            };
        });
    }

    private getRadius(z: number): number {
        // Sync with AtomFactory logic approx
        const elem = ELEMENTS.find(e => e.z === z);
        const m = elem ? elem.iso[0].m : z * 2;
        return 30 + Math.pow(m, 0.33) * 10;
    }

    public solve(iterations: number = 400): {x: number, y: number, z: number}[] {
        let maxSpeed = 150; 
        const coolingRate = 0.99;
        const dt = 0.1;

        try {
            for (let iter = 0; iter < iterations; iter++) {
                this.step(dt, maxSpeed);
                maxSpeed *= coolingRate;
            }

            // Center the result around 0,0,0 to prevent offset drift
            let cx = 0, cy = 0, cz = 0;
            this.nodes.forEach(n => { cx += n.x; cy += n.y; cz += n.z; });
            cx /= this.nodeCount; cy /= this.nodeCount; cz /= this.nodeCount;

            return this.nodes.map(n => ({x: n.x - cx, y: n.y - cy, z: n.z - cz}));
        } catch (e: any) {
            console.error("[ForceDirectedLayout] Solver Failed:", e.message);
            return this.nodes.map(n => ({x: n.x * 5, y: n.y * 5, z: n.z * 5})); 
        }
    }

    private step(dt: number, maxSpeed: number) {
        const forces = this.nodes.map(() => ({x:0, y:0, z:0}));
        
        // Tuned for stability with unit size ~50
        // kRepulse boosted to ensure molecule starts slightly expanded
        const kRepulse = 15000; 
        const kSpring = 0.8; 
        const damping = 0.85; 

        // 1. Repulsion (Coulomb-like)
        for (let i = 0; i < this.nodeCount; i++) {
            for (let j = i + 1; j < this.nodeCount; j++) {
                const dx = this.nodes[j].x - this.nodes[i].x;
                const dy = this.nodes[j].y - this.nodes[i].y;
                const dz = this.nodes[j].z - this.nodes[i].z;
                const d2 = dx*dx + dy*dy + dz*dz;
                
                const safeD2 = Math.max(1.0, d2); 
                const d = Math.sqrt(safeD2);
                
                // Pure repulsion to prevent overlap
                const f = kRepulse / safeD2; 
                const fx = (dx/d) * f;
                const fy = (dy/d) * f;
                const fz = (dz/d) * f;
                
                forces[i].x -= fx; forces[i].y -= fy; forces[i].z -= fz;
                forces[j].x += fx; forces[j].y += fy; forces[j].z += fz;
            }
        }

        // 2. Springs (Bonding)
        // Extract Bond Order from tuple [idxA, idxB, order]
        this.bonds.forEach(([idxA, idxB, order]) => {
            const nA = this.nodes[idxA];
            const nB = this.nodes[idxB];
            
            const dx = nB.x - nA.x;
            const dy = nB.y - nA.y;
            const dz = nB.z - nA.z;
            const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
            const safeD = Math.max(0.1, d);

            // Calculate Target Length matching the Physics Engine's BondForce.ts logic
            // restScale = 0.9 - ((order - 1) * 0.12);
            const restScale = 0.9 - ((order - 1) * 0.12);
            const idealLen = (nA.r + nB.r) * restScale;

            const displacement = safeD - idealLen;
            const f = kSpring * displacement;
            
            const fx = (dx/safeD) * f;
            const fy = (dy/safeD) * f;
            const fz = (dz/safeD) * f;
            
            forces[idxA].x += fx; forces[idxA].y += fy; forces[idxA].z += fz;
            forces[idxB].x -= fx; forces[idxB].y -= fy; forces[idxB].z -= fz;
        });

        // 3. Integrate
        for (let i = 0; i < this.nodeCount; i++) {
            const f = forces[i];
            
            // Limit force
            const fMag = Math.sqrt(f.x*f.x + f.y*f.y + f.z*f.z);
            if (fMag > 1000) {
                const s = 1000 / fMag;
                f.x *= s; f.y *= s; f.z *= s;
            }

            const v = this.velocities[i];
            v.x = (v.x + f.x * dt) * damping;
            v.y = (v.y + f.y * dt) * damping;
            v.z = (v.z + f.z * dt) * damping;

            // Limit velocity
            const vMag = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
            if (vMag > maxSpeed) {
                const s = maxSpeed / vMag;
                v.x *= s; v.y *= s; v.z *= s;
            }

            this.nodes[i].x += v.x * dt;
            this.nodes[i].y += v.y * dt;
            this.nodes[i].z += v.z * dt;
        }
    }
}
