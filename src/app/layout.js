import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RecordVisitOnMount from "@/components/Visits/RecordVisitOnMount";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Rushhourcamp",
  description: "My awesome app",
  icons: {
    icon: "/favicon.ico"       // standard
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>

         <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1"/>

         
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-ku... (copy from CDN if you want SRI)"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet"/>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <RecordVisitOnMount />
        {children}
      </body>
    </html>
  );
}
