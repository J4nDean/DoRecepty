import { ReactNode } from 'react';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { Header } from '../components/Header';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AppLayout = ({ children, title, subtitle }: AppLayoutProps) => (
  <div className="flex h-screen bg-slate-50 overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <Header title={title} subtitle={subtitle} />
      <main className="flex-1 overflow-y-auto p-5 pb-24 md:p-6 md:pb-6">
        {children}
      </main>
    </div>
    <BottomNav />
  </div>
);
