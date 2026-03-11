"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Install from "@/components/Install";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";

export default function Home() {
  return (
    <main className="relative">
      {/* 第一屏 - 带 Background Ripple 效果 */}
      <div className="relative min-h-screen overflow-hidden">
        <BackgroundRippleEffect />
        <Navbar />
        <Hero />
      </div>
      
      {/* 后续内容 - 白色背景 */}
      <div className="bg-white">
        <Features />
        <Pricing />
        <Install />
        <FAQ />
        <Footer />
      </div>
    </main>
  );
}
