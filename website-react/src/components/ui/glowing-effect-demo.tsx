"use client";

import { RefreshCcw, Sparkles, Sidebar, Volume2, Shield } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export function GlowingEffectDemo() {
  return (
    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        icon={<RefreshCcw className="h-4 w-4 text-black dark:text-neutral-400" />}
        title="双向回译核对"
        description="自动将译文再次译回源语言，通过实时对照确保语义表达精准无误。"
      />

      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        icon={<Sparkles className="h-4 w-4 text-black dark:text-neutral-400" />}
        title="AI 智能双引擎"
        description="结合 Google 翻译的稳定与 AI 模型（GPT/Gemini）的语境理解能力。"
      />

      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        icon={<Sidebar className="h-4 w-4 text-black dark:text-neutral-400" />}
        title="侧边栏即点即译"
        description="深度适配 Chrome Side Panel，在侧边栏即可完成翻译，无需切换标签页。"
      />

      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
        icon={<Volume2 className="h-4 w-4 text-black dark:text-neutral-400" />}
        title="实时语音朗读"
        description="支持多国语言的高质量语音合成，集成了智能停止与重读控制功能。"
      />

      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
        icon={<Shield className="h-4 w-4 text-black dark:text-neutral-400" />}
        title="本地隐私优先"
        description="所有配置和翻译历史均存储在本地，不上传任何用户私密数据，安全可靠。"
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={2}
        />
        <div className="border-0.75 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D] bg-white">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-gray-600 p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="-tracking-4 pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-balance text-black md:text-2xl/[1.875rem] dark:text-white">
                {title}
              </h3>
              <h2 className="font-sans text-sm/[1.125rem] text-black md:text-base/[1.375rem] dark:text-neutral-400 [&_b]:md:font-semibold [&_strong]:md:font-semibold">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
