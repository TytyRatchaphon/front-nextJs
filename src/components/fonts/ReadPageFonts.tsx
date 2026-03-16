import { Sarabun, Prompt, Kanit, IBM_Plex_Sans_Thai, Mitr, Mali, Trirong, Maitree, Taviraj, Kodchasan, Chakra_Petch } from "next/font/google";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
  display: "swap",
});

const prompt = Prompt({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
  display: "swap",
});

const kanit = Kanit({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-kanit",
  display: "swap",
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-ibm-plex-sans-thai",
  display: "swap",
});

const mitr = Mitr({
  weight: ["300", "400", "500"],
  subsets: ["thai", "latin"],
  variable: "--font-mitr",
  display: "swap",
});

const mali = Mali({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-mali",
  display: "swap",
});

const trirong = Trirong({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-trirong",
  display: "swap",
});

const maitree = Maitree({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-maitree",
  display: "swap",
});

const taviraj = Taviraj({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-taviraj",
  display: "swap",
});

const kodchasan = Kodchasan({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-kodchasan",
  display: "swap",
});

const chakraPetch = Chakra_Petch({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-chakra-petch",
  display: "swap",
});

export default function ReadPageFonts() {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        :root {
          ${sarabun.variable !== '--font-sarabun' ? `--font-sarabun: ${sarabun.style.fontFamily};` : ''}
          ${prompt.variable !== '--font-prompt' ? `--font-prompt: ${prompt.style.fontFamily};` : ''}
          ${kanit.variable !== '--font-kanit' ? `--font-kanit: ${kanit.style.fontFamily};` : ''}
          ${ibmPlexSansThai.variable !== '--font-ibm-plex-sans-thai' ? `--font-ibm-plex-sans-thai: ${ibmPlexSansThai.style.fontFamily};` : ''}
          ${mitr.variable !== '--font-mitr' ? `--font-mitr: ${mitr.style.fontFamily};` : ''}
          ${mali.variable !== '--font-mali' ? `--font-mali: ${mali.style.fontFamily};` : ''}
          ${trirong.variable !== '--font-trirong' ? `--font-trirong: ${trirong.style.fontFamily};` : ''}
          ${maitree.variable !== '--font-maitree' ? `--font-maitree: ${maitree.style.fontFamily};` : ''}
          ${taviraj.variable !== '--font-taviraj' ? `--font-taviraj: ${taviraj.style.fontFamily};` : ''}
          ${kodchasan.variable !== '--font-kodchasan' ? `--font-kodchasan: ${kodchasan.style.fontFamily};` : ''}
          ${chakraPetch.variable !== '--font-chakra-petch' ? `--font-chakra-petch: ${chakraPetch.style.fontFamily};` : ''}
        }
      `
    }} />
  );
}
