"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function FooterNew() {
  return (
    <footer className="py-12 px-6 border-t border-[#111] bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8"
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#B7B2FF] rounded-lg flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m16 18 6-6-6-6" />
              <path d="m8 6-6 6 6 6" />
            </svg>
          </div>
          <span className="text-lg text-[#111] italic">김플립의 <span className="font-black">VibeBase</span></span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-8 text-sm font-medium text-[#111]">
          <Link
            href="/docs"
            className="hover:text-[#111] transition-colors"
          >
            가이드 문서
          </Link>
          <Link
            href="/legal/privacy"
            className="hover:text-[#111] transition-colors"
          >
            개인정보처리방침
          </Link>
          <Link
            href="/legal/terms"
            className="hover:text-[#111] transition-colors"
          >
            서비스이용약관
          </Link>
        </div>

        {/* Copyright + YouTube */}
        <div className="flex flex-col gap-1 text-center md:text-right">
          <div className="flex items-center gap-2 justify-center md:justify-end">
            <a
              href="https://www.youtube.com/@codefundkimflip"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
            >
              <div className="overflow-hidden" style={{ height: "28px", marginRight: "-10px" }}>
                <img src="/youtube-logo.png" alt="YouTube" style={{ height: "28px", width: "auto" }} />
              </div>
            </a>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Apprz. All rights reserved.
          </p>
          <p className="text-[10px] text-gray-400">
            플레인베이스 / 경기도 파주시 경의로 1056 523 / 사업자등록번호 : 790-20-02282 / 통신판매업신고번호 : 제 2025-경기파주-2740 호 / 대표자 : 김유철
            <br />
            대표전화 : 070-7954-8793 / 이메일 : journeyfromdigit@gmail.com
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
