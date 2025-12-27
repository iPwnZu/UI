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
        size: number;
        brightness: number;
        flickerSpeed: number;
        
        constructor(w: number, h: number, x?: number, y?: number) {
            this.x = x ?? Math.random() * w;
            this.y = y ?? Math.random() * h;
            this.size = Math.random() * 1.5 + 0.5;
            this.brightness = Math.random();
            this.flickerSpeed = 0.02 + Math.random() * 0.05;
        }

        update() {
            this.brightness += this.flickerSpeed;
            if (this.brightness > 1 || this.brightness < 0.2) {
                this.flickerSpeed *= -1;
            }
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = `rgba(200, 200, 255, ${Math.abs(this.brightness)})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
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

            const alpha = 0.15 * (this.progress / 100);
            
            ctx.strokeStyle = `rgba(180, 100, 255, ${alpha})`; // Deep purple glow
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(this.startStar.x, this.startStar.y);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
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
      
      // Drift effect
      time += 0.05;
      ctx.save();
      // Subtle rotation/pan for the whole universe
      // ctx.translate(width/2, height/2);
      // ctx.rotate(time * 0.0002);
      // ctx.translate(-width/2, -height/2);

      // Draw Roots first (behind stars)
      roots.forEach(r => {
          r.update();
          r.draw(ctx);
      });

      // Draw Stars
      stars.forEach(s => {
          s.update();
          s.draw(ctx);
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
  }, [opacity]);

  return (
    <div ref={containerRef} className={className} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}