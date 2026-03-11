"use client";

import { motion } from "framer-motion";

const faqs = [
  {
    question: "插件支持哪些浏览器？",
    answer: "目前深度适配 Google Chrome 和 Microsoft Edge 浏览器，理论上支持所有基于 Chromium 内核的浏览器。",
  },
  {
    question: "如何配置 AI 智能引擎？",
    answer: "当前自定义 API Key 配置功能仍在完善中，敬请期待。同时，我们已提供无需填写个人 API Key 的内置 AI 智能引擎，可直接使用。",
  },
  {
    question: "翻译数据会上传吗？",
    answer: "不会。我们非常重视您的隐私，所有翻译请求均直接发送至对应的翻译引擎 API，插件本身不存储任何内容。",
  },
];

export default function FAQ() {
  return (
    <section className="py-[120px]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-900">常见问题</h2>
        </motion.div>

        <div className="max-w-[800px] mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ x: 8 }}
              className="p-6 md:p-8 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all duration-300"
            >
              <h4 className="text-lg md:text-xl font-semibold mb-3 text-neutral-900">{faq.question}</h4>
              <p className="text-neutral-600 leading-relaxed text-sm md:text-base">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
