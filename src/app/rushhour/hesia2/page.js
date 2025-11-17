// src/rushhour/atiteas7/page.js
"use client";

import Navbar from "@/features/Homepage/Navbar";
import FloatingMascot from "@/components/FloatingMascot/FloatingMascot";
import Footer from "@/components/Footer";
import Ai from "@/components/Ai";
import Whatsapp from "@/components/Whatsapp";
import HesiA2 from "@/features/LandingPage/HesiA2";
import Hesia2t from "@/features/Pricing/HesiA2";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HesiA2 />
      <Hesia2t />
      <Ai />
      <Whatsapp />
      <FloatingMascot/>
      <Footer />
    </>
  );
}
