
import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header';
import IssueStats from '@/components/IssueStats';
import IssueList from '@/components/IssueList';
import IssueCategoryChart from '@/components/IssueCategoryChart';
import AffectedProducts from '@/components/AffectedProducts';
import ScrollIndicator from '@/components/ScrollIndicator';
import { Badge } from "@/components/ui/badge";
import SegmentNavigation from '@/components/SegmentNavigation';

const Index = () => {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const issuesListRef = useRef<HTMLElement>(null);

  // Load saved segment from localStorage
  useEffect(() => {
    const savedSegment = localStorage.getItem('activeIssueSegment');
    if (savedSegment) {
      setActiveSegment(savedSegment);
    }
  }, []);

  // Save active segment to localStorage
  const handleSegmentChange = (segment: string) => {
    setActiveSegment(segment === activeSegment ? null : segment);
    localStorage.setItem('activeIssueSegment', segment === activeSegment ? '' : segment);
    
    // Scroll to issues list after a short delay
    setTimeout(() => {
      if (issuesListRef.current) {
        issuesListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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
          {/* Hero section with compact metrics */}
          <section className="flex flex-col md:flex-row md:items-center md:justify-between py-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary-dark to-primary bg-clip-text text-transparent">
                Issue Management
              </h1>
              <p className="text-lg text-secondary-light">
                Track and manage all community-reported issues
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <IssueStats />
            </div>
          </section>
          
          {/* Segments Navigation Section */}
          <section className="initially-hidden opacity-0 py-4">
            <h2 className="text-xl font-medium mb-4">Browse by Category</h2>
            <SegmentNavigation 
              activeSegment={activeSegment} 
              onSegmentChange={handleSegmentChange} 
            />
          </section>
          
          {/* Charts and analytics section - hidden when a segment is active */}
          {!activeSegment && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 initially-hidden opacity-0">
              <IssueCategoryChart />
              <AffectedProducts />
            </section>
          )}
          
          {/* Issue list section */}
          <section className="initially-hidden opacity-0" ref={issuesListRef}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {activeSegment ? 
                  `${activeSegment.charAt(0).toUpperCase() + activeSegment.slice(1)} Issues` : 
                  'All Issues'}
              </h2>
              {activeSegment && (
                <Badge 
                  className="cursor-pointer hover:bg-gray-200 transition-colors" 
                  variant="outline" 
                  onClick={() => handleSegmentChange(activeSegment)}
                >
                  Clear filter ×
                </Badge>
              )}
            </div>
            <IssueList activeSegment={activeSegment} />
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
