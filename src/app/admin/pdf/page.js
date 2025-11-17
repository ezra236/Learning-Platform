import AuthGate from '../signin/AuthGate';
import MainLayout from '@/components/Pdf/MainLayout';
import Ai from '@/components/Ai';
import Whatsapp from '@/components/Whatsapp';

export default function Page() {
  return (
    <>
      <AuthGate>
      <MainLayout/>
      <Ai />
      <Whatsapp />
      </AuthGate>
    </>
  );
}
