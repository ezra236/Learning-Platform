import AuthGate from "../signin/AuthGate";
import MainLayout from "@/components/Subscriptions/MainLayout"
import Ai from "@/components/Ai"
import Whatsapp from "@/components/Whatsapp"
import FloatingMascot from "@/components/FloatingMascot/FloatingMascot";

export default function Page() {
  return (
    <AuthGate>
      <MainLayout />

      {/* Global page components */}
      <Ai />
      <Whatsapp />
      <FloatingMascot/>
    </AuthGate>
  )
}
