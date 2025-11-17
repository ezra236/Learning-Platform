// src/rushhour/atiteas7/page.js
"use client";

import Navbar from "@/features/Homepage/Navbar";
import FloatingMascot from "@/components/FloatingMascot/FloatingMascot";
import Footer from "@/components/Footer";
import Ai from "@/components/Ai";
import Whatsapp from "@/components/Whatsapp";
import RefundPolicy from "@/features/Refund/RefundPolicy";

export default function HomePage() {
  return (
    <>
      <Navbar />   
      <Ai />
      <Whatsapp />
        <RefundPolicy />
      <FloatingMascot/>
      <Footer />
    </>
  );
}
