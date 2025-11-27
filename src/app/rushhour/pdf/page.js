"use client";

import Ai from '@/components/Ai';
import Whatsapp from '@/components/Whatsapp';
import PdfDisplay from '@/components/PurchasePdf/PdfDisplay';
import Navbar from '@/features/Homepage/Navbar';
import Footer from '@/components/Footer';
import Heropdf from '@/components/Pdf/Heropdf';

export default function Page() {
  return (
    <>
    <Navbar/>
    <Heropdf/>
      <PdfDisplay/>
      <Ai />
      <Whatsapp />
      <Footer/>
    </>
  );
}
