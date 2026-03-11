"use client";

import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="py-16 bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 font-bold text-lg text-neutral-900 mb-4">
            <img src="/assets/logo_web.svg" alt="Logo" className="h-7 w-auto" />
            <span>即时翻译</span>
          </div>
          
          <p className="text-neutral-600 mb-6 text-sm">
            集成 Google、AI 双引擎，让翻译结果更透明、更准确。
          </p>
          
          <div className="pt-6 border-t border-neutral-200 text-xs text-neutral-500">
            &copy; 2026 即时翻译
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
