"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, Variants } from "framer-motion";

const faqs = [
  {
    question: "Vibebase Essential이란 무엇인가요?",
    answer:
      "1인 창업용 SaaS 스타터킷(보일러플레이트)입니다. 회원가입·소셜 로그인, 마이페이지, PortOne 단건 결제, 블로그, 1:1 문의, 관리자 대시보드 등 SaaS에서 매번 구현해야 하는 필수 기능이 미리 구현되어 있습니다.",
  },
  {
    question: "초보자도 사용할 수 있나요?",
    answer:
      "물론입니다! 코드베이스가 깔끔하고, 모듈화되어 있으며, 이해하기 쉽게 설계했습니다. 설치와 설정을 안내하는 문서도 포함되어 있습니다.",
  },
  {
    question: "어떤 기술 스택을 사용하나요?",
    answer:
      "Next.js 15(App Router) + Supabase(인증·DB·스토리지) + Tailwind CSS 4 + shadcn/ui 조합입니다. 이메일 발송은 Resend, 결제는 PortOne V2를 사용합니다.",
  },
  {
    question: "결제는 어떻게 처리하나요?",
    answer:
      "PortOne V2 기반 단건 결제가 내장되어 있습니다. 서버에서 금액을 고정하고 결제 후 검증하는 안전한 구조이며, 웹훅 서명 검증과 관리자 환불 기능까지 포함됩니다. 간편결제 계열 PG는 채널 키 교체만으로, 다른 결제수단은 payMethod 수정으로 전환할 수 있습니다.",
  },
  {
    question: "상업용 프로젝트에 사용할 수 있나요?",
    answer:
      "네, 무제한 개인 및 상업용 프로젝트에 사용할 수 있습니다. 코드는 당신의 것입니다.",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export function FAQNew() {
  return (
    <section id="faq" className="pt-24 pb-12 px-6 bg-[#F9F9FB]">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-black text-[#111] mb-4">
            <span className="bg-[#B7B2FF] text-white px-4 py-0.5 rounded-full">FAQ</span>
          </h2>
          <p className="text-[#111] font-medium">
            궁금한 점이 있으신가요? 여기서 답을 찾아보세요.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AccordionItem
                  value={`item-${index}`}
                  className="border border-gray-200 rounded-2xl bg-white overflow-hidden"
                >
                  <AccordionTrigger className="text-left px-6 py-5 hover:no-underline text-[#111] font-semibold text-base md:text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 pt-0 text-gray-500 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

      </div>
    </section>
  );
}
