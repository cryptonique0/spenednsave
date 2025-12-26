"use client";

import React from 'react';
import Button from '@/components/Button';

interface ExportButtonProps {
  selector?: string; // CSS selector to export
  filename?: string;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ selector = 'body', filename = 'resume.pdf', className = '' }) => {
  const exportPdf = async () => {
    // Lightweight client-side export using print dialog
    // For production-grade PDF, integrate html2canvas + jsPDF later
    try {
      // Create a print stylesheet to focus on selector
      const style = document.createElement('style');
      style.media = 'print';
      style.innerHTML = `
        @page { margin: 12mm; }
        body * { visibility: hidden; }
        ${selector} { visibility: visible; }
        ${selector} { position: absolute; left: 0; top: 0; }
      `;
      document.head.appendChild(style);

      // Trigger print
      window.print();

      // Cleanup
      setTimeout(() => {
        document.head.removeChild(style);
      }, 1000);
    } catch (e) {
      console.warn('Export failed', e);
    }
  };

  return (
    <Button variant="secondary" className={className} onClick={exportPdf}>
      Export as PDF
    </Button>
  );
};

export default ExportButton;
