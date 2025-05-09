
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import IssueStats from '@/components/IssueStats';
import IssueList from '@/components/IssueList';
import IssueCategoryChart from '@/components/IssueCategoryChart';
import AffectedProducts from '@/components/AffectedProducts';
import ScrollIndicator from '@/components/ScrollIndicator';
import { Badge } from "@/components/ui/badge";

const Index = () => {
  // Set up scroll animation for elements
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    const hiddenElements = document.querySelectorAll('.initially-hidden');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-light">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Header />
        
        <main className="mt-8 space-y-8">
          {/* Hero section */}
          <section className="text-center py-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary-dark to-primary bg-clip-text text-transparent">
              Issue Management
            </h1>
            <p className="text-xl text-secondary-light max-w-2xl mx-auto">
              Track and manage all community-reported issues in one place
            </p>
            <div className="flex justify-center mt-4 space-x-2">
              <Badge className="bg-status-pending text-white">8 Open Issues</Badge>
              <Badge className="bg-status-solved text-white">0 Resolved</Badge>
            </div>
          </section>
          
          {/* Dashboard stats */}
          <section className="initially-hidden opacity-0">
            <IssueStats />
          </section>
          
          {/* Charts and analytics section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 initially-hidden opacity-0">
            <IssueCategoryChart />
            <AffectedProducts />
          </section>
          
          {/* Issue list section */}
          <section className="initially-hidden opacity-0">
            <h2 className="text-2xl font-bold mb-6">All Issues</h2>
            <IssueList />
          </section>
        </main>
        
        <footer className="mt-16 text-center text-sm text-secondary-light pb-8">
          <p>© {new Date().getFullYear()} Issue Manager Dashboard. All issues are being tracked.</p>
        </footer>
      </div>
      
      <ScrollIndicator />
    </div>
  );
};

export default Index;
