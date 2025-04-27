import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

/**
 * Exports a certificate element to PNG format
 * @param element The HTML element to export
 * @param filename Base filename for the exported PNG
 * @returns Promise that resolves when export is complete
 */
export async function exportToPNG(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // Save current scroll position
  const originalScrollY = window.scrollY;
  const originalElementScroll = element.scrollTop;
  
  // Set up for full capture
  const originalStyle = element.style.cssText;
  element.style.maxHeight = 'none';
  element.style.overflow = 'visible';
  
  // Force to render first
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Capture the whole element
  const dataUrl = await toPng(element, { 
    quality: 0.95,
    cacheBust: true,
    height: element.scrollHeight,
    width: element.scrollWidth,
    canvasWidth: element.scrollWidth,
    canvasHeight: element.scrollHeight,
    pixelRatio: 2
  });
  
  // Restore element style
  element.style.cssText = originalStyle;
  window.scrollTo(0, originalScrollY);
  if (element.scrollTo) {
    element.scrollTo(0, originalElementScroll);
  }
  
  // Create a link element, set the download attribute and click it
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Exports a certificate element to PDF format
 * @param element The HTML element to export 
 * @param filename Base filename for the exported PDF
 * @returns Promise that resolves when export is complete
 */
export async function exportToPDF(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // Save current scroll position
  const originalScrollY = window.scrollY;
  const originalElementScroll = element.scrollTop;
  
  // Set up for full capture
  const originalStyle = element.style.cssText;
  element.style.maxHeight = 'none';
  element.style.overflow = 'visible';
  
  // Force to render first
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const dataUrl = await toPng(element, { 
    quality: 0.95,
    cacheBust: true,
    height: element.scrollHeight,
    width: element.scrollWidth,
    canvasWidth: element.scrollWidth,
    canvasHeight: element.scrollHeight,
    pixelRatio: 2
  });
  
  // Restore element style
  element.style.cssText = originalStyle;
  window.scrollTo(0, originalScrollY);
  if (element.scrollTo) {
    element.scrollTo(0, originalElementScroll);
  }
  
  // Calculate aspect ratio to maintain proportions in PDF
  const aspectRatio = element.scrollHeight / element.scrollWidth;
  
  const pdf = new jsPDF({
    orientation: aspectRatio > 1 ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdfWidth * aspectRatio;
  
  // Check if the content fits on a single page, if not handle multi-page
  const a4Height = pdf.internal.pageSize.getHeight();
  
  if (pdfHeight <= a4Height) {
    // Single page case
    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
  } else {
    // Multi-page case with no cutting off
    const pageCount = Math.ceil(pdfHeight / a4Height);
    
    for (let i = 0; i < pageCount; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      // Position the image on each page to show the correct segment
      pdf.addImage(
        dataUrl, 
        'PNG', 
        0, 
        -i * a4Height, 
        pdfWidth, 
        pdfHeight
      );
    }
  }
  
  pdf.save(`${filename}.pdf`);
}

/**
 * Handles exporting a certificate to either PNG or PDF format
 * @param element The HTML element containing the certificate to export
 * @param format The export format ('png' or 'pdf')
 * @param validationId The validation ID to use in the filename
 * @returns Promise that resolves when export is complete
 */
export async function handleCertificateExport(
  element: HTMLElement | null,
  format: 'png' | 'pdf',
  validationId: string
): Promise<void> {
  if (!element) return;
  
  const filename = `certificate-${validationId}`;
  
  try {
    if (format === 'png') {
      await exportToPNG(element, filename);
    } else if (format === 'pdf') {
      await exportToPDF(element, filename);
    }
  } catch (error) {
    console.error(`Error generating ${format} certificate:`, error);
  }
} 