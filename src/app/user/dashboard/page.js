import AuthGate from "../signin/AuthGate";
import MainLayout from "@/components/Userdashboard/MainLayout"
import Ai from "@/components/Ai"
import Whatsapp from "@/components/Whatsapp"
import FloatingMascot from "@/components/FloatingMascot/FloatingMascot";
import MarketingQueue from "@/components/Rendered/MarketingQueue";

export default function Page() {
  return (
    <AuthGate>
      <MainLayout />

      {/* Global page components */}
      <Ai />
      <Whatsapp />
      <FloatingMascot/>
      <MarketingQueue />
    </AuthGate>
  )
}
