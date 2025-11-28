
import { Atom } from '../../types';
import { ProjectedPoint } from '../geometry/Viewport';
import { MoleculeGroup } from '../topology/GraphAnalyzer';
import { MouseState } from '../types';

export class AtomRenderer {
    static draw(
        ctx: CanvasRenderingContext2D, 
        atom: Atom, 
        proj: ProjectedPoint, 
        group: MoleculeGroup | undefined, 
        mouse: MouseState, 
        viewMode: 'solid' | 'glass'
    ) {
        const { x, y, r } = proj;
        
        const isElectron = atom.element.z === -1;
        const isBareProton = atom.element.z === 1 && atom.charge === 1 && atom.mass < 1.6 && atom.bonds.length === 0;
        const atomColor = isBareProton ? '#FF3333' : atom.element.c;
        
        let labelText = atom.element.s;
        if (atom.element.z === 1 && !isBareProton) labelText = "H";

        if (isElectron) {
            AtomRenderer.drawElectron(ctx, x, y, r);
        } else {
            AtomRenderer.drawNucleus(ctx, x, y, r, atomColor, viewMode);

            if (r > 5) { 
                AtomRenderer.drawLabel(ctx, x, y, r, atom, labelText, group, isBareProton, viewMode);
            }
        }
        
        // Highlight logic
        if (mouse.dragGroup.has(atom.id) || (mouse.hoverGroup && mouse.hoverGroup.has(atom.id))) {
            ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI * 2); ctx.stroke();
        }
    }

    private static drawElectron(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
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
    }

    private static drawNucleus(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, viewMode: 'solid' | 'glass') {
        if (viewMode === 'solid') {
            const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r * 0.2, x, y, r);
            grad.addColorStop(0, color); 
            grad.addColorStop(1, 'black'); 
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); ctx.fill();
            
            const shine = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 0, x, y, Math.max(0.1, r));
            shine.addColorStop(0, 'rgba(255,255,255,0.7)');
            shine.addColorStop(0.3, 'rgba(255,255,255,0.1)');
            shine.addColorStop(1, 'rgba(0,0,0,0.4)');
            ctx.fillStyle = shine; ctx.fill();
        } else {
            const hex = color;
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
    }

    private static drawLabel(
        ctx: CanvasRenderingContext2D, 
        x: number, y: number, r: number, 
        atom: Atom, 
        labelText: string, 
        group: MoleculeGroup | undefined, 
        isBareProton: boolean, 
        viewMode: 'solid' | 'glass'
    ) {
        let label = labelText;
        const isQuark = atom.element.z === 1000;
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
            ctx.shadowColor = atom.element.c; ctx.shadowBlur = 1.25; ctx.fillText(label, x, y);
            ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 0.5; ctx.fillText(label, x, y);
            ctx.shadowBlur = 0;
        } else {
             ctx.fillText(label, x, y);
        }
    }
}
