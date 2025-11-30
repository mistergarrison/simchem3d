
import { Atom } from '../../../types/core';
import { COVALENT_Z } from '../../config';
import { getBondOrder } from '../../utils/general';
import { ProjectedPoint } from '../Viewport';

export class BondRenderer {
    static draw(
        ctx: CanvasRenderingContext2D,
        a: Atom,
        b: Atom,
        pA: ProjectedPoint,
        pB: ProjectedPoint,
        viewMode: 'solid' | 'glass'
    ) {
        const order = getBondOrder(a, b.id);
        const isCovalent = COVALENT_Z.has(a.element.z) && COVALENT_Z.has(b.element.z);
        
        const alpha = Math.max(0.1, Math.min(0.8, 1.0 - (pA.depth / 2000))); 
        ctx.strokeStyle = isCovalent ? `rgba(255,255,255,${alpha})` : `rgba(255,255,255,${alpha * 0.3})`;
        ctx.lineWidth = Math.min(pA.r, pB.r) * 0.4;
        if (viewMode === 'glass') ctx.globalAlpha = 0.6;

        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();

        if (order > 1) {
            BondRenderer.drawDoubleTriple(ctx, pA, pB, order);
        }
        ctx.globalAlpha = 1.0; 
    }

    private static drawDoubleTriple(ctx: CanvasRenderingContext2D, pA: ProjectedPoint, pB: ProjectedPoint, order: number) {
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
}
