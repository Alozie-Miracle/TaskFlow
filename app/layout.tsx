import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/context/ThemeContext';
import { AuthProvider } from '@/components/context/AuthContext';
import { ToastProvider } from '@/components/context/ToastContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskFlow Admin | Modern Task Assignment Dashboard',
  description:
    'A polished, responsive internal admin application for task delegation, assignee workload management, and project tracking.',
  openGraph: {
    title: 'TaskFlow Admin - Task Assignment Dashboard',
    description: 'Internal Admin Dashboard for Task and Team Management',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('taskflow_theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
