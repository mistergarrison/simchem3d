


import { Atom } from '../types';

/**
 * simulation/utils.ts
 * 
 * Pure utility functions for Geometry, Graph Traversal, and basic Bond management.
 */

/**
 * Rotates a point (x, z) around a center (cx, cz) by angle theta.
 */
export const rotatePoint = (x: number, z: number, cx: number, cz: number, theta: number) => {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const dx = x - cx;
    const dz = z - cz;
    return {
        x: cx + (dx * cos - dz * sin),
        z: cz + (dx * sin + dz * cos)
    };
};

/**
 * Calculates the optimal rotation to align a molecule's "Flattest Face" to the camera.
 * 
 * Strategy:
 * 1. Compute Covariance Matrix.
 * 2. Find the Eigenvector with the Smallest Eigenvalue (The Normal Vector).
 * 3. Calculate rotation to align this Normal with the Z-axis (0,0,1).
 * 4. If already aligned (angle < threshold), return null to prevent jitter.
 */
export const calculateOptimalRotation = (atoms: Atom[], groupIds: Set<string>) => {
    const group = atoms.filter(a => groupIds.has(a.id));
    if (group.length < 3) return null; // Too simple to rotate

    // 1. Calculate Center of Mass
    let cx = 0, cy = 0, cz = 0;
    group.forEach(a => { cx += a.x; cy += a.y; cz += a.z; });
    cx /= group.length; cy /= group.length; cz /= group.length;

    // 2. Compute Covariance Matrix components
    let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
    group.forEach(a => {
        const dx = a.x - cx;
        const dy = a.y - cy;
        const dz = a.z - cz;
        xx += dx * dx;
        xy += dx * dy;
        xz += dx * dz;
        yy += dy * dy;
        yz += dy * dz;
        zz += dz * dz;
    });

    // Helper: Matrix-Vector Multiplication
    const mult = (v: {x: number, y: number, z: number}) => ({
        x: xx*v.x + xy*v.y + xz*v.z,
        y: xy*v.x + yy*v.y + yz*v.z,
        z: xz*v.x + yz*v.y + zz*v.z
    });

    // 3. Find Primary Axis (Largest Eigenvalue) via Power Iteration
    // This is the "Length" of the molecule.
    let v1 = { x: 1, y: 1, z: 1 };
    for(let i=0; i<8; i++) {
        v1 = mult(v1);
        const mag = Math.sqrt(v1.x*v1.x + v1.y*v1.y + v1.z*v1.z);
        if (mag < 1e-6) break;
        v1.x /= mag; v1.y /= mag; v1.z /= mag;
    }

    // 4. Find Secondary Axis (2nd Largest) 
    // Project data onto plane orthogonal to v1 and iterate
    let v2 = { x: -v1.y, y: v1.z, z: v1.x }; // Arbitrary start orthogonal-ish
    for(let i=0; i<8; i++) {
        // Gram-Schmidt orthogonalization to remove V1 component
        const dot = v2.x*v1.x + v2.y*v1.y + v2.z*v1.z;
        v2.x -= dot*v1.x; v2.y -= dot*v1.y; v2.z -= dot*v1.z;
        
        v2 = mult(v2);
        const mag = Math.sqrt(v2.x*v2.x + v2.y*v2.y + v2.z*v2.z);
        if (mag < 1e-6) break;
        v2.x /= mag; v2.y /= mag; v2.z /= mag;
    }

    // 5. Calculate Normal Vector (V3) via Cross Product (V1 x V2)
    // This represents the "Thinnest" dimension of the molecule.
    let normal = {
        x: v1.y*v2.z - v1.z*v2.y,
        y: v1.z*v2.x - v1.x*v2.z,
        z: v1.x*v2.y - v1.y*v2.x
    };
    let nMag = Math.sqrt(normal.x*normal.x + normal.y*normal.y + normal.z*normal.z);
    if (nMag < 1e-6) return null; // Degenerate geometry
    normal.x /= nMag; normal.y /= nMag; normal.z /= nMag;

    // 6. Orient Normal towards Camera (Z+)
    // If normal points away (Z negative), flip it.
    if (normal.z < 0) {
        normal.x = -normal.x; normal.y = -normal.y; normal.z = -normal.z;
    }

    // 7. Calculate Rotation to align Normal with (0,0,1)
    // We want to rotate Normal -> Z_Axis
    // Axis of rotation = Normal x Z_Axis
    const axis = {
        x: normal.y * 1 - normal.z * 0, // normal.y
        y: normal.z * 0 - normal.x * 1, // -normal.x
        z: normal.x * 0 - normal.y * 0  // 0 -> Axis is in XY plane (Tilt only)
    };
    
    const axisMag = Math.sqrt(axis.x*axis.x + axis.y*axis.y + axis.z*axis.z);
    
    // Stability Check: If axis is tiny, we are already aligned.
    // Angle = acos(normal.z). If normal.z ~ 1, angle ~ 0.
    const dotZ = normal.z; // since Z-axis is (0,0,1)
    
    // Threshold: ~15 degrees (cos(15) ~= 0.96)
    if (dotZ > 0.96 || axisMag < 1e-3) {
        return null; // Already facing camera, don't move
    }

    // Normalize axis
    axis.x /= axisMag; axis.y /= axisMag; axis.z /= axisMag;
    
    const angle = Math.acos(Math.max(-1, Math.min(1, dotZ)));

    return {
        axis: axis,
        angle: angle
    };
};

/**
 * Ray Casting Algorithm for Point-in-Polygon testing.
 * Used by the Lasso selection tool.
 * 
 * @param p The point to test
 * @param polygon The array of points defining the polygon boundary
 * @returns true if point p is inside the polygon
 */
export const isPointInPolygon = (p: {x: number, y: number}, polygon: {x: number, y: number}[]) => {
    let isInside = false;
    let minX = polygon[0].x, maxX = polygon[0].x;
    let minY = polygon[0].y, maxY = polygon[0].y;
    
    // Optimization: Bounding Box check first
    for (let i = 1; i < polygon.length; i++) {
        const q = polygon[i];
        minX = Math.min(q.x, minX);
        maxX = Math.max(q.x, maxX);
        minY = Math.min(q.y, minY);
        maxY = Math.max(q.y, maxY);
    }
    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) return false;

    // Ray Casting: Count intersections with polygon edges
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if (((polygon[i].y > p.y) !== (polygon[j].y > p.y)) &&
            (p.x < (polygon[j].x - polygon[i].x) * (p.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
            isInside = !isInside;
        }
    }
    return isInside;
};

/**
 * Breadth-First Search (BFS) to find all atoms connected to a starting atom.
 * Used to identify whole molecules for dragging or deletion.
 * 
 * @param allAtoms The complete list of atoms in the simulation
 * @param startId The ID of the atom to start traversal from
 * @returns A Set containing the IDs of all connected atoms
 */
export const getMoleculeGroup = (allAtoms: Atom[], startId: string): Set<string> => {
    const group = new Set<string>();
    const queue = [startId];
    group.add(startId);

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentAtom = allAtoms.find(a => a.id === currentId);
        if (currentAtom) {
            for (const neighborId of currentAtom.bonds) {
                if (!group.has(neighborId)) {
                    group.add(neighborId);
                    queue.push(neighborId);
                }
            }
        }
    }
    return group;
};

// --- Bond Management Helpers ---

/**
 * Establishes a bond between two atoms.
 * Updates the bond lists of both atoms.
 */
export const addBond = (a: Atom, b: Atom) => {
    a.bonds.push(b.id);
    b.bonds.push(a.id);
};

/**
 * Completely severs the connection between atom A and atom B.
 * Removes ALL bonds (Single, Double, or Triple) between them.
 * @returns true if bonds were actually removed.
 */
export const breakBond = (allAtoms: Atom[], a: Atom, bId: string): boolean => {
    const startLen = a.bonds.length;
    a.bonds = a.bonds.filter(id => id !== bId);
    
    let bChanged = false;
    const b = allAtoms.find(at => at.id === bId);
    if (b) {
        const bStartLen = b.bonds.length;
        b.bonds = b.bonds.filter(id => id !== a.id);
        bChanged = b.bonds.length !== bStartLen;
    }
    
    return a.bonds.length !== startLen || bChanged;
};

/**
 * Decreases bond order by 1 (e.g., Triple -> Double).
 * Used during high-energy impacts where a bond might be partially broken.
 * @returns true if a bond was removed, false if none existed.
 */
export const decrementBond = (allAtoms: Atom[], a: Atom, bId: string) => {
    const indexA = a.bonds.indexOf(bId);
    if (indexA > -1) {
        a.bonds.splice(indexA, 1);
        const b = allAtoms.find(at => at.id === bId);
        if (b) {
            const indexB = b.bonds.indexOf(a.id);
            if (indexB > -1) b.bonds.splice(indexB, 1);
        }
        return true;
    }
    return false;
};

/**
 * Calculates the Bond Order (1=Single, 2=Double, 3=Triple) between atom A and target ID.
 */
export const getBondOrder = (a: Atom, bId: string) => {
    let count = 0;
    for (const id of a.bonds) {
        if (id === bId) count++;
    }
    return count;
};