import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans_Thai({ variable: "--font-plex", subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Aphasia AI — โค้ชฝึกพูดที่บ้าน",
  description: "ฝึกพูดที่บ้านด้วยตัวเอง ภาพ + เสียง ทีละด่าน",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2F80ED" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${plex.variable} h-full`}>
      <body className="min-h-full">
        <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-5">{children}</main>
      </body>
    </html>
  );
}
