import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuroraBackground from "@/components/anim/AuroraBackground";
import ScrollProgress from "@/components/anim/ScrollProgress";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Replace with your production domain.
export const metadataBase = new URL("https://aurumos.vercel.app");
export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "AurumOS | Luxury Jewellery Enterprise Software",
    template: "%s | AurumOS",
  },
  description:
    "Advanced, synchronized jewellery management system for elite retailers and wholesalers. HUID compliance, real-time inventory, and absolute data integrity.",
  keywords: [
    "jewellery ERP",
    "jewellery software",
    "HUID compliance",
    "inventory management",
    "wholesale jewellery",
    "retail POS",
  ],
  authors: [{ name: "Jenil Dholakiya" }],
  openGraph: {
    type: "website",
    title: "AurumOS | Luxury Jewellery Enterprise Software",
    description:
      "The intelligence core for the modern jewellery trade — engineered for integrity, scaled for enterprise.",
    siteName: "AurumOS",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AurumOS | Luxury Jewellery Enterprise Software",
    description:
      "The intelligence core for the modern jewellery trade — engineered for integrity, scaled for enterprise.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#9c433f",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <AuroraBackground />
        <ScrollProgress />
        <MotionProvider>
          <Navbar />
          {children}
          <Footer />
        </MotionProvider>
        <Script id="marker-io" strategy="lazyOnload">
          {`
            window.markerConfig = {
              project: '6a9e9728297b8d263a550cb7', 
              source: 'snippet'
            };
            !function(e,r,a){if(!e.__Marker){e.__Marker={};var t=[],n={__cs:t};["show","hide","isVisible","capture","cancelCapture","unload","reload","isExtensionInstalled","setReporter","clearReporter","setCustomData","on","off"].forEach(function(e){n[e]=function(){var r=Array.prototype.slice.call(arguments);r.unshift(e),t.push(r)}}),e.Marker=n;var s=r.createElement("script");s.async=1,s.src="https://edge.marker.io/latest/shim.js";var i=r.getElementsByTagName("script")[0];i.parentNode.insertBefore(s,i)}}(window,document);
          `}
        </Script>
      </body>
    </html>
  );
}
