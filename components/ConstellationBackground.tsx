/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';

type ConstellationBackgroundProps = {
  className?: string;
  opacity?: number;
};

// Simplified coordinate maps for specific constellations (Relative coordinates 0-1)
// Capricorn (approximate goat horn shape)
const CAPRICORN = [
    {x:0.2, y:0.2}, {x:0.3, y:0.15}, {x:0.4, y:0.2}, {x:0.35, y:0.3}, {x:0.25, y:0.35}, 
    {x:0.15, y:0.3}, {x:0.1, y:0.4}, {x:0.45, y:0.25}, {x:0.5, y:0.1}
];

// Cancer (approximate inverted Y shape)
const CANCER = [
    {x:0.5, y:0.5}, {x:0.4, y:0.6}, {x:0.6, y:0.6}, {x:0.5, y:0.7}, {x:0.5, y:0.4}
];

export default function ConstellationBackground({
  className,
  opacity = 1,
}: ConstellationBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const ctx = el.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stopped = false;
    let time = 0;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    setTimeout(resize, 0);

    // Star Class
    class Star {
        x: number;
        y: number;
        baseSize: number;
        phase: number;
        flickerSpeed: number;
        
        constructor(w: number, h: number, x?: number, y?: number) {
            this.x = x ?? Math.random() * w;
            this.y = y ?? Math.random() * h;
            this.baseSize = Math.random() * 1.5 + 0.5;
            // Random phase so stars don't twinkle in sync
            this.phase = Math.random() * Math.PI * 2;
            // Speed of the sine wave oscillation - Slower for smoother effect
            this.flickerSpeed = 0.2 + Math.random() * 0.6;
        }

        draw(ctx: CanvasRenderingContext2D, t: number) {
            // Calculate smooth sine wave based on global time and individual speed/phase
            const sineValue = Math.sin(t * this.flickerSpeed + this.phase);
            
            // Map sine (-1 to 1) to a tighter opacity range (e.g., 0.5 to 0.9)
            // This prevents stars from disappearing completely or flickering too harshly
            const alpha = 0.5 + ((sineValue + 1) / 2) * 0.4;
            
            // Subtle size pulsation linked to brightness - reduced intensity
            const currentSize = this.baseSize * (0.95 + ((sineValue + 1) / 2) * 0.1);

            ctx.fillStyle = `rgba(220, 220, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Optional: Add a very faint glow to brighter stars
            if (alpha > 0.8) {
                ctx.shadowBlur = 3;
                ctx.shadowColor = `rgba(200, 200, 255, ${alpha * 0.4})`;
            } else {
                ctx.shadowBlur = 0;
            }
        }
    }

    // Line (Root) Class
    class RootConnection {
        startStar: Star;
        endStar: Star;
        progress: number;
        speed: number;
        maxDist: number;

        constructor(s1: Star, s2: Star, dist: number) {
            this.startStar = s1;
            this.endStar = s2;
            this.maxDist = dist;
            this.progress = 0;
            // Speed inversely proportional to distance for organic feel
            this.speed = (0.5 + Math.random() * 0.5) * (100 / dist); 
        }

        update() {
            if (this.progress < 100) {
                this.progress += this.speed;
            }
        }

        draw(ctx: CanvasRenderingContext2D) {
            if (this.progress <= 0) return;
            
            const dx = this.endStar.x - this.startStar.x;
            const dy = this.endStar.y - this.startStar.y;
            
            const currentX = this.startStar.x + (dx * (this.progress / 100));
            const currentY = this.startStar.y + (dy * (this.progress / 100));

            // Significantly reduced alpha for "barely visible" look
            const alpha = 0.08 * (this.progress / 100);
            
            ctx.strokeStyle = `rgba(200, 200, 255, ${alpha})`; 
            ctx.lineWidth = 0.4; // Thinner lines
            
            // Soft glow
            ctx.shadowBlur = 2; 
            ctx.shadowColor = `rgba(220, 220, 255, ${alpha * 0.5})`;
            
            ctx.beginPath();
            ctx.moveTo(this.startStar.x, this.startStar.y);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            
            ctx.shadowBlur = 0;
        }
    }

    let stars: Star[] = [];
    let roots: RootConnection[] = [];

    const initSimulation = () => {
        stars = [];
        roots = [];
        const { width, height } = container.getBoundingClientRect();
        
        // 1. Add specific Constellations
        // Offset them randomly on screen
        const addConstellation = (pattern: {x:number, y:number}[], scale: number, offsetX: number, offsetY: number) => {
            const constellationStars: Star[] = [];
            pattern.forEach(p => {
                const s = new Star(width, height, (p.x * scale) + offsetX, (p.y * scale) + offsetY);
                stars.push(s);
                constellationStars.push(s);
            });
            
            // Connect constellation stars sequentially
            for(let i=0; i<constellationStars.length - 1; i++) {
                 const dist = Math.hypot(constellationStars[i].x - constellationStars[i+1].x, constellationStars[i].y - constellationStars[i+1].y);
                 roots.push(new RootConnection(constellationStars[i], constellationStars[i+1], dist));
            }
        };

        addConstellation(CAPRICORN, 300, width * 0.1, height * 0.1);
        addConstellation(CANCER, 300, width * 0.6, height * 0.5);

        // 2. Add Random Background Stars
        const numStars = Math.floor((width * height) / 9000);
        for (let i = 0; i < numStars; i++) {
            stars.push(new Star(width, height));
        }

        // 3. Connect random close stars to form "Roots"
        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                const dist = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
                if (dist < 120) { // Connection threshold
                    // Random chance to connect to create "paths" rather than a mesh
                    if (Math.random() > 0.7) { 
                        roots.push(new RootConnection(stars[i], stars[j], dist));
                    }
                }
            }
        }
    };

    window.addEventListener("resize", initSimulation);
    initSimulation();

    const draw = () => {
      if (stopped) return;
      
      const { width, height } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      
      // Update global time for simulation - Slowed down for smoother animation
      time += 0.025;

      ctx.save();
      
      // Draw Roots first (behind stars)
      roots.forEach(r => {
          r.update();
          r.draw(ctx);
      });

      // Draw Stars with time parameter for animation
      stars.forEach(s => {
          s.draw(ctx, time);
      });
      
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", initSimulation);
      ro.disconnect();
    };
  }, []);

  return (
    <div 
        ref={containerRef} 
        className={className} 
        style={{ 
            position: "absolute", 
            inset: 0, 
            zIndex: 0, 
            pointerEvents: 'none',
            opacity: opacity,
            transition: 'opacity 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)' 
        }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}