"use client";

import { useState } from "react";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarLogo,
  NavbarButton,
} from "@/components/ui/resizable-navbar";

export default function NavbarComponent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "功能", link: "#features" },
    { name: "价格", link: "#pricing" },
    { name: "安装", link: "#install" },
    { name: "FAQ", link: "#faq" },
  ];

  return (
    <Navbar className="top-2">
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />
        <div className="flex items-center gap-2">
          <NavbarButton variant="secondary">登录</NavbarButton>
          <NavbarButton variant="primary">下载</NavbarButton>
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>
        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          <NavItems
            items={navItems}
            onItemClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="flex w-full flex-col gap-2">
            <NavbarButton variant="secondary" className="w-full">
              登录
            </NavbarButton>
            <NavbarButton variant="primary" className="w-full">
              下载
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
