
import { Atom, Particle } from '../../../types/core';
import { MouseState } from '../../../types/ui';
import { COVALENT_Z } from '../../config';
import { addBond, redistributeCharge, getMoleculeGroup } from '../../utils/general';
import { trySpawnLabel } from '../../utils/molecular';
import { createExplosion } from '../../graphics/Effects';
import { canFormBond } from '../validators/BondingRules';

export const attemptBondFormation = (
    atoms: Atom[], 
    particles: Particle[], 
    a: Atom, 
    b: Atom, 
    normal: {x: number, y: number, z: number},
    mouse: MouseState
): void => {
    // Immunity check: Atoms in cooldown (ejected/assembling) should not bond with others
    // This prevents ejected molecules from snagging on neighbors or collapsing.
    if ((a.cooldown || 0) > 0 || (b.cooldown || 0) > 0) return;

    if (!canFormBond(atoms, a, b)) return;

    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;
    const dvz = a.vz - b.vz;
    const vRelSq = dvx*dvx + dvy*dvy + dvz*dvz;

    const aVal = COVALENT_Z.has(a.element.z) ? a.element.v : 8;
    const bVal = COVALENT_Z.has(b.element.z) ? b.element.v : 8;
    const hasSpace = a.bonds.length < aVal && b.bonds.length < bVal;
    
    // Gentle formation (Velocity < 10)
    const isGentle = vRelSq < 100;
    
    // Forced formation (High energy collision)
    // Threshold increased to 2500 (Speed 50) to prevent accidental triggers from wobble
    let isForced = vRelSq > 2500; 

    // CRITICAL FIX: Prevent "Internal Short Circuits"
    // If atoms are already part of the same molecule, we DISABLE forced bonding.
    // This prevents internal vibrations/wobbles from triggering a "high energy collision" logic
    // which would create hypervalent bonds (e.g. C=5) and cause the Annealer to destroy the molecule.
    if (isForced) {
        const groupA = getMoleculeGroup(atoms, a.id);
        if (groupA.has(b.id)) {
            isForced = false;
        }
    }

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
