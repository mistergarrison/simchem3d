
import { Atom, Particle } from '../../types/core';
import { MouseState } from '../../types/ui';
import { Viewport, ProjectedPoint } from './Viewport';
import { GraphAnalyzer, MoleculeGroup } from '../algorithms/topology/GraphAnalyzer';
import { AtomRenderer } from './painters/AtomRenderer';
import { BondRenderer } from './painters/BondRenderer';

interface RenderItem {
    type: 'atom' | 'bond';
    depth: number;
    data: any;
}

export class SceneRenderer {
    private ctx: CanvasRenderingContext2D | null = null;
    private viewport: Viewport | null = null;

    constructor() {}

    public render(
        ctx: CanvasRenderingContext2D,
        atoms: Atom[],
        particles: Particle[],
        mouse: MouseState,
        viewport: Viewport,
        showBonds: boolean,
        viewMode: 'solid' | 'glass', 
        dragStart: {x: number, y: number, time: number} | null,
        energyCap: number,
        isMobile: boolean = false
    ) {
        this.ctx = ctx;
        this.viewport = viewport;

        // 0. Handle High-DPI Scaling & Clear
        ctx.save();
        ctx.scale(viewport.dpr, viewport.dpr);
        ctx.fillStyle = '#0b0f19'; 
        ctx.fillRect(0, 0, viewport.width, viewport.height);
        ctx.lineCap = "round";

        // 1. Draw UI Layers (Bottom)
        this.drawLasso(mouse);
        this.drawLaunchDrag(mouse, dragStart);
        this.drawEnergyGauge(mouse, isMobile, energyCap);
        this.drawClearanceRing(mouse);
        this.drawCompressionRing(mouse);
        this.drawMoleculeHalo(mouse);

        // 2. Prepare Scene Graph (Projection & Sorting)
        const { items, atomProjMap, groups } = this.prepareScene(atoms, showBonds);

        // 3. Draw Scene (Sorted by Depth)
        this.drawSceneItems(items, mouse, viewMode, atomProjMap);
        this.drawGroupCharges(groups);

        // 4. Draw Particles (Additive)
        this.drawParticles(particles);

        // 5. Draw UI Overlay (Top)
        this.drawDragLabels(mouse, atomProjMap);
        this.drawFloatingLabels(mouse, atomProjMap);

        ctx.restore();
    }

    private drawLasso(mouse: MouseState) {
        if (!this.ctx || !mouse.isLassoing || mouse.lassoPoints.length === 0) return;
        
        const ctx = this.ctx;
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

    private drawLaunchDrag(mouse: MouseState, dragStart: {x: number, y: number, time: number} | null) {
        if (!this.ctx || !dragStart) return;
        const ctx = this.ctx;

        const dt = Date.now() - dragStart.time;
        const charge = Math.min(dt / 4000, 1.0); 

        // Aim Line
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

        // Color ramp
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

        // Lightning / Tension Effect
        if (charge > 0.6) {
            this.drawLightning(dragStart, mouse, charge, `rgba(${r}, ${g}, ${b}, 0.8)`);
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
    }

    private drawLightning(start: {x:number, y:number}, end: {x:number, y:number}, charge: number, color: string) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        
        const draw = (width: number, stroke: string, seedOffset: number) => {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            
            const mainDx = end.x - start.x;
            const mainDy = end.y - start.y;
            const mainLen = Math.sqrt(mainDx*mainDx + mainDy*mainDy) || 1;
            const normX = -mainDy / mainLen;
            const normY = mainDx / mainLen;
            
            const segments = 15 + Math.floor(charge * 10);

            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const tx = start.x + mainDx * t;
                const ty = start.y + mainDy * t;
                const jitter = (Math.sin(i * 132.1 + Date.now() * 0.1 + seedOffset) + (Math.random() - 0.5)) * charge * 20;
                
                ctx.lineTo(tx + normX*jitter, ty + normY*jitter);
            }
            ctx.lineTo(end.x, end.y);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            ctx.stroke();
        };
        
        draw(4 + charge * 4, color, 0);
        ctx.shadowBlur = 0;
        draw(2, '#FFFFFF', 0.5);
    }

    private drawEnergyGauge(mouse: MouseState, isMobile: boolean, energyCap: number) {
        if (!this.ctx || !mouse.energyActive) return;
        const ctx = this.ctx;
        const val = mouse.energyValue;
        const target = mouse.energyTarget;
        const isStrained = mouse.energyStrain;

        // Apply Jitter if strained
        let gx = mouse.x;
        let gy = mouse.y;
        if (isStrained) {
            gx += (Math.random() - 0.5) * 6;
            gy += (Math.random() - 0.5) * 6;
        }

        // Gauge Sizing: Desktop is significantly smaller than mobile
        const radius = isMobile ? 50 : 16;
        const lineWidth = isMobile ? 8 : 4;
        const fontSize = isMobile ? 24 : 12;
        const labelOffset = isMobile ? 90 : 35;
        const targetRadius = isMobile ? 70 : 24;

        ctx.shadowColor = isStrained ? '#FF0000' : '#FFD700'; 
        ctx.shadowBlur = isMobile ? 20 : 10;
        ctx.fillStyle = isStrained ? '#FF4444' : '#FFD700';
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        
        // Dynamic Unit Formatting
        let label = '';
        if (val < 0.001) label = `${(val * 1e6).toFixed(0)} eV`;
        else if (val < 1) label = `${(val * 1000).toFixed(0)} keV`;
        else if (val < 1000) label = `${val.toFixed(1)} MeV`;
        else label = `${(val / 1000).toFixed(2)} GeV`;

        // Render Value Text ABOVE the gauge
        ctx.fillText(label, gx, gy - labelOffset);
        
        if (isStrained) {
            ctx.font = `bold ${fontSize * 0.7}px Inter, sans-serif`;
            ctx.fillStyle = '#FF0000';
            ctx.fillText("LIMIT REACHED", gx, gy - labelOffset - (isMobile ? 25 : 15));
        }

        // --- GAUGE ARC (270 degrees) ---
        // Gap at the bottom (90 degrees / South)
        // Start: 135 degrees (South-East) -> 0.75 PI
        // End: 405 degrees (South-West) -> 2.25 PI
        const startAngle = 0.75 * Math.PI; 
        const endAngle = 2.25 * Math.PI;   
        const totalSpan = endAngle - startAngle;

        // Logarithmic Fill Calculations
        const minLog = -6; // 10^-6 MeV (1 eV)
        const maxLog = 5.6; // 10^5.6 MeV (~400 GeV)
        
        const getNormalized = (v: number) => {
            const safeV = Math.max(1e-7, v);
            const logV = Math.log10(safeV);
            return Math.max(0, Math.min(1, (logV - minLog) / (maxLog - minLog)));
        };

        const currentNorm = getNormalized(val);
        const currentFillEnd = startAngle + (currentNorm * totalSpan);
        
        const capNorm = getNormalized(energyCap);
        const capAngle = startAngle + (capNorm * totalSpan);

        // 1. Draw Background Track
        ctx.beginPath();
        ctx.arc(gx, gy, radius, startAngle, endAngle);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = isStrained ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 215, 0, 0.2)';
        ctx.stroke();

        // 2. Draw Active Fill
        ctx.beginPath();
        ctx.arc(gx, gy, radius, startAngle, currentFillEnd);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = isStrained ? '#FF0000' : '#FFD700';
        ctx.stroke();

        // 3. Draw Cap Limit Marker (if reachable)
        if (energyCap < 400000) {
            const cx = gx + Math.cos(capAngle) * (radius + lineWidth);
            const cy = gy + Math.sin(capAngle) * (radius + lineWidth);
            const cx2 = gx + Math.cos(capAngle) * (radius - lineWidth);
            const cy2 = gy + Math.sin(capAngle) * (radius - lineWidth);
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx2, cy2);
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Target Indicator
        if (target) {
            const diff = Math.abs(val - target);
            if (diff / target < 0.15 && !isStrained) {
                // Lock feedback
                ctx.beginPath();
                ctx.arc(gx, gy, targetRadius, startAngle, endAngle);
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                if (isMobile) {
                    ctx.fillStyle = '#00FF00';
                    ctx.fillText("RELEASE!", gx, gy - labelOffset - 30);
                }
            }
        }
        ctx.shadowBlur = 0;
    }

    private drawClearanceRing(mouse: MouseState) {
        if (!this.ctx || !mouse.clearance || !mouse.clearance.active || !this.viewport) return;
        const c = mouse.clearance;
        const progress = 1 - (c.life / c.maxLife);
        const p = this.viewport.project(c.cx, c.cy, 0, c.maxRadius * progress); 

        if (p) {
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${1.0 - progress})`;
            this.ctx.lineWidth = 4 * (1 - progress);
            this.ctx.beginPath();
            this.ctx.ellipse(p.x, p.y, p.r, p.r, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.05 * (1 - progress)})`;
            this.ctx.fill();
        }
    }

    private drawCompressionRing(mouse: MouseState) {
        if (!this.ctx || !mouse.compression || !mouse.compression.active || !this.viewport) return;
        const c = mouse.compression;
        const p = this.viewport.project(c.cx, c.cy, 0, c.currentRadius);

        if (p) {
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([10, 5]); 
            this.ctx.beginPath();
            this.ctx.ellipse(p.x, p.y, p.r, p.r, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
            this.ctx.fill();
        }
    }

    private drawMoleculeHalo(mouse: MouseState) {
        if (!this.ctx || mouse.moleculeHaloLife <= 0 || !this.viewport) return;
        const life = mouse.moleculeHaloLife;
        const max = mouse.moleculeHaloMaxLife;
        const ratio = life / max;
        
        const mcx = mouse.moleculeTarget?.cx || 0;
        const mcy = mouse.moleculeTarget?.cy || 0;
        
        const startR = mouse.moleculeTarget?.startRadius || 200;
        const endR = 50;
        const currentR = endR + (startR - endR) * ratio;

        const p = this.viewport.project(mcx, mcy, 0, currentR);

        if (p) {
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${Math.min(1, ratio + 0.2)})`;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([10, 5]); 
            this.ctx.beginPath();
            this.ctx.ellipse(p.x, p.y, p.r, p.r, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    private prepareScene(atoms: Atom[], showBonds: boolean) {
        // Use Topology Analyzer to determine groups (connectivity and charge)
        const { groups, atomGroupMap } = GraphAnalyzer.analyze(atoms);

        // Project Atoms
        const renderList = atoms.map(a => {
            if (!a || !this.viewport) return null;
            const p = this.viewport.project(a.x, a.y, a.z, a.radius);
            if (!p) return null; 
            return { atom: a, proj: p };
        }).filter((item): item is NonNullable<typeof item> => item !== null);

        const atomProjMap = new Map<string, ProjectedPoint>();
        renderList.forEach(item => atomProjMap.set(item.atom.id, item.proj));

        // Build Render Queue
        const items: RenderItem[] = [];
        renderList.forEach(item => {
            items.push({ 
                type: 'atom', 
                depth: item.proj.depth, 
                data: { ...item, groupIndex: atomGroupMap.get(item.atom.id), groups } 
            });
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

                    const pA = atomProjMap.get(a.id);
                    const pB = atomProjMap.get(b.id);
                    
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

        return { items, atomProjMap, groups };
    }

    private drawSceneItems(items: RenderItem[], mouse: MouseState, viewMode: 'solid' | 'glass', atomProjMap: Map<string, ProjectedPoint>) {
        if (!this.ctx) return;
        const ctx = this.ctx;

        items.forEach(item => {
            if (item.type === 'bond') {
                const { a, b, pA, pB } = item.data;
                BondRenderer.draw(ctx, a, b, pA, pB, viewMode);
            } else {
                const { atom, proj, groupIndex, groups } = item.data;
                const group = groupIndex !== undefined ? groups[groupIndex] : undefined;
                AtomRenderer.draw(ctx, atom, proj, group, mouse, viewMode);
            }
        });
    }

    private drawGroupCharges(groups: MoleculeGroup[]) {
        if (!this.ctx || !this.viewport) return;
        const ctx = this.ctx;

        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        groups.forEach(g => {
            // Only draw net charge label if it's non-neutral and has multiple atoms
            if (g.count > 1 && Math.abs(g.charge) > 0.01) {
                const p = this.viewport.project(g.cx, g.cy, g.cz, 0);
                if (p) {
                    const chg = Math.round(g.charge);
                    if (chg === 0) return; // Don't show partial floating charges, only integer nets
                    
                    const str = chg > 0 ? `+${chg}` : `${chg}`;
                    const color = chg > 0 ? '#FF3333' : '#3388FF';
                    
                    ctx.fillStyle = color;
                    ctx.shadowColor = 'black';
                    ctx.shadowBlur = 4;
                    ctx.fillText(str, p.x + 15, p.y - 15);
                    ctx.shadowBlur = 0;
                }
            }
        });
    }

    private drawParticles(particles: Particle[]) {
        if (!this.ctx || !this.viewport) return;
        const ctx = this.ctx;
        
        // Additive blending for particles
        ctx.globalCompositeOperation = 'lighter';

        particles.forEach(p => {
            const proj = this.viewport!.project(p.x, p.y, p.z, p.size);
            if (proj) {
                const alpha = p.life / p.maxLife;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = alpha;
                
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, proj.r, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
    }

    private drawDragLabels(mouse: MouseState, atomProjMap: Map<string, ProjectedPoint>) {
        if (!this.ctx || !mouse.dragId || !mouse.dragName) return;
        
        // If dragging, show the molecule name above the cursor
        const p = atomProjMap.get(mouse.dragId);
        if (p) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'black';
            this.ctx.shadowBlur = 4;
            this.ctx.fillText(mouse.dragName, p.x, p.y - p.r - 15);
            this.ctx.shadowBlur = 0;
        }
    }

    private drawFloatingLabels(mouse: MouseState, atomProjMap: Map<string, ProjectedPoint>) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px Inter, sans-serif';

        mouse.floatingLabels.forEach(label => {
            const p = atomProjMap.get(label.targetId);
            if (p) {
                let alpha = 1.0;
                if (label.life < label.fadeDuration) {
                    alpha = label.life / label.fadeDuration;
                }
                
                const yOffset = 40; // Fixed vertical offset (Stationary relative to atom)

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 4;
                ctx.fillText(label.text, p.x, p.y - p.r - yOffset);
                ctx.restore();
            }
        });
    }
}
