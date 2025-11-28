
import { Atom, Particle } from '../types';
import { MouseState } from './types';
import { Viewport, ProjectedPoint } from './geometry/Viewport';
import { GraphAnalyzer, MoleculeGroup } from './topology/GraphAnalyzer';
import { AtomRenderer } from './rendering/AtomRenderer';
import { BondRenderer } from './rendering/BondRenderer';

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
        this.drawEnergyGauge(mouse, isMobile);
        this.drawClearanceRing(mouse);
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

    private drawEnergyGauge(mouse: MouseState, isMobile: boolean) {
        if (!this.ctx || !mouse.energyActive) return;
        const ctx = this.ctx;
        const val = mouse.energyValue;
        const target = mouse.energyTarget;

        const scale = isMobile ? 3 : 1;
        const rMain = 30 * scale;
        const rTarget = 40 * scale;
        const yTextOffset = 40 * scale;
        const yReleaseOffset = 50 * scale;
        const lineWidth = 4 * scale;
        const fontPx = 24 * scale;

        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20 * scale;
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${fontPx}px Inter, sans-serif`;
        ctx.textAlign = "center";
        
        // Dynamic Unit Formatting
        let label = '';
        if (val < 0.001) label = `${(val * 1e6).toFixed(0)} eV`;
        else if (val < 1) label = `${(val * 1000).toFixed(0)} keV`;
        else if (val < 1000) label = `${val.toFixed(1)} MeV`;
        else label = `${(val / 1000).toFixed(2)} GeV`;

        ctx.fillText(label, mouse.x, mouse.y - yTextOffset);

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, rMain, 0, Math.PI * 2);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.stroke();

        ctx.beginPath();
        // Logarithmic Gauge Logic
        // Start at 1eV (1e-6 MeV) -> Log = -6
        // Scale up to 400 GeV (4e5 MeV) -> Log = 5.6
        const minLog = -6; 
        const maxLog = 5.6; 
        const currentLog = Math.log10(Math.max(1e-7, val));
        const normalized = (currentLog - minLog) / (maxLog - minLog);
        const angle = Math.max(0, Math.min(1, normalized) * Math.PI * 2); 
        
        ctx.arc(mouse.x, mouse.y, rMain, -Math.PI/2, -Math.PI/2 + angle);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = '#FFD700';
        ctx.stroke();

        if (target) {
            const diff = Math.abs(val - target);
            // Relaxed tolerance for easier hitting (15%)
            if (diff / target < 0.15) {
                ctx.beginPath();
                ctx.arc(mouse.x, mouse.y, rTarget, 0, Math.PI * 2);
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = lineWidth / 2;
                ctx.stroke();
                
                ctx.fillStyle = '#00FF00';
                ctx.font = `bold ${fontPx * 0.5}px Inter, sans-serif`;
                ctx.fillText("RELEASE!", mouse.x, mouse.y + yReleaseOffset);
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

    private drawSceneItems(items: RenderItem[], mouse: MouseState, viewMode: 'solid'|'glass', atomProjMap: Map<string, ProjectedPoint>) {
        if (!this.ctx) return;
        const ctx = this.ctx;

        items.forEach(item => {
            if (item.type === 'bond') {
                BondRenderer.draw(ctx, item.data.a, item.data.b, item.data.pA, item.data.pB, viewMode);
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

        groups.forEach(g => {
            if (g.count > 1 && Math.abs(g.charge) > 0.1) {
                const p = this.viewport!.project(g.cx, g.cy, g.cz, 0);
                if (p) {
                    const q = Math.round(g.charge);
                    let label = '';
                    if (q > 0) label = `+${q}`;
                    else if (q < 0) label = `${q}`;
                    
                    if (Math.abs(g.charge - q) > 0.1 && q === 0) {
                        label = g.charge > 0 ? `+${g.charge.toFixed(1)}` : `${g.charge.toFixed(1)}`;
                    }

                    if (label !== '' && label !== '0' && label !== '-0' && label !== '+0') {
                        ctx.font = "bold 14px Inter, sans-serif";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "top";
                        ctx.fillStyle = "#FFFFFF";
                        ctx.shadowColor = 'rgba(0,0,0,1)';
                        ctx.shadowBlur = 4;
                        ctx.fillText(label, p.x, p.y + 15);
                        ctx.shadowBlur = 0;
                    }
                }
            }
        });
    }

    private drawParticles(particles: Particle[]) {
        if (!this.ctx || particles.length === 0 || !this.viewport) return;
        const ctx = this.ctx;
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; 
        particles.forEach(p => {
            const proj = this.viewport!.project(p.x, p.y, p.z || 0, p.size); 
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

    private drawDragLabels(mouse: MouseState, atomProjMap: Map<string, ProjectedPoint>) {
        if (!this.ctx || !mouse.dragName || mouse.dragGroup.size === 0) return;
        const ctx = this.ctx;

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

    private drawFloatingLabels(mouse: MouseState, atomProjMap: Map<string, ProjectedPoint>) {
        if (!this.ctx || mouse.floatingLabels.length === 0) return;
        const ctx = this.ctx;

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
                
                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.font = "bold 16px Inter, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "alphabetic";
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
                ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                ctx.strokeText(label.text, centerX, textY);
                ctx.fillText(label.text, centerX, textY);
                ctx.restore();
            }
        });
    }
}
