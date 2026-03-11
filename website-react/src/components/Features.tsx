"use client";

import { motion } from "framer-motion";
import { GlowingEffectDemo } from "@/components/ui/glowing-effect-demo";

export default function Features() {
  return (
    <section id="features" className="py-[120px]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-900">五大核心功能</h2>
          <p className="text-base md:text-lg text-neutral-600 max-w-[600px] mx-auto leading-relaxed">
            深度整合 AI 能力，为您提供最专业的翻译工作流
          </p>
        </motion.div>

        <GlowingEffectDemo />
      </div>
    </section>
  );
}
