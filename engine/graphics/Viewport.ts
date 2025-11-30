
import { WORLD_SCALE, FOV } from '../config';

export interface ProjectedPoint {
    x: number;
    y: number;
    scale: number;
    depth: number;
    r: number; // Projected radius
}

/**
 * Handles the mathematical mapping between World Space (3D Simulation) 
 * and Screen Space (2D Canvas).
 */
export class Viewport {
    public width: number = 0;
    public height: number = 0;
    public dpr: number = 1;
    
    // Calculated values
    private worldW: number = 0;
    private worldH: number = 0;
    private cx: number = 0;
    private cy: number = 0;
    private worldCx: number = 0;
    private worldCy: number = 0;
    private zoom: number = 1;

    constructor() {
        this.zoom = 1 / WORLD_SCALE;
    }

    /**
     * Updates the viewport dimensions based on the canvas size.
     */
    public update(canvasWidth: number, canvasHeight: number, devicePixelRatio: number) {
        this.dpr = devicePixelRatio || 1;
        // Input dimensions are already in logical (CSS) pixels.
        this.width = canvasWidth; 
        this.height = canvasHeight;

        this.worldW = this.width * WORLD_SCALE;
        this.worldH = this.height * WORLD_SCALE;
        
        this.cx = this.width / 2;
        this.cy = this.height / 2;
        
        this.worldCx = this.worldW / 2;
        this.worldCy = this.worldH / 2;
    }

    /**
     * Projects a 3D atom position + radius to 2D screen coordinates.
     */
    public project(x: number, y: number, z: number, radius: number = 0): ProjectedPoint | null {
        const dx = x - this.worldCx;
        const dy = y - this.worldCy;
        const dz = z;

        const zz_final = dz * this.zoom;
        const SAFE_THRESHOLD = FOV - 200;
        
        // Near plane clipping
        if (zz_final > SAFE_THRESHOLD) return null; 

        const pScale = FOV / (FOV - zz_final);
        
        // Perspective projection
        const zx_final = dx * this.zoom;
        const zy_final = dy * this.zoom;

        const sx = this.cx + zx_final * pScale;
        const sy = this.cy + zy_final * pScale;
        const projectedRadius = (radius * this.zoom) * pScale;

        return { 
            x: sx, 
            y: sy, 
            scale: pScale, 
            depth: zz_final,
            r: projectedRadius
        };
    }

    /**
     * Unprojects a 2D screen coordinate to a 3D world position at a specific Z-depth.
     */
    public unproject(screenX: number, screenY: number, targetZ: number): { x: number, y: number } {
        if (this.width === 0 || this.height === 0) return { x: 0, y: 0 };

        const pScale = FOV / (FOV - targetZ * this.zoom);
        
        // Reverse the projection math
        const dx = (screenX - this.cx) / (this.zoom * pScale);
        const dy = (screenY - this.cy) / (this.zoom * pScale);
        
        return { 
            x: this.worldCx + dx, 
            y: this.worldCy + dy 
        };
    }

    public getWorldDimensions() {
        return { w: this.worldW, h: this.worldH };
    }
}
