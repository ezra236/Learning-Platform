// src/rushhour/atiteas7/page.js
"use client";

import Navbar from "@/features/Homepage/Navbar";
import FloatingMascot from "@/components/FloatingMascot/FloatingMascot";
import Footer from "@/components/Footer";
import Ai from "@/components/Ai";
import Whatsapp from "@/components/Whatsapp";
import HeroNclexrn from "@/features/LandingPage/HeroNclexrn";
import Nclex from "@/features/Pricing/Nclex";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroNclexrn />
      <Nclex/>
      <Ai />
      <Whatsapp />
      <FloatingMascot/>
      <Footer />
    </>
  );
}
