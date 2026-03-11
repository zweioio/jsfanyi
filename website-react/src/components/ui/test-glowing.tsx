"use client";

import { GlowingEffect } from "./glowing-effect";
import { useState } from "react";

export default function TestGlowingEffect() {
  const [debugInfo, setDebugInfo] = useState("");

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="space-y-8">
        <div className="relative w-[400px] h-[300px]">
          <div 
            className="relative w-full h-full"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              setDebugInfo(`鼠标位置：X: ${Math.round(x)}, Y: ${Math.round(y)}`);
            }}
          >
            <GlowingEffect
              spread={100}
              glow={true}
              disabled={false}
              proximity={200}
              blur={0}
              borderWidth={4}
            />
            <div className="absolute inset-0 bg-white rounded-2xl border-2 border-gray-300 p-8 overflow-hidden z-10 cursor-crosshair">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔍 测试发光效果
              </h2>
              <p className="text-gray-700 mb-4">
                在这个卡片上移动鼠标，您应该能看到：
              </p>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>✅ 蓝色边框随鼠标出现</li>
                <li>✅ 光晕效果跟随鼠标位置</li>
                <li>✅ 外部发光效果</li>
              </ul>
              <p className="text-xs text-gray-500 mt-4">
                {debugInfo && `📍 ${debugInfo}`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <strong>💡 提示：</strong>如果看不到效果，请检查：
          <ul className="mt-2 space-y-1">
            <li>1. 浏览器是否支持 CSS 渐变</li>
            <li>2. 是否真的在卡片上移动鼠标（不是在空白区域）</li>
            <li>3. 刷新页面试试</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
