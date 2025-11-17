import MainLayout from '../../../../../components/HESI/edit/MainLayout';
import AuthGate from '../../../signin/AuthGate';
import Ai from '@/components/Ai';
import Whatsapp from '@/components/Whatsapp';

export default function Page() {
  return (
    <>
      <AuthGate>
        <MainLayout />
      <Ai />
      <Whatsapp />
      </AuthGate>
    </>
  );
}
