// frontend/src/app/admin/layout.js
import '@/styles/admin.css'

export const metadata = {
  title: 'Rushhourcamp',
}

export default function AdminLayout({ children }) {
  // server component: just render children; admin.css is imported here
  return <>{children}</>
}
