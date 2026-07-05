"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SupabaseLogo } from "@/components/svgs/supabase-logo";
import { NextLogo } from "@/components/svgs/next-logo";
import { ShadcnLogo } from "@/components/svgs/shadcn-logo";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
    }

    const particles: Particle[] = [];
    let particleCount = 180;

    function getParticleCount() {
      return window.innerWidth < 768 ? 60 : 180;
    }
    const colors = ["#B7B2FF", "#a78bfa", "#c4b5fd", "#818cf8", "#ddd6fe"];

    // Bowyer-Watson Delaunay triangulation
    function triangulate(points: { x: number; y: number }[]) {
      const triangles: number[][] = [];
      if (points.length < 3) return triangles;

      // Super triangle
      const margin = 1000;
      const st = [
        { x: -margin, y: -margin },
        { x: width + margin * 2, y: -margin },
        { x: width / 2, y: height + margin * 2 },
      ];
      const allPts = [...points, ...st];
      const n = points.length;
      const stIdx = [n, n + 1, n + 2];
      const tris: number[][] = [[stIdx[0], stIdx[1], stIdx[2]]];

      for (let i = 0; i < n; i++) {
        const px = allPts[i].x;
        const py = allPts[i].y;
        const edges: number[][] = [];
        const bad: number[] = [];

        for (let t = 0; t < tris.length; t++) {
          const [a, b, c] = tris[t];
          const ax = allPts[a].x, ay = allPts[a].y;
          const bx = allPts[b].x, by = allPts[b].y;
          const cx = allPts[c].x, cy = allPts[c].y;

          const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
          if (Math.abs(d) < 1e-10) continue;
          const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
          const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
          const r2 = (ax - ux) * (ax - ux) + (ay - uy) * (ay - uy);

          if ((px - ux) * (px - ux) + (py - uy) * (py - uy) < r2) {
            bad.push(t);
            edges.push([a, b], [b, c], [c, a]);
          }
        }

        // Remove bad triangles
        for (let k = bad.length - 1; k >= 0; k--) {
          tris.splice(bad[k], 1);
        }

        // Find unique edges (boundary of polygon hole)
        const unique: number[][] = [];
        for (let e = 0; e < edges.length; e++) {
          let dup = false;
          for (let f = 0; f < edges.length; f++) {
            if (e !== f && edges[e][0] === edges[f][1] && edges[e][1] === edges[f][0]) {
              dup = true;
              break;
            }
          }
          if (!dup) unique.push(edges[e]);
        }

        for (const edge of unique) {
          tris.push([edge[0], edge[1], i]);
        }
      }

      // Remove triangles with super triangle vertices
      for (let t = tris.length - 1; t >= 0; t--) {
        if (tris[t].some((idx) => idx >= n)) {
          tris.splice(t, 1);
        }
      }

      return tris;
    }

    function resize() {
      width = canvas!.parentElement?.offsetWidth || window.innerWidth;
      height = canvas!.parentElement?.offsetHeight || window.innerHeight;
      canvas!.width = width * window.devicePixelRatio;
      canvas!.height = height * window.devicePixelRatio;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function createParticles() {
      particleCount = getParticleCount();
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.5 + 0.4,
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      // Update particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      // Delaunay triangulation
      const tris = triangulate(particles);

      // Draw triangles
      for (const tri of tris) {
        const a = particles[tri[0]];
        const b = particles[tri[1]];
        const c = particles[tri[2]];

        // Edge lengths for opacity (shorter edges = more opaque)
        const edges = [
          { x1: a.x, y1: a.y, x2: b.x, y2: b.y },
          { x1: b.x, y1: b.y, x2: c.x, y2: c.y },
          { x1: c.x, y1: c.y, x2: a.x, y2: a.y },
        ];

        for (const edge of edges) {
          const dist = Math.sqrt((edge.x2 - edge.x1) ** 2 + (edge.y2 - edge.y1) ** 2);
          const maxDist = 200;
          if (dist > maxDist) continue;
          const opacity = (1 - dist / maxDist) * 0.5;
          ctx!.beginPath();
          ctx!.strokeStyle = `rgba(183, 178, 255, ${opacity})`;
          ctx!.lineWidth = 0.8;
          ctx!.moveTo(edge.x1, edge.y1);
          ctx!.lineTo(edge.x2, edge.y2);
          ctx!.stroke();
        }

        // Subtle fill for close triangles
        const cx = (a.x + b.x + c.x) / 3;
        const cy = (a.y + b.y + c.y) / 3;
        const avgDist = (
          Math.sqrt((a.x - cx) ** 2 + (a.y - cy) ** 2) +
          Math.sqrt((b.x - cx) ** 2 + (b.y - cy) ** 2) +
          Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2)
        ) / 3;

        if (avgDist < 100) {
          const fillOpacity = (1 - avgDist / 100) * 0.1;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.lineTo(c.x, c.y);
          ctx!.closePath();
          ctx!.fillStyle = `rgba(183, 178, 255, ${fillOpacity})`;
          ctx!.fill();
        }
      }

      // Draw dots
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = p.alpha;
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

function GlitchText() {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 400);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block px-10 py-3 bg-[#B7B2FF] text-white rounded-full italic relative">
      <span className={glitching ? "glitch-active" : ""} data-text="VibeBase">
        VibeBase
      </span>
      <style jsx>{`
        .glitch-active {
          position: relative;
          animation: glitch 0.4s ease-in-out;
        }
        .glitch-active::before,
        .glitch-active::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .glitch-active::before {
          animation: glitch-shift-1 0.4s ease-in-out;
          color: #ff6bff;
          mix-blend-mode: screen;
          clip-path: inset(20% 0 30% 0);
        }
        .glitch-active::after {
          animation: glitch-shift-2 0.4s ease-in-out;
          color: #00ffff;
          mix-blend-mode: screen;
          clip-path: inset(50% 0 10% 0);
        }
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          10% { transform: translate(-3px, 2px); }
          20% { transform: translate(3px, -1px); }
          30% { transform: translate(-2px, -2px); }
          40% { transform: translate(2px, 1px); }
          50% { transform: translate(-1px, 2px); }
          60% { transform: translate(3px, -1px); }
          70% { transform: translate(-2px, 1px); }
          80% { transform: translate(1px, -2px); }
          90% { transform: translate(-1px, 1px); }
        }
        @keyframes glitch-shift-1 {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-4px, 1px); }
          40% { transform: translate(4px, -2px); }
          60% { transform: translate(-3px, 1px); }
          80% { transform: translate(2px, -1px); }
        }
        @keyframes glitch-shift-2 {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(3px, -1px); }
          40% { transform: translate(-4px, 2px); }
          60% { transform: translate(2px, -1px); }
          80% { transform: translate(-3px, 2px); }
        }
      `}</style>
    </span>
  );
}

export function HeroNew() {
  return (
    <section className="relative pt-36 pb-20 md:pt-44 md:pb-24 bg-[#F9F9FB] overflow-hidden">
      <ParticleCanvas />

      <motion.div
        className="relative max-w-7xl mx-auto px-6 text-center" style={{ zIndex: 1 }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#111]">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-tight text-[#111]">
              v1.0.2 현재 사이트 오픈 준비중 입니다.
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-6xl md:text-8xl font-black tracking-tight mb-8 text-[#111]"
        >
          <span className="block leading-[1.1] mb-4">Agentic coding with</span>
          <span className="relative inline-block">
            <GlitchText />
            <span
              className="absolute -top-3 -left-4 text-white text-base font-bold px-5 py-1.5 -rotate-12 shadow-lg whitespace-nowrap"
              style={{
                background: "#111",
                clipPath: "polygon(4% 0%, 96% 0%, 100% 25%, 98% 50%, 100% 75%, 96% 100%, 4% 100%, 0% 75%, 2% 50%, 0% 25%)",
              }}
            >
              김플립의
            </span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="max-w-2xl mx-auto text-xl md:text-2xl text-[#111] font-medium mb-3 leading-snug"
        >
          1인 창업용 SaaS 스타터킷 에센셜 소스 <span className="px-1 bg-[#7FFF00]/70 rounded">무료로 배포</span> 중.
        </motion.p>
        <motion.p
          variants={itemVariants}
          className="max-w-2xl mx-auto text-xl md:text-2xl text-[#111] font-medium mb-12 leading-snug"
        >
          복붙해서 만들든, 뜯어보며 배우든 그건 당신 마음. 😁
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-10 py-5 bg-[#111] text-white rounded-full font-bold text-lg hover:scale-105 transition-transform"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            지금 배우러가기
          </Link>
          <Link
            href="/download"
            className="inline-flex items-center gap-2 px-10 py-5 bg-white border border-[#111] text-[#111] rounded-full font-bold text-lg hover:scale-105 transition-transform"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            소스 무료다운로드
          </Link>
        </motion.div>

        {/* Hero Visual - Browser Preview */}
        <motion.div
          variants={itemVariants}
          className="relative max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-[2.5rem] p-4 shadow-[0_40px_100px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Browser Dots */}
            <div className="flex items-center gap-2 mb-4 px-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            {/* Demo Video */}
            <div className="rounded-2xl overflow-hidden">
              <video
                src="/vibebase-demo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              />
            </div>
          </div>
        </motion.div>

        {/* Tech Stack Logos */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-16 mb-8 opacity-70 hover:opacity-100 transition-opacity"
        >
          <a href="https://supabase.com/" target="_blank" rel="noreferrer" className="hover:scale-105 transition-transform">
            <SupabaseLogo />
          </a>
          <span className="border-l border-[#B7B2FF]/30 h-6 rotate-12" />
          <a href="https://nextjs.org/" target="_blank" rel="noreferrer" className="hover:scale-105 transition-transform">
            <NextLogo />
          </a>
          <span className="border-l border-[#B7B2FF]/30 h-6 rotate-12" />
          <a href="https://ui.shadcn.com/" target="_blank" rel="noreferrer" className="hover:scale-105 transition-transform">
            <div className="flex items-center gap-2">
              <ShadcnLogo />
              <span className="font-bold text-lg text-[#111]">shadcn/ui</span>
            </div>
          </a>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-indigo-400" />
            <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-teal-400 to-emerald-400" />
            <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-cyan-400 to-teal-400" />
          </div>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0" aria-hidden="true">
              <path
                fill="#FF0000"
                d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z"
              />
              <path fill="#fff" d="M9.6 15.6V8.4l6.4 3.6-6.4 3.6z" />
            </svg>
            <p className="text-xs font-semibold text-[#111]">
              1만 2천명의 구독자가 함께하고 있습니다
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
