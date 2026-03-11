"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative pt-[240px] pb-[100px] text-center pointer-events-none">
      <div className="max-w-5xl mx-auto px-6">

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
        >
          <span className="text-neutral-900">集成 Google & AI 双引擎</span>
          <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
            让翻译准确性清晰可见
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-neutral-600 max-w-[760px] mx-auto mb-10 leading-relaxed"
        >
          双向回译核对技术，自动将结果译回源语言，通过"二次比对"助您直观判断语义，确保沟通万无一失。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex gap-3 md:gap-4 justify-center flex-wrap mb-12 pointer-events-auto"
        >
          <a
            href="即时翻译 - 集成 Google、AI 双引擎，翻译双向回译核对，让每一句翻译的准确性都清晰可见.zip"
            download
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-neutral-900/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>下载浏览器插件</span>
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-neutral-900 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:-translate-y-0.5 transition-all duration-300"
          >
            了解核心功能
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-center gap-4 text-xs text-neutral-500 font-medium"
        >
          <span>v1.2</span>
          <span className="text-neutral-300">•</span>
          <span>开源且安全</span>
          <span className="text-neutral-300">•</span>
          <span>100% 隐私保护</span>
        </motion.div>
      </div>
    </section>
  );
}
