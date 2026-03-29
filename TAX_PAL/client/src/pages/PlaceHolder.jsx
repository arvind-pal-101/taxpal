import React from 'react';
import { useNavigate } from 'react-router-dom';

const Placeholder = ({ title, icon }) => {
  const navigate = useNavigate();

  const getContent = (page) => {
    switch (page) {
      case "Transactions":
        return "We're building a powerful way for you to track and categorize every penny.";
      case "Tax Calendar":
        return "Never miss a deadline again. We're finalizing your personalized tax roadmap.";
      case "Documents":
        return "A secure vault for your receipts and returns is currently being encrypted.";
      case "Settings":
        return "Fine-tuning the controls so you can customize TaxPal exactly how you like it.";
      default:
        return "We're currently polishing this section to give you the best experience.";
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 md:p-10 text-center relative">
      
      <div className="mb-6 text-6xl md:text-8xl animate-pulse opacity-80 select-none">
        {icon || '✨'}
      </div>

      <div className="max-w-xs md:max-w-sm space-y-3">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
          {title} <span className="text-emerald-500">!</span>
        </h2>
        
        <p className="text-gray-500 text-xs md:text-sm font-medium leading-relaxed px-2">
          {getContent(title)}
        </p>
      </div>

      <button 
        onClick={() => navigate('/dashboard')}
        className="mt-8 md:mt-10 w-full max-w-[240px] py-3.5 md:py-4 bg-gray-900 text-white rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] hover:bg-emerald-600 transition-all active:scale-95 shadow-lg"
      >
        Return to Dashboard
      </button>

      <div className="absolute bottom-8 md:bottom-10 w-full text-center">
        <span className="text-[8px] md:text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">
          TaxPal v1.0 • Internal Build
        </span>
      </div>
    </div>
  );
};

export default Placeholder;