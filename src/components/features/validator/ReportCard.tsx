'use client'

import { useState } from 'react'
import { FileText, Download, HelpCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Define the tooltip props interface directly
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

interface ReportCardProps {
  validationId: string
  filename: string
  Tooltip: React.FC<TooltipProps>
}

export default function ReportCard({ validationId, filename, Tooltip }: ReportCardProps) {
  const t = useTranslations('ValidationResults')
  const tt = useTranslations('Tooltips')
  const [isDownloading, setIsDownloading] = useState<boolean>(false)

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    try {
      // Get the validation results content
      const resultsElement = document.querySelector('.validation-results') as HTMLElement
      
      if (!resultsElement) {
        throw new Error('Could not find validation results to generate PDF')
      }
      
      // Create a clone of the element to modify for PDF generation
      const clonedResults = resultsElement.cloneNode(true) as HTMLElement
      
      // Preprocess the cloned element before PDF generation
      prepareElementForPdf(clonedResults)
      
      // Create a temporary container
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '0'
      tempContainer.style.width = '800px'
      document.body.appendChild(tempContainer)
      
      try {
        // Create PDF document
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })
        
        // Initialize page dimensions
        const pageWidth = 210 // A4 width in mm
        const pageHeight = 297 // A4 height in mm
        const margin = 15
        
        // We'll organize content into page groups as requested
        // Get all section cards
        const allSections = Array.from(clonedResults.querySelectorAll('.results-card:not(.report-card)') as NodeListOf<HTMLElement>)
        
        // Skip processing if no sections found
        if (allSections.length === 0) {
          throw new Error('No content sections found in validation results')
        }
        
        // Group sections according to user's request:
        // 1. First two sections together (summary + document info)
        // 2. Signers section alone
        // 3. Technical details alone
        const pageGroups = []
        
        // Find the sections by their class
        const summaryCard = allSections.find(section => section.classList.contains('summary-card'))
        const documentInfoCard = allSections.find(section => section.classList.contains('document-info'))
        const signaturesCard = allSections.find(section => section.classList.contains('signatures-card'))
        const technicalCard = allSections.find(section => section.classList.contains('technical-card'))
        
        // Create the page groups
        if (summaryCard && documentInfoCard) {
          // First page: summary and document info
          const firstPageGroup = document.createElement('div')
          firstPageGroup.appendChild(summaryCard.cloneNode(true))
          firstPageGroup.appendChild(documentInfoCard.cloneNode(true))
          pageGroups.push(firstPageGroup)
        } else {
          // Fallback if structure is different, add first two sections
          if (allSections.length >= 2) {
            const firstPageGroup = document.createElement('div')
            firstPageGroup.appendChild(allSections[0].cloneNode(true))
            firstPageGroup.appendChild(allSections[1].cloneNode(true))
            pageGroups.push(firstPageGroup)
          }
        }
        
        // Second page: signatures section
        if (signaturesCard) {
          pageGroups.push(signaturesCard)
        }
        
        // Third page: technical details
        if (technicalCard) {
          pageGroups.push(technicalCard)
        }
        
        // Process each page group
        for (let pageIndex = 0; pageIndex < pageGroups.length; pageIndex++) {
          const pageContent = pageGroups[pageIndex]
          
          // Add page (except for first page)
          if (pageIndex > 0) {
            pdf.addPage()
          }
          
          // Clear container and add current page group
          tempContainer.innerHTML = ''
          
          // If it's a grouped page, just append it
          if (pageContent instanceof HTMLDivElement) {
            tempContainer.appendChild(pageContent)
          } else {
            // Otherwise, it's a single section
            tempContainer.appendChild(pageContent.cloneNode(true))
          }
          
          // Add report title to first page only
          if (pageIndex === 0) {
            const title = document.createElement('h1')
            title.textContent = 'Validation Report'
            title.style.textAlign = 'center'
            title.style.marginBottom = '20px'
            title.style.fontSize = '24px'
            title.style.fontFamily = 'Arial, sans-serif'
            tempContainer.insertBefore(title, tempContainer.firstChild)
          }
          
          // Force expand any accordions again (since we cloned nodes)
          forceExpandAccordions(tempContainer)
          
          // Capture the content
          const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: 'white',
            windowWidth: 800,
            onclone: (clonedDoc, element) => {
              // Additional step to force expand elements in the cloned document
              const accordions = element.querySelectorAll('.MuiAccordion-root, .signer-card')
              for (const accordion of accordions) {
                if (accordion.classList.contains('MuiAccordion-root')) {
                  accordion.classList.add('Mui-expanded')
                  
                  const details = accordion.querySelector('.MuiAccordionDetails-root')
                  if (details instanceof HTMLElement) {
                    details.style.display = 'block'
                    details.style.height = 'auto'
                    details.style.visibility = 'visible'
                  }
                  
                  const expandIcon = accordion.querySelector('.MuiAccordionSummary-expandIconWrapper')
                  if (expandIcon instanceof HTMLElement) {
                    expandIcon.style.display = 'none'
                  }
                } else if (accordion.classList.contains('signer-card')) {
                  accordion.classList.add('expanded')
                  
                  // Force signer details to be visible if they exist
                  const details = accordion.querySelector('.signer-details')
                  if (details instanceof HTMLElement) {
                    details.style.display = 'block'
                  }
                }
              }
            }
          })
          
          // Calculate dimensions to fit content properly on page
          const imgWidth = pageWidth - 2 * margin
          
          // Scale height proportionally to width
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          
          // Add to PDF
          pdf.addImage(
            canvas.toDataURL('image/jpeg', 1.0),
            'JPEG',
            margin,
            margin,
            imgWidth,
            Math.min(imgHeight, pageHeight - 2 * margin) // Don't overflow page
          )
          
          // Add page number
          pdf.setFontSize(10)
          pdf.text(`Page ${pageIndex + 1} of ${pageGroups.length}`, pageWidth - margin - 25, pageHeight - margin - 5)
        }
        
        // Save PDF
        const safeFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        pdf.save(`${safeFilename}-validation-report.pdf`)
      } finally {
        // Clean up
        document.body.removeChild(tempContainer)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('There was an error generating the report. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }
  
  // Helper function to prepare the element for PDF generation
  function prepareElementForPdf(element: HTMLElement) {
    // Set styles for better rendering
    element.style.width = '800px'
    element.style.padding = '20px'
    element.style.backgroundColor = 'white'
    element.style.fontFamily = 'Arial, sans-serif'
    
    // Remove the report card itself
    const reportCard = element.querySelector('.report-card')
    if (reportCard?.parentNode) {
      reportCard.parentNode.removeChild(reportCard)
    }
    
    // Force expand all accordions
    forceExpandAccordions(element)
    
    // Remove no-print elements from the clone
    const noPrintElements = element.querySelectorAll('.no-print') as NodeListOf<HTMLElement>
    for (const element of noPrintElements) {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    }
  }
  
  // Helper function to force expand all accordions and collapsible elements
  function forceExpandAccordions(container: HTMLElement) {
    // Expand all Material UI accordions
    const accordions = container.querySelectorAll('.MuiAccordion-root') as NodeListOf<HTMLElement>
    for (const accordion of accordions) {
      // Add expanded class
      accordion.classList.add('Mui-expanded')
      
      // Force inner elements to show
      const root = accordion.querySelector('.MuiPaper-root')
      if (root instanceof HTMLElement) {
        root.style.display = 'block'
        root.classList.add('Mui-expanded')
      }
      
      // Force summary to show expanded state
      const summary = accordion.querySelector('.MuiAccordionSummary-root')
      if (summary instanceof HTMLElement) {
        summary.classList.add('Mui-expanded')
        summary.setAttribute('aria-expanded', 'true')
      }
      
      // Ensure content is visible
      const details = accordion.querySelector('.MuiAccordionDetails-root')
      if (details instanceof HTMLElement) {
        details.style.display = 'block'
        details.style.height = 'auto'
        details.style.visibility = 'visible'
        details.style.opacity = '1'
      }
      
      // Hide expand icons
      const expandIcon = accordion.querySelector('.MuiAccordionSummary-expandIconWrapper')
      if (expandIcon instanceof HTMLElement) {
        expandIcon.style.display = 'none'
      }
    }
    
    // Expand all signer cards
    const signerCards = container.querySelectorAll('.signer-card') as NodeListOf<HTMLElement>
    for (const card of signerCards) {
      // Force expanded state
      card.classList.add('expanded')
      
      // Find the button that would trigger expansion
      const toggleButton = card.querySelector('.signer-header') as HTMLButtonElement
      if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', 'true')
        
        // Check if details section exists
        let detailsSection = card.querySelector('.signer-details') as HTMLElement
        
        // If no details section exists, we need to create one
        if (!detailsSection) {
          // Try to trigger the expand behavior - this might not work in all cases
          try {
            toggleButton.click()
            // Check again for details after click
            detailsSection = card.querySelector('.signer-details') as HTMLElement
          } catch (e) {
            console.log('Error expanding signer card:', e)
          }
          
          // If still no details, create a placeholder
          if (!detailsSection) {
            const detailsTemplate = document.createElement('div')
            detailsTemplate.className = 'signer-details'
            detailsTemplate.innerHTML = `
              <div class="detail-row">
                <div class="detail-label">Signer Information:</div>
                <div class="detail-value">See validation results for complete information</div>
              </div>
            `
            card.appendChild(detailsTemplate)
          }
        }
        
        // Ensure details are visible if they exist now
        detailsSection = card.querySelector('.signer-details') as HTMLElement
        if (detailsSection) {
          detailsSection.style.display = 'block'
          detailsSection.style.animation = 'none'
          detailsSection.style.opacity = '1'
        }
      }
    }
  }

  return (
    <div className="results-card report-card">
      <h3 className="card-title">
        {t('downloadReport')}
        <Tooltip content={tt('validationReport')}>
          <HelpCircle size={16} />
        </Tooltip>
      </h3>
      <div className="report-content">
        <div className="report-icon">
          <FileText size={32} color="#2c92e6" />
        </div>
        <h4 className="report-title">{t('reportTitle')}</h4>
        
        <p className="report-description">
          {t('reportDescription')}
        </p>
        
        <div className="report-id">
          <span className="id-label">{t('validationID')}</span>
          <span className="id-value">{validationId}</span>
        </div>
        
        <button 
          type="button"
          className="download-button"
          onClick={handleDownloadReport}
          disabled={isDownloading}
          title="Download Report"
        >
          <Download size={18} />
          <span>{isDownloading ? t('generating') : t('downloadReport')}</span>
        </button>
      </div>
      
      <style jsx>{`
        .report-card {
          background: white;
        }
        
        .report-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1rem 2rem;
        }
        
        .report-icon {
          background-color: rgba(44, 146, 230, 0.1);
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        
        .report-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.87);
          margin: 0 0 1rem;
        }
        
        .report-description {
          max-width: 600px;
          margin: 0 auto 1.5rem;
          font-size: 0.95rem;
          color: rgba(0, 0, 0, 0.7);
          line-height: 1.5;
        }
        
        .report-id {
          background-color: rgba(0, 0, 0, 0.03);
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          font-family: monospace;
          display: flex;
          gap: 0.5rem;
          align-items: center;
          width: 100%;
          max-width: 500px;
          justify-content: center;
        }
        
        .id-label {
          font-weight: 600;
          color: rgba(0, 0, 0, 0.6);
        }
        
        .id-value {
          color: rgba(0, 0, 0, 0.87);
          word-break: break-all;
        }
        
        .download-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background-color: #2c92e6;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          max-width: 250px;
          justify-content: center;
        }
        
        .download-button:hover:not(:disabled) {
          background-color: #1a75c7;
        }
        
        .download-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
} 