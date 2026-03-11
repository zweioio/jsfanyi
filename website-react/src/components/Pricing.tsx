"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

const plans = [
  {
    name: "免费版",
    price: "$0",
    period: "/ 永久免费",
    featured: true,
    features: [
      "Google 翻译引擎",
      "双向回译核对",
      "侧边栏模式",
      "基础语音朗读",
    ],
    cta: "立即开始使用",
    ctaLink: "即时翻译 - 集成 Google、AI 双引擎，翻译双向回译核对，让每一句翻译的准确性都清晰可见.zip",
  },
  {
    name: "专业版",
    price: "敬请期待",
    period: "/ 按需配置",
    featured: false,
    features: [
      "集成 OpenAI / Gemini",
      "智能上下文理解",
      "自定义 API Key 支持",
      "优先技术支持",
    ],
    cta: "敬请期待",
    ctaLink: "#",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-[120px] bg-neutral-50/50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-900">选择适合您的方案</h2>
          <p className="text-base md:text-lg text-neutral-600 max-w-[600px] mx-auto leading-relaxed">
            免费使用所有基础功能，解锁更强大的 AI 体验
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1000px] mx-auto">
          {plans.map((plan, index) => (
            <CardContainer
              key={plan.name}
              containerClassName="w-full max-w-[500px] mx-auto"
            >
              <CardBody className="relative w-full p-8 md:p-10 bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-xl transition-shadow duration-300">
                <CardItem translateZ={50}>
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded-full shadow-lg">
                      ⭐ 推荐
                    </div>
                  )}
                </CardItem>

                <CardItem translateZ={50}>
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-2 text-neutral-900">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-neutral-900">{plan.price}</span>
                      <span className="text-sm font-medium text-neutral-500">{plan.period}</span>
                    </div>
                  </div>
                </CardItem>

                <CardItem translateZ={30}>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-neutral-600">
                        <Check className="w-4 h-4 text-neutral-900 flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardItem>

                <CardItem translateZ={40}>
                  <a
                    href={plan.ctaLink}
                    download={plan.ctaLink !== "#"}
                    className={`block w-full py-3 px-4 text-center text-sm font-semibold rounded-lg transition-all duration-300 ${
                      plan.featured
                        ? "text-white bg-neutral-900 hover:bg-neutral-800 hover:-translate-y-0.5 shadow-lg shadow-neutral-900/20"
                        : "text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 hover:-translate-y-0.5"
                    }`}
                  >
                    {plan.cta}
                  </a>
                </CardItem>
              </CardBody>
            </CardContainer>
          ))}
        </div>
      </div>
    </section>
  );
}
