
import { Atom, Particle } from '../../../types';
import { MouseState } from '../../types';
import { COVALENT_Z } from '../../constants';
import { addBond, redistributeCharge } from '../../utils';
import { trySpawnLabel } from '../../molecular_utils';
import { createExplosion } from '../../effects';
import { canFormBond } from '../validators/BondingRules';

export const attemptBondFormation = (
    atoms: Atom[], 
    particles: Particle[], 
    a: Atom, 
    b: Atom, 
    normal: {x: number, y: number, z: number},
    mouse: MouseState
): void => {
    if (!canFormBond(atoms, a, b)) return;

    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;
    const dvz = a.vz - b.vz;
    const vRelSq = dvx*dvx + dvy*dvy + dvz*dvz;

    const aVal = COVALENT_Z.has(a.element.z) ? a.element.v : 8;
    const bVal = COVALENT_Z.has(b.element.z) ? b.element.v : 8;
    const hasSpace = a.bonds.length < aVal && b.bonds.length < bVal;
    
    const isGentle = vRelSq < 100;
    const isForced = vRelSq > 400;

    if ((hasSpace && isGentle) || isForced) {
        addBond(a, b);
        
        const flashColor = isForced ? '#FFDD44' : '#FFFFFF';
        createExplosion(particles, (a.x+b.x)/2, (a.y+b.y)/2, (a.z+b.z)/2, flashColor, 3);
        trySpawnLabel(atoms, a, mouse.floatingLabels);
        
        redistributeCharge(atoms, a.id);

        // Inelastic Collision (Merge Velocities)
        const totalMass = a.mass + b.mass;
        const avgVx = (a.vx * a.mass + b.vx * b.mass) / totalMass;
        const avgVy = (a.vy * a.mass + b.vy * b.mass) / totalMass;
        const avgVz = (a.vz * a.mass + b.vz * b.mass) / totalMass;
        
        a.vx = avgVx; a.vy = avgVy; a.vz = avgVz;
        b.vx = avgVx; b.vy = avgVy; b.vz = avgVz;

        // Snap to ideal distance to prevent instant recoil
        // BLOCKED if assembling: The layout engine has authority over position.
        if (!a.isAssembling && !b.isAssembling) {
            const idealDist = (a.radius + b.radius) * 0.9;
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            const midZ = (a.z + b.z) / 2;
            
            a.x = midX - normal.x * (idealDist * 0.5);
            a.y = midY - normal.y * (idealDist * 0.5);
            a.z = midZ - normal.z * (idealDist * 0.5);

            b.x = midX + normal.x * (idealDist * 0.5);
            b.y = midY + normal.y * (idealDist * 0.5);
            b.z = midZ + normal.z * (idealDist * 0.5);
        }
    }
};
