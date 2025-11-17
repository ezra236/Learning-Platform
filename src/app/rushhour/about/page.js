// src/rushhour/atiteas7/page.js
"use client";

import Navbar from "@/features/Homepage/Navbar";
import FloatingMascot from "@/components/FloatingMascot/FloatingMascot";
import Footer from "@/components/Footer";
import Ai from "@/components/Ai";
import Whatsapp from "@/components/Whatsapp";
import AboutHero from '@/features/About/AboutHero';
import MissionSection from '@/features/About/MissionSection';
import FeaturesSection from '@/features/About/FeaturesSection';
import AboutCTA from '@/features/About/AboutCTA';
import SuccessStories from "@/features/About/SuccessStories";


export default function HomePage() {
  return (
    <>
      <Navbar />
      <AboutHero />
      <MissionSection />
      <FeaturesSection />
      <AboutCTA />
        <SuccessStories />
      <Ai />
      <Whatsapp />
      <FloatingMascot/>
      <Footer />
    </>
  );
}
