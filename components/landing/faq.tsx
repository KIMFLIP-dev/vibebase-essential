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
    question: "Vibebase란 무엇인가요?",
    answer:
      "1인 창업용 SaaS 스타터킷(보일러플레이트)이며, 바이브코더를 위해 SaaS에서의 필수 기능과 매번 구현해야 하는 부분만 미리 구현해놓은 소스 키트입니다. 현재 에센셜킷이 무료로 배포되고 있습니다.",
  },
  {
    question: "초보자도 사용할 수 있나요?",
    answer:
      "물론입니다! 코드베이스를 깔끔하고, 모듈화되어 있으며, 이해하기 쉽게 설계했습니다. 또한 설정을 안내하는 문서도 포함되어 있습니다.",
  },
  {
    question: "강의를 안 들어도 사용할 수 있나요?",
    answer:
      "네 물론입니다. 강의를 안 들어도 초보자는 물론 기존 개발자들 모두 무료 소스코드를 다운받아서 문서대로 설치하고 얼마든지 무료로 사용하실 수 있습니다. MIT 라이센스입니다.",
  },
  {
    question: "결제는 어떻게 처리하나요?",
    answer:
      "에센셜킷엔 결제 모듈은 포함되어 있지 않으나 문서대로 입력하시면 레몬스퀴지부터 크림, 포트원, 토스페이먼츠, 카카오페이까지 결제모듈을 붙일 수 있도록 되어 있습니다.",
  },
  {
    question: "상업용 프로젝트에 사용할 수 있나요?",
    answer:
      "네, Vibebase를 무제한 개인 및 상업용 프로젝트에 사용할 수 있습니다. 코드는 당신의 것입니다.",
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
