// src/rushhour/atiteas7/page.js
"use client";

import Navbar from "@/features/Homepage/Navbar";
import FloatingMascot from "@/components/FloatingMascot/FloatingMascot";
import Footer from "@/components/Footer";
import Ai from "@/components/Ai";
import Whatsapp from "@/components/Whatsapp";
import HeroNclexPn from "@/features/LandingPage/HeroNclexPn";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroNclexPn />
      <Ai />
      <Whatsapp />
      <FloatingMascot/>
      <Footer />
    </>
  );
}
