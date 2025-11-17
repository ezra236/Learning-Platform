"use client";

import Ai from '@/components/Ai';
import Whatsapp from '@/components/Whatsapp';
import PdfDisplay from '@/components/PurchasePdf/PdfDisplay';
import Navbar from '@/features/Homepage/Navbar';
import Footer from '@/components/Footer';

export default function Page() {
  return (
    <>
    <Navbar/>
      <PdfDisplay/>
      <Ai />
      <Whatsapp />
      <Footer/>
    </>
  );
}
