import { Icon } from 'lucide-react';
import './globals.css';

export const metadata = {
  title: 'Productividad Surtidores',
  description: 'Sistema de medición de productividad individual de surtidores',
  Icon: '../public/diagsa.svg'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}