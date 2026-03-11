"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "下载并解压",
    description: "点击上方下载按钮获取插件包，并解压到您容易找到的本地文件夹中。",
  },
  {
    number: "02",
    title: "开启开发者模式",
    description: "打开 Chrome 浏览器，进入 chrome://extensions/ 并开启右上角的开发者模式。",
  },
  {
    number: "03",
    title: "加载并使用",
    description: "点击加载已解压的扩展程序，选择解压后的文件夹。点击侧边栏图标即可开始翻译。",
  },
];

export default function Install() {
  return (
    <section id="install" className="py-[120px] bg-neutral-50/50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-900">只需三步，立即开启</h2>
          <p className="text-base md:text-lg text-neutral-600 max-w-[600px] mx-auto leading-relaxed">
            简单几步配置，即可在浏览器中享受最精准的翻译体验
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -4 }}
              className="group relative p-8 md:p-10 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all duration-300 text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-neutral-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              
              <div className="text-6xl font-black mb-4 text-neutral-200">
                {step.number}
              </div>
              
              <h4 className="text-xl font-semibold mb-3 text-neutral-900">{step.title}</h4>
              <p className="text-neutral-600 leading-relaxed text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
