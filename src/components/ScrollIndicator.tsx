
import React, { useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';

const ScrollIndicator = () => {
  const [showIndicator, setShowIndicator] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowIndicator(false);
      } else {
        setShowIndicator(true);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!showIndicator) {
    return null;
  }

  return (
    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-float">
      <p className="text-sm text-secondary-light mb-2">Scroll for more</p>
      <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
        <ArrowDown className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
};

export default ScrollIndicator;
