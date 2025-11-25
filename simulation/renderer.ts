
import { Atom, Particle } from '../types';
import { MouseState } from './types';
import { COVALENT_Z, WORLD_SCALE } from './constants'; 
import { getBondOrder as calculateBondOrder } from './utils';

/**
 * simulation/renderer.ts
 * 
 * Handles all HTML5 Canvas drawing operations with 3D projection.
 */

// Simple 3D Point Interface
interface Point3D { x: number, y: number, z: number, r: number }

export const renderCanvas = (
    ctx: CanvasRenderingContext2D,
    atoms: Atom[],
    particles: Particle[],
    mouse: MouseState,
    width: number, // Logical Width
    height: number, // Logical Height
    dpr: number, // Device Pixel Ratio
    showBonds: boolean,
    viewMode: 'solid' | 'glass' // New Prop
) => {
    // 0. Handle High-DPI Scaling
    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Clear Background
    ctx.fillStyle = '#0b0f19'; 
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = "round";

    const cx = width / 2;
    const cy = height / 2;
    
    // Zoom Logic
    const ZOOM = 1 / WORLD_SCALE;
    const worldCx = (width * WORLD_SCALE) / 2;
    const worldCy = (height * WORLD_SCALE) / 2;

    // Fixed Pitch for depth perception (X-Axis Rotation)
    // We tilt the world slightly back so atoms don't look perfectly flat
    const fixedPitch = 0.15; 
    const cosP = Math.cos(fixedPitch);
    const sinP = Math.sin(fixedPitch);

    // --- PROJECTION FUNCTION ---
    const project = (x: number, y: number, z: number, r: number): Point3D & { depth: number } => {
        // Translate to world center
        const dx = x - worldCx;
        const dy = y - worldCy;
        const dz = z;

        // 1. Rotate around X-axis (Fixed Pitch only)
        // y' = y*cos - z*sin
        // z' = y*sin + z*cos
        // We do NOT rotate around Y (Yaw) globally anymore, as the atoms themselves are rotated.
        const ry_p = dy * cosP - dz * sinP;
        const rz_p = dy * sinP + dz * cosP;

        // 2. Apply Zoom
        const zx_final = dx * ZOOM;
        const zy_final = ry_p * ZOOM;
        const zz_final = rz_p * ZOOM;
        const zr_final = r * ZOOM;

        // 3. Perspective Projection
        const fov = 1600; 
        const pScale = fov / (fov - zz_final);
        
        const sx = cx + zx_final * pScale;
        const sy = cy + zy_final * pScale;

        return {
            x: sx,
            y: sy,
            z: zz_final, 
            depth: zz_final,
            r: zr_final * pScale
        };
    };

    // 2. Lasso Selection
    if (mouse.isLassoing && mouse.lassoPoints.length > 0) {
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const points = mouse.lassoPoints;
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // 3. Molecule/Selection Halo
    if (mouse.moleculeHaloLife > 0) {
        const life = mouse.moleculeHaloLife;
        const max = mouse.moleculeHaloMaxLife;
        const ratio = life / max;
        
        const mcx = mouse.moleculeTarget?.cx || 0;
        const mcy = mouse.moleculeTarget?.cy || 0;
        const p = project(mcx, mcy, 0, 0);

        const startRadius = (mouse.moleculeTarget?.startRadius || 200) * ZOOM;
        const endRadius = 50 * ZOOM;
        const radius = endRadius + (startRadius - endRadius) * ratio;

        ctx.strokeStyle = `rgba(0, 255, 255, ${Math.min(1, ratio + 0.2)})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]); 
        ctx.beginPath();
        // Ellipse to simulate 3D circle - squashed by pitch
        ctx.ellipse(p.x, p.y, radius, radius * cosP, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // 4. Pre-calculate projected positions for sorting
    const renderList = atoms
        .map(a => {
            if (!a) return null;
            const p = project(a.x, a.y, a.z, a.radius);
            return { atom: a, proj: p };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

    // Create lookup map for label positioning
    const atomProjMap = new Map<string, {x: number, y: number, r: number}>();
    renderList.forEach(item => atomProjMap.set(item.atom.id, item.proj));

    // Sort by projected Depth (furthest first => Painter's Algo)
    renderList.sort((a, b) => (b.proj.depth - a.proj.depth));

    // 5. Draw Atoms & Bonds
    
    interface RenderItem {
        type: 'atom' | 'bond';
        depth: number;
        data: any;
    }
    
    const items: RenderItem[] = [];
    
    // Add Atoms
    renderList.forEach(item => {
        items.push({ type: 'atom', depth: item.proj.depth, data: item });
    });

    // Add Bonds
    if (showBonds) {
        const bondsProcessed = new Set<string>(); // "id1-id2"
        atoms.forEach(a => {
            if (!a) return;
            a.bonds.forEach(bid => {
                const b = atoms.find(x => x.id === bid);
                if (!b) return;
                const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
                if (bondsProcessed.has(key)) return;
                bondsProcessed.add(key);

                const pA = project(a.x, a.y, a.z, a.radius);
                const pB = project(b.x, b.y, b.z, b.radius);
                const avgDepth = (pA.depth + pB.depth) / 2;
                
                items.push({ 
                    type: 'bond', 
                    depth: avgDepth, 
                    data: { a: a, b: b, pA: pA, pB: pB } 
                });
            });
        });
    }

    // Sort all (Painters)
    items.sort((a, b) => b.depth - a.depth);

    items.forEach(item => {
        if (item.type === 'bond') {
            const { a, b, pA, pB } = item.data;
            const order = calculateBondOrder(a, b.id);
            const isCovalent = COVALENT_Z.has(a.element.z) && COVALENT_Z.has(b.element.z);
            
            // Depth shading
            const alpha = Math.max(0.1, Math.min(0.8, 1.0 - (item.depth / 2000))); 
            ctx.strokeStyle = isCovalent ? `rgba(255,255,255,${alpha})` : `rgba(255,255,255,${alpha * 0.3})`;
            ctx.lineWidth = Math.min(pA.r, pB.r) * 0.4;
            
            // Glass mode bonds are slightly more transparent to not clutter
            if (viewMode === 'glass') ctx.globalAlpha = 0.6;

            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();

            if (order > 1) {
                // Perpendicular offset for double bonds
                const dx = pB.x - pA.x;
                const dy = pB.y - pA.y;
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                const nx = -dy / dist;
                const ny = dx / dist;
                const off = Math.max(2, ctx.lineWidth * 0.8);

                ctx.lineWidth *= 0.6;
                if (order === 2) {
                    ctx.beginPath(); ctx.moveTo(pA.x + nx*off, pA.y + ny*off); ctx.lineTo(pB.x + nx*off, pB.y + ny*off); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(pA.x - nx*off, pA.y - ny*off); ctx.lineTo(pB.x - nx*off, pB.y - ny*off); ctx.stroke();
                } else {
                    ctx.beginPath(); ctx.moveTo(pA.x + nx*off*1.5, pA.y + ny*off*1.5); ctx.lineTo(pB.x + nx*off*1.5, pB.y + ny*off*1.5); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(pA.x - nx*off*1.5, pA.y - ny*off*1.5); ctx.lineTo(pB.x - nx*off*1.5, pB.y - ny*off*1.5); ctx.stroke();
                }
            }
            ctx.globalAlpha = 1.0; // Reset

        } else {
            const { atom, proj } = item.data;
            const { x, y, r } = proj;
            
            const isDraggedGroup = mouse.dragGroup.has(atom.id);
            const isHovered = mouse.hoverId === atom.id;

            // --- SPECIAL RENDER FOR ELECTRON (Z=-1) ---
            if (atom.element.z === -1) {
                // Electron Cloud Render - Whiter Look
                const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)'); // Pure White Core
                grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)'); 
                grad.addColorStop(0.5, 'rgba(210, 240, 255, 0.4)'); // Subtle Blue-ish Haze
                grad.addColorStop(1, 'rgba(210, 240, 255, 0)'); // Fade out

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
                ctx.fill();

                // Tiny "e" Label
                if (r > 3) {
                    ctx.fillStyle = 'rgba(0,0,0,0.8)';
                    const fontSize = Math.max(8, r * 0.9);
                    ctx.font = `700 ${fontSize}px Inter, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText("e", x, y);
                }
                
            } else {
                // --- STANDARD ATOM RENDER ---
                if (viewMode === 'solid') {
                    // Solid Render Logic
                    const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r * 0.2, x, y, r);
                    grad.addColorStop(0, atom.element.c); 
                    grad.addColorStop(1, 'black'); 
                    
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Specular Shine
                    const shine = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 0, x, y, Math.max(0.1, r));
                    shine.addColorStop(0, 'rgba(255,255,255,0.7)');
                    shine.addColorStop(0.3, 'rgba(255,255,255,0.1)');
                    shine.addColorStop(1, 'rgba(0,0,0,0.4)');
                    ctx.fillStyle = shine;
                    ctx.fill();
                } else {
                    // Glass Render Logic
                    
                    // Quick RGB parse
                    const hex = atom.element.c;
                    const rVal = parseInt(hex.slice(1, 3), 16);
                    const gVal = parseInt(hex.slice(3, 5), 16);
                    const bVal = parseInt(hex.slice(5, 7), 16);
                    const rgb = `${rVal},${gVal},${bVal}`;

                    // 1. Volume Gradient (Simulates Density)
                    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
                    grad.addColorStop(0, `rgba(${rgb}, 0.98)`); 
                    grad.addColorStop(0.6, `rgba(${rgb}, 0.70)`);
                    grad.addColorStop(1, `rgba(${rgb}, 0.20)`);

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
                    ctx.fill();

                    // 2. Specular Highlight
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.beginPath();
                    ctx.ellipse(x - r*0.25, y - r*0.25, r*0.2, r*0.12, Math.PI / 4, 0, Math.PI * 2);
                    ctx.fill();

                    // 3. Backside Refraction Glow
                    ctx.fillStyle = `rgba(${rgb}, 0.4)`;
                    ctx.beginPath();
                    ctx.ellipse(x + r*0.2, y + r*0.2, r*0.2, r*0.12, Math.PI / 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // --- TEXT RENDER (Not for Electrons) ---
            if (atom.element.z !== -1 && r > 5) { 
                let label = atom.element.s;
                // Append Charge Indicator
                if (atom.charge) {
                    if (atom.charge > 0) {
                        label += (atom.charge > 1) ? `${atom.charge}⁺` : "⁺";
                    } else if (atom.charge < 0) {
                         label += (atom.charge < -1) ? `${Math.abs(atom.charge)}⁻` : "⁻";
                    }
                }

                ctx.fillStyle = (viewMode === 'glass') ? '#FFFFFF' : '#000000';
                // Font Size Scaling
                const fontSize = Math.floor(Math.max(10, r * 0.9));
                ctx.font = `700 ${fontSize}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Outline
                ctx.lineWidth = Math.max(1.5, fontSize * 0.12);
                ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                ctx.strokeText(label, x, y);

                if (viewMode === 'glass') {
                    // --- GLOWING TEXT EFFECT ---
                    
                    // Layer 1: Colored Aura (Element Color)
                    ctx.shadowColor = atom.element.c;
                    ctx.shadowBlur = 1.25; 
                    ctx.fillText(label, x, y);
                    
                    // Layer 2: Hot Core (White Halo)
                    ctx.shadowColor = '#FFFFFF';
                    ctx.shadowBlur = 0.5; 
                    ctx.fillText(label, x, y);
                    
                    ctx.shadowBlur = 0; // Reset
                } else {
                     ctx.fillText(label, x, y);
                }
            }

            if (isDraggedGroup || isHovered) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, r + 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    });

    // 6. Particles
    particles.forEach(p => {
        const dx = p.x - worldCx;
        const dy = p.y - worldCy;
        
        const zx_final = dx * ZOOM;
        const zy_final = dy * ZOOM; // Flat projection for sparks is acceptable
        
        const sx = cx + zx_final;
        const sy = cy + zy_final;

        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.1, p.size * ZOOM), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // 7. UI Overlay (Molecule Name - Dragged)
    if (mouse.dragName && mouse.dragGroup.size > 0) {
        let sumX = 0;
        let minY = Infinity;
        let count = 0;

        mouse.dragGroup.forEach(id => {
            const p = atomProjMap.get(id);
            if (p) {
                sumX += p.x;
                const topEdge = p.y - p.r;
                if (topEdge < minY) minY = topEdge;
                count++;
            }
        });

        if (count > 0) {
            const centerX = sumX / count;
            const textY = minY - 25;

            ctx.font = "bold 16px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic";
            
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeText(mouse.dragName, centerX, textY);
            ctx.fillText(mouse.dragName, centerX, textY);
            ctx.shadowBlur = 0;
        }
    }

    // 8. Floating Labels (Fading Names)
    if (mouse.floatingLabels.length > 0) {
        mouse.floatingLabels.forEach(label => {
            // Calculate center of the molecule group for label placement
            // This matches the "Dragged" label logic to ensure no visual jumping
            let sumX = 0;
            let minY = Infinity;
            let count = 0;

            label.atomIds.forEach(id => {
                const p = atomProjMap.get(id);
                if (p) {
                    sumX += p.x;
                    const topEdge = p.y - p.r;
                    if (topEdge < minY) minY = topEdge;
                    count++;
                }
            });

            if (count > 0) {
                const centerX = sumX / count;
                const textY = minY - 25;
                
                let opacity = 1.0;
                if (label.life < label.fadeDuration) {
                    opacity = label.life / label.fadeDuration;
                }
                opacity = Math.max(0, Math.min(1, opacity));

                ctx.globalAlpha = opacity;
                ctx.font = "bold 16px Inter, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "alphabetic";
                
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 4;
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                ctx.strokeText(label.text, centerX, textY);
                ctx.fillText(label.text, centerX, textY);
                
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1.0;
            }
        });
    }
    
    ctx.restore();
};
