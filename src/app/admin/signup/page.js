'use client';
import Head from 'next/head';
import AdminSignupCard from '../../../components/AdminSignupCard/AdminSignupCard';
import Navbar from '@/features/Homepage/Navbar';
import WhatsApp from '@/components/Whatsapp';
import Ai from '@/components/Ai';
import Footer from '@/components/Footer';
import AuthGate from './AuthGate';

export default function AdminSignupPage() {
  return (
    <AuthGate>
      <>
        <WhatsApp />
        <Ai />
        <Navbar />
        <Head>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          />
        </Head>
        <div className="page-container">
          <AdminSignupCard />
          <style jsx>{`
            .page-container {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 80vh;
              background: white;
              padding: 20px;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
          `}</style>
        </div>
        <Footer />
      </>
    </AuthGate>
  );
}
