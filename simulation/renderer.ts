
import { Atom, Particle } from '../types';
import { MouseState } from './types';
import { COVALENT_Z, WORLD_SCALE, FOV } from './constants'; 
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
    viewMode: 'solid' | 'glass', // New Prop
    dragStart: {x: number, y: number, time: number} | null // Launch Drag Origin with Time
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

    // --- PROJECTION FUNCTION ---
    // Simplified: Global camera pitch is always 0 (Planar View).
    // Tumbling is now handled per-molecule in local space.
    const project = (x: number, y: number, z: number, r: number): (Point3D & { depth: number }) | null => {
        // Translate to world center
        const dx = x - worldCx;
        const dy = y - worldCy;
        const dz = z;

        // 2. Apply Zoom
        const zx_final = dx * ZOOM;
        const zy_final = dy * ZOOM;
        const zz_final = dz * ZOOM;
        const zr_final = r * ZOOM;

        // 3. Perspective Projection with NEAR PLANE CLIPPING
        if (zz_final > FOV - 200) {
            return null;
        }

        const pScale = FOV / (FOV - zz_final);
        
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

    // --- PRE-CALCULATION: CONNECTED COMPONENTS FOR CHARGE ---
    interface GroupData {
        cx: number; cy: number; cz: number;
        charge: number;
        count: number;
    }
    const atomGroups = new Map<string, number>(); // AtomID -> GroupIndex
    const groups: GroupData[] = [];
    const processedForGroups = new Set<string>();

    for (const atom of atoms) {
        if (processedForGroups.has(atom.id)) continue;

        const queue = [atom];
        processedForGroups.add(atom.id);
        let sumX = 0, sumY = 0, sumZ = 0, sumCharge = 0;
        const members: string[] = [];

        while (queue.length > 0) {
            const curr = queue.shift()!;
            members.push(curr.id);
            sumX += curr.x; 
            sumY += curr.y; 
            sumZ += curr.z;
            sumCharge += (curr.charge || 0);

            curr.bonds.forEach(bid => {
                if (!processedForGroups.has(bid)) {
                    const neighbor = atoms.find(a => a.id === bid);
                    if (neighbor) {
                        processedForGroups.add(bid);
                        queue.push(neighbor);
                    }
                }
            });
        }

        const count = members.length;
        const gIdx = groups.length;
        groups.push({
            cx: sumX / count,
            cy: sumY / count,
            cz: sumZ / count,
            charge: sumCharge,
            count: count
        });
        
        members.forEach(mid => atomGroups.set(mid, gIdx));
    }

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

    // 2b. Launch Drag Visualization
    if (dragStart) {
        const dt = Date.now() - dragStart.time;
        const charge = Math.min(dt / 4000, 1.0); 

        const dx = dragStart.x - mouse.x;
        const dy = dragStart.y - mouse.y;
        const len = Math.sqrt(dx*dx + dy*dy);

        if (len > 0) {
            const aimLen = 2000; 
            const aimX = dragStart.x + (dx/len) * aimLen;
            const aimY = dragStart.y + (dy/len) * aimLen;
            
            ctx.beginPath();
            ctx.moveTo(dragStart.x, dragStart.y);
            ctx.lineTo(aimX, aimY);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 8]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        let r = 255, g = 255, b = 255;
        if (charge < 0.5) {
            const t = charge * 2;
            r = Math.floor(255 * (1 - t));
        } else {
            const t = (charge - 0.5) * 2;
            r = Math.floor(180 * t);
            g = Math.floor(255 * (1 - t));
        }
        
        ctx.lineWidth = 2 + charge * 4; 
        if (charge > 0.1) {
            ctx.shadowBlur = charge * 30;
            ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
        }

        if (charge > 0.6) {
            const drawLightning = (width: number, color: string, seedOffset: number) => {
                ctx.beginPath();
                ctx.moveTo(dragStart.x, dragStart.y);
                
                const mainDx = mouse.x - dragStart.x;
                const mainDy = mouse.y - dragStart.y;
                const mainLen = Math.sqrt(mainDx*mainDx + mainDy*mainDy) || 1;
                const normX = -mainDy / mainLen;
                const normY = mainDx / mainLen;
                
                const segments = 15 + Math.floor(charge * 10);

                for (let i = 1; i < segments; i++) {
                    const t = i / segments;
                    const tx = dragStart.x + mainDx * t;
                    const ty = dragStart.y + mainDy * t;
                    const jitter = (Math.sin(i * 132.1 + Date.now() * 0.1 + seedOffset) + (Math.random() - 0.5)) * charge * 20;
                    
                    ctx.lineTo(tx + normX*jitter, ty + normY*jitter);
                }
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.stroke();
            };
            drawLightning(4 + charge * 4, `rgba(${r}, ${g}, ${b}, 0.8)`, 0);
            ctx.shadowBlur = 0;
            drawLightning(2, '#FFFFFF', 0.5);
        } else {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
            const shake = charge * 5;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(dragStart.x, dragStart.y);
            const midX = (dragStart.x + mouse.x) / 2 + (Math.random() - 0.5) * shake;
            const midY = (dragStart.y + mouse.y) / 2 + (Math.random() - 0.5) * shake;
            ctx.quadraticCurveTo(midX, midY, mouse.x, mouse.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.shadowBlur = 0; 
        ctx.beginPath();
        ctx.arc(dragStart.x, dragStart.y, 4 + charge * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.fill();
        if (charge > 0.6) {
            ctx.beginPath();
            ctx.arc(dragStart.x, dragStart.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
    }

    // 2c. Energy Tool Gauge
    if (mouse.energyActive) {
        const val = mouse.energyValue;
        const target = mouse.energyTarget;

        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
        ctx.fillStyle = '#FFD700';
        ctx.font = "bold 24px Inter, sans-serif";
        ctx.textAlign = "center";
        
        const label = val >= 1 ? `${val.toFixed(2)} MeV` : `${(val*1000).toFixed(0)} keV`;
        ctx.fillText(label, mouse.x, mouse.y - 40);

        // Circular Gauge
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 30, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.stroke();

        ctx.beginPath();
        // Just spin proportional to value
        const angle = (val / 10) * Math.PI * 2; 
        ctx.arc(mouse.x, mouse.y, 30, -Math.PI/2, -Math.PI/2 + angle);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFD700';
        ctx.stroke();

        if (target) {
            // Visual feedback for hitting a target threshold
            const diff = Math.abs(val - target);
            if (diff / target < 0.05) {
                ctx.beginPath();
                ctx.arc(mouse.x, mouse.y, 40, 0, Math.PI * 2);
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.fillStyle = '#00FF00';
                ctx.font = "bold 12px Inter, sans-serif";
                ctx.fillText("RELEASE!", mouse.x, mouse.y + 50);
            }
        }
        ctx.shadowBlur = 0;
    }

    // 3. Clearance Ring
    if (mouse.clearance && mouse.clearance.active) {
        const c = mouse.clearance;
        const progress = 1 - (c.life / c.maxLife);
        const radius = c.maxRadius * progress * ZOOM; 
        
        const p = project(c.cx, c.cy, 0, 0); 

        if (p) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${1.0 - progress})`;
            ctx.lineWidth = 4 * (1 - progress);
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, radius, radius, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = `rgba(255, 255, 255, ${0.05 * (1 - progress)})`;
            ctx.fill();
        }
    }

    // 4. Molecule/Selection Halo
    if (mouse.moleculeHaloLife > 0) {
        const life = mouse.moleculeHaloLife;
        const max = mouse.moleculeHaloMaxLife;
        const ratio = life / max;
        
        const mcx = mouse.moleculeTarget?.cx || 0;
        const mcy = mouse.moleculeTarget?.cy || 0;
        const p = project(mcx, mcy, 0, 0);

        if (p) {
            const startRadius = (mouse.moleculeTarget?.startRadius || 200) * ZOOM;
            const endRadius = 50 * ZOOM;
            const radius = endRadius + (startRadius - endRadius) * ratio;

            ctx.strokeStyle = `rgba(0, 255, 255, ${Math.min(1, ratio + 0.2)})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]); 
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, radius, radius, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // 5. Pre-calculate projected positions
    const renderList = atoms
        .map(a => {
            if (!a) return null;
            const p = project(a.x, a.y, a.z, a.radius);
            if (!p) return null; 
            return { atom: a, proj: p };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

    const atomProjMap = new Map<string, {x: number, y: number, r: number}>();
    renderList.forEach(item => atomProjMap.set(item.atom.id, item.proj));

    renderList.sort((a, b) => (b.proj.depth - a.proj.depth));

    // 6. Draw Atoms & Bonds
    interface RenderItem {
        type: 'atom' | 'bond';
        depth: number;
        data: any;
    }
    const items: RenderItem[] = [];
    
    renderList.forEach(item => {
        items.push({ type: 'atom', depth: item.proj.depth, data: item });
    });

    if (showBonds) {
        const bondsProcessed = new Set<string>(); 
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
                
                if (pA && pB) {
                    const avgDepth = (pA.depth + pB.depth) / 2;
                    items.push({ 
                        type: 'bond', 
                        depth: avgDepth, 
                        data: { a: a, b: b, pA: pA, pB: pB } 
                    });
                }
            });
        });
    }

    items.sort((a, b) => b.depth - a.depth);

    items.forEach(item => {
        if (item.type === 'bond') {
            const { a, b, pA, pB } = item.data;
            const order = calculateBondOrder(a, b.id);
            const isCovalent = COVALENT_Z.has(a.element.z) && COVALENT_Z.has(b.element.z);
            
            const alpha = Math.max(0.1, Math.min(0.8, 1.0 - (item.depth / 2000))); 
            ctx.strokeStyle = isCovalent ? `rgba(255,255,255,${alpha})` : `rgba(255,255,255,${alpha * 0.3})`;
            ctx.lineWidth = Math.min(pA.r, pB.r) * 0.4;
            if (viewMode === 'glass') ctx.globalAlpha = 0.6;

            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();

            if (order > 1) {
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
            ctx.globalAlpha = 1.0; 

        } else {
            const { atom, proj } = item.data;
            const { x, y, r } = proj;
            // Updated to check negative Z for electrons or specific element IDs
            const isElectron = atom.element.z === -1;
            
            // UPDATED LOGIC: A proton is ONLY bare if it has NO bonds.
            // If it bonds (H2+, etc), it behaves like a white Hydrogen atom.
            const isBareProton = atom.element.z === 1 && atom.charge === 1 && atom.mass < 1.6 && atom.bonds.length === 0;
            
            const atomColor = isBareProton ? '#FF3333' : atom.element.c;
            
            // Determine Label: Use "H" if it's Hydrogen (Z=1) but NOT a bare proton
            let labelText = atom.element.s;
            if (atom.element.z === 1 && !isBareProton) {
                labelText = "H";
            }

            if (isElectron) {
                const cloudR = r * 1.5;
                const grad = ctx.createRadialGradient(x, y, 0, x, y, cloudR);
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
                grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)'); 
                grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)'); 
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)'); 

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(x, y, Math.max(0.1, cloudR), 0, Math.PI * 2);
                ctx.fill();

                if (r > 3) {
                    ctx.fillStyle = 'rgba(0,0,0,0.8)';
                    const fontSize = Math.max(8, r * 0.9);
                    ctx.font = `700 ${fontSize}px Inter, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText("e", x, y);
                }
            } else {
                if (viewMode === 'solid') {
                    const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r * 0.2, x, y, r);
                    grad.addColorStop(0, atomColor); 
                    grad.addColorStop(1, 'black'); 
                    ctx.fillStyle = grad;
                    ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); ctx.fill();
                    
                    const shine = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 0, x, y, Math.max(0.1, r));
                    shine.addColorStop(0, 'rgba(255,255,255,0.7)');
                    shine.addColorStop(0.3, 'rgba(255,255,255,0.1)');
                    shine.addColorStop(1, 'rgba(0,0,0,0.4)');
                    ctx.fillStyle = shine; ctx.fill();
                } else {
                    const hex = atomColor;
                    const rVal = parseInt(hex.slice(1, 3), 16);
                    const gVal = parseInt(hex.slice(3, 5), 16);
                    const bVal = parseInt(hex.slice(5, 7), 16);
                    const rgb = `${rVal},${gVal},${bVal}`;

                    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
                    grad.addColorStop(0, `rgba(${rgb}, 0.98)`); 
                    grad.addColorStop(0.6, `rgba(${rgb}, 0.70)`);
                    grad.addColorStop(1, `rgba(${rgb}, 0.20)`);
                    ctx.fillStyle = grad;
                    ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); ctx.fill();

                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.beginPath(); ctx.ellipse(x - r*0.25, y - r*0.25, r*0.2, r*0.12, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = `rgba(${rgb}, 0.4)`;
                    ctx.beginPath(); ctx.ellipse(x + r*0.2, y + r*0.2, r*0.2, r*0.12, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
                }

                if (r > 5) { 
                    let label = labelText;
                    const isQuark = atom.element.z === 1000;
                    const gIdx = atomGroups.get(atom.id);
                    const group = gIdx !== undefined ? groups[gIdx] : null;
                    const isIsolated = !group || group.count === 1;

                    if (!isBareProton && !isQuark && atom.charge && isIsolated) {
                        const q = parseFloat(atom.charge.toFixed(2));
                        if (q > 0) label += (q !== 1) ? ` ${q}⁺` : "⁺";
                        else if (q < 0) label += (q !== -1) ? ` ${Math.abs(q)}⁻` : "⁻";
                    }
                    ctx.fillStyle = (viewMode === 'glass') ? '#FFFFFF' : '#000000';
                    const fontSize = Math.floor(Math.max(10, r * 0.9));
                    ctx.font = `700 ${fontSize}px Inter, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.lineWidth = Math.max(1.5, fontSize * 0.12);
                    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                    ctx.strokeText(label, x, y);
                    if (viewMode === 'glass') {
                        ctx.shadowColor = atomColor; ctx.shadowBlur = 1.25; ctx.fillText(label, x, y);
                        ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 0.5; ctx.fillText(label, x, y);
                        ctx.shadowBlur = 0;
                    } else {
                         ctx.fillText(label, x, y);
                    }
                }
            }
            if (mouse.dragGroup.has(atom.id) || mouse.hoverId === atom.id) {
                ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI * 2); ctx.stroke();
            }
        }
    });

    // Draw Aggregate Molecular Charges
    groups.forEach(g => {
        if (g.count > 1 && Math.abs(g.charge) > 0.1) {
            const p = project(g.cx, g.cy, g.cz, 0);
            if (p) {
                const q = Math.round(g.charge);
                let label = '';
                if (q > 0) label = `+${q}`;
                else if (q < 0) label = `${q}`;
                
                if (Math.abs(g.charge - q) > 0.1 && q === 0) {
                    // Fractional near zero? Or just fractional.
                    label = g.charge > 0 ? `+${g.charge.toFixed(1)}` : `${g.charge.toFixed(1)}`;
                }

                if (label !== '' && label !== '0' && label !== '-0' && label !== '+0') {
                    ctx.font = "bold 14px Inter, sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "top";
                    ctx.fillStyle = "#FFFFFF";
                    ctx.shadowColor = 'rgba(0,0,0,1)';
                    ctx.shadowBlur = 4;
                    // Draw slightly below center
                    ctx.fillText(label, p.x, p.y + 15);
                    ctx.shadowBlur = 0;
                }
            }
        }
    });

    // 7. Particles (FIX: 3D Projection + Additive Blending for Glow)
    if (particles.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; // Additive blending for bright explosions
        particles.forEach(p => {
            // Pass p.z to project
            const proj = project(p.x, p.y, p.z || 0, p.size); 
            
            if (proj) {
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, Math.max(0.1, proj.r), 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }
        });
        ctx.restore();
    }

    // 8. UI Overlay
    if (mouse.dragName && mouse.dragGroup.size > 0) {
        let sumX = 0, minY = Infinity, count = 0;
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
            ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
            ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeText(mouse.dragName, centerX, textY);
            ctx.fillText(mouse.dragName, centerX, textY);
            ctx.shadowBlur = 0;
        }
    }

    // 9. Floating Labels
    if (mouse.floatingLabels.length > 0) {
        mouse.floatingLabels.forEach(label => {
            let sumX = 0, minY = Infinity, count = 0;
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
                if (label.life < label.fadeDuration) opacity = label.life / label.fadeDuration;
                opacity = Math.max(0, Math.min(1, opacity));
                ctx.globalAlpha = opacity;
                ctx.font = "bold 16px Inter, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "alphabetic";
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
                ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                ctx.strokeText(label.text, centerX, textY);
                ctx.fillText(label.text, centerX, textY);
                ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;
            }
        });
    }
    
    ctx.restore();
};
