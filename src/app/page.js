// src/app/page.js
"use client";
import "./globals.css";
import styles from "../styles/home.module.css";
import FloatingMascot from "@/components/FloatingMascot/FloatingMascot";
import Navbar from "../features/Homepage/Navbar";
import Herosection from "../features/Homepage/Herosection";
import PreviewCarousel from "../features/Homepage/PreviewCarousel";
import NursingResources from "@/features/Homepage/NursingResources";
import TestimonialCarousel from '@/components/TestimonialCarousel/TestimonialCarousel'
import Ads from "../features/Homepage/Ads";

import Footer from "../components/Footer";
import Ai from "../components/Ai";
import Whatsapp from "../components/Whatsapp";

export default function HomePage() {
  return (
    <main className={styles.homeWrapper}>
      <Navbar />
      <Herosection />
      <PreviewCarousel />
      <NursingResources />
      <Ads />
      <Ai />
      <Whatsapp />
      <FloatingMascot/>
      <TestimonialCarousel/>
      <Footer />
    </main>
  );
}
