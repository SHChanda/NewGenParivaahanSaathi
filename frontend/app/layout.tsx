import type { Metadata } from 'next';
import '../styles.css';

export const metadata: Metadata = {
  title: 'Sarathi Next — Driving licence services',
  description: "Apply for a Learner's Licence or book a Driving Licence test slot with Sarathi Next.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
