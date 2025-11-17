// src/rushhour/atiteas7/page.js
"use client";

import Navbar from "@/features/Homepage/Navbar";
import FloatingMascot from "@/components/FloatingMascot/FloatingMascot";
import Footer from "@/components/Footer";
import Ai from "@/components/Ai";
import Whatsapp from "@/components/Whatsapp";
import HeroAti from "@/features/LandingPage/HeroAti";
import Atiteas from "@/features/Pricing/Atiteas";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroAti />
      <Atiteas />
      <Ai />
      <Whatsapp />
      <FloatingMascot/>
      <Footer />
    </>
  );
}
