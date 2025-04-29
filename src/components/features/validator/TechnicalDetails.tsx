'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  ChevronDown, 
  Clock, 
  Shield,
  Check,
  AlertTriangle,
  Info,
  Package,
  BrainCircuit,
  FileDown,
  HelpCircle
} from 'lucide-react'
import "@/styles/certificate-technical.css"
import "@/styles/tooltip.css"
import { formatDistanceToNow } from 'date-fns'
import { parseEtsiReport, calculateValidationScore, extractTrustChain } from '@/utils/etsiReportUtils'
import type { TechnicalValidationData, ValidationScore, TrustChain } from '@/types/etsiReport'
import { 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Box, 
  Typography,
  useTheme,
  alpha,
  Chip,
  Button
} from '@mui/material'

interface TechnicalDetailsProps {
  validationId: string
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip = ({ content, children }: TooltipProps) => {
  return (
    <div className="tooltip-container">
      {children}
      <div className="tooltip-content">{content}</div>
    </div>
  );
};

const TechnicalDetails: React.FC<TechnicalDetailsProps> = ({ validationId }) => {
  const t = useTranslations('TechnicalDetails')
  const tt = useTranslations('Tooltips')
  const theme = useTheme()
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [xmlReport, setXmlReport] = useState<string | null>(null)
  const [technicalData, setTechnicalData] = useState<TechnicalValidationData | null>(null)
  const [validationScore, setValidationScore] = useState<ValidationScore | null>(null)
  const [trustChainData, setTrustChainData] = useState<TrustChain | null>(null)
  const [expandedSections, setExpandedSections] = useState<{
    summary: boolean
    trustChain: boolean
    timeline: boolean
    constraints: boolean
  }>({
    summary: true,
    trustChain: false,
    timeline: false,
    constraints: false,
  })

  // Fetch the ETSI report
  useEffect(() => {
    const fetchReport = async () => {
      if (!validationId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/reports/${validationId}/etsi`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ETSI report: ${response.status} ${response.statusText}`)
        }
        
        const xml = await response.text()
        setXmlReport(xml)
        
        // Parse the report using utility functions
        const parsedData = parseEtsiReport(xml)
        if (!parsedData) {
          throw new Error('Failed to parse ETSI report')
        }
        
        setTechnicalData(parsedData)
        setValidationScore(calculateValidationScore(parsedData))
        setTrustChainData(extractTrustChain(xml))
        setLoading(false)
      } catch (err) {
        console.error('Error fetching ETSI report:', err)
        setError(err instanceof Error ? err.message : 'Failed to load technical details')
        setLoading(false)
      }
    }

    fetchReport()
  }, [validationId])

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const handleAccordionChange = (section: keyof typeof expandedSections) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: isExpanded,
    }))
  }

  const downloadRawReport = () => {
    if (!xmlReport) return

    const blob = new Blob([xmlReport], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'technical-report.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="technical-details-container">
        <h3 className="card-title">
          {t('title')}
          <Tooltip content={tt('technicalDetails')}>
            <HelpCircle size={16} />
          </Tooltip>
        </h3>
        <div className="technical-details-loading">
          <div className="loading-spinner" />
          <p>{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !technicalData) {
    return (
      <div className="technical-details-container">
        <h3 className="card-title">
          {t('title')}
          <Tooltip content={tt('technicalDetails')}>
            <HelpCircle size={16} />
          </Tooltip>
        </h3>
        <div className="technical-details-error">
          <AlertTriangle size={32} />
          <h3>{t('errorLoadingDetails')}</h3>
          <p>{error || t('reportUnavailable')}</p>
        </div>
      </div>
    )
  }

  const overallScore = validationScore?.overall || 0
  const timelineEvents = technicalData.timeInfo ? [
    {
      timestamp: technicalData.timeInfo.ValidationTime,
      type: t('validation.timeTitle'),
      description: t('validation.timeDescription')
    },
    ...(technicalData.timeInfo.BestSignatureTime ? [{
      timestamp: technicalData.timeInfo.BestSignatureTime.POETime,
      type: t('signature.timeTitle'),
      description: `${t('signature.timeDescription')} ${technicalData.timeInfo.BestSignatureTime.TypeOfProof}`
    }] : [])
  ] : []
  
  // Update status display logic to better align with ValidationResults component
//   const getStatusClassName = () => {
//     // For technical details, consider the validation as passed if one of these conditions is met
//     if (technicalData.mainIndication.includes('TOTAL_PASSED') || 
//         technicalData.mainIndication.includes('PASSED')) {
//       return 'passed';
//     }
    
//     // Check for "requirements not met" type of status
//     if (technicalData.mainIndication.includes('INDETERMINATE')) {
//       return 'indeterminate';
//     }
    
//     // Default to failed
//     return 'failed';
//   }
  
  // Translate technical status to user-friendly text
//   const getStatusText = () => {
//     const status = getStatusClassName();
//     if (status === 'passed') return t('statusPassed');
//     if (status === 'indeterminate') return t('statusIndeterminate');
//     return t('statusFailed');
//   }

  const constraintsPassed = technicalData.constraints.filter(c => 
    c.ValidationStatus?.MainIndication.includes('passed')).length;
  const totalConstraints = technicalData.constraints.length;

  return (
    <div className="technical-details-container">
      <h3 className="card-title">
        {t('title')}
        <Tooltip content={tt('technicalDetails')}>
          <HelpCircle size={16} />
        </Tooltip>
      </h3>
      
      <div className="technical-panel">
        <div className="technical-overview">
          <div className="overview-score" style={{ flex: '1 1 100%', maxWidth: '100%' }}>
            <div 
              className="score-circle" 
              style={{ backgroundColor: `${getScoreColor(overallScore)}20`, borderColor: getScoreColor(overallScore) }}
            >
              <span className="score-value" style={{ color: getScoreColor(overallScore) }}>
                {overallScore}
              </span>
            </div>
            <div className="score-label">{t('overallScore')}</div>
            
            {/* Constraints info */}
            <div className="constraints-info">
              <span className="constraints-label">{t('validationConstraints')}</span>
              <div className="constraints-values">
                <span className="constraints-passed">{constraintsPassed} {t('passed')}</span>
                <span className="constraints-separator">/</span>
                <span className="constraints-total">{totalConstraints} {t('total')}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="technical-accordions">
          {/* Summary Section */}
          <Accordion
            expanded={expandedSections.summary}
            onChange={handleAccordionChange('summary')}
            elevation={0}
            sx={{ 
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
              borderRadius: '8px', 
              overflow: 'hidden',
              mb: 2,
              '&:before': { display: 'none' } // Remove the default divider
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown />}
              sx={{ 
                borderBottom: expandedSections.summary ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                px: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Shield size={18} style={{ marginRight: 12, color: theme.palette.primary.main }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {t('summaryTitle')}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2.5 }}>
              {validationScore && (
                <div className="score-breakdown">
                  {validationScore.items.map((item) => {
                    // Map the item name to translation key
                    let nameTKey = '';
                    let descTKey = '';
                    switch(item.name) {
                      case 'Validation Constraints':
                        nameTKey = 'scoreItems.validationConstraints';
                        descTKey = 'scoreItems.constraintsDescription';
                        break;
                      case 'Cryptographic Security':
                        nameTKey = 'scoreItems.cryptographicSecurity';
                        descTKey = 'scoreItems.cryptographicDescription';
                        break;
                      case 'Signature Attributes':
                        nameTKey = 'scoreItems.signatureAttributes';
                        descTKey = 'scoreItems.attributesDescription';
                        break;
                      case 'Signature Format':
                        nameTKey = 'scoreItems.signatureFormat';
                        descTKey = 'scoreItems.formatDescription';
                        break;
                      default:
                        // Default values already set
                    }
                    
                    // Extract count and total from description if needed
                    let count = 0;
                    let total = 0;
                    if (item.description.includes(' of ')) {
                      const matches = item.description.match(/(\d+) of (\d+)/);
                      if (matches && matches.length >= 3) {
                        count = Number.parseInt(matches[1], 10);
                        total = Number.parseInt(matches[2], 10);
                      }
                    }
                    
                    return (
                      <div key={item.name} className="score-item">
                        <div className="score-item-header">
                          <span className="score-name">{nameTKey ? t(nameTKey) : item.name}</span>
                          <span className="score-value-small">{item.score}</span>
                        </div>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ 
                              width: `${item.score}%`, 
                              backgroundColor: getScoreColor(item.score) 
                            }}
                          />
                        </div>
                        <p className="score-description">
                          {descTKey && count && total 
                            ? t(descTKey, { count, total }) 
                            : descTKey 
                              ? t(descTKey)
                              : item.description}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </AccordionDetails>
          </Accordion>
          
          {/* Trust Chain Section */}
          <Accordion
            expanded={expandedSections.trustChain}
            onChange={handleAccordionChange('trustChain')}
            elevation={0}
            sx={{ 
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
              borderRadius: '8px', 
              overflow: 'hidden',
              mb: 2,
              '&:before': { display: 'none' } // Remove the default divider
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown />}
              sx={{ 
                borderBottom: expandedSections.trustChain ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                px: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <BrainCircuit size={18} style={{ marginRight: 12, color: theme.palette.primary.main }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
                  {t('trustChain')}
                </Typography>
                {trustChainData && trustChainData.nodes.length > 0 && (
                  <Chip 
                    label={trustChainData.nodes.length}
                    size="small"
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2.5 }}>
              {trustChainData && trustChainData.nodes.length > 0 ? (
                <div className="trust-chain">
                  {trustChainData.nodes.map((node, index) => {
                    const nodeType = node.type.toLowerCase();
                    const nodeTypeLabel = nodeType === 'signer' 
                      ? t('chainNode.signer')
                      : nodeType === 'trustanchor' 
                        ? t('chainNode.trustAnchor')
                        : t('chainNode.certificate');
                        
                    return (
                      <div 
                        key={node.id} 
                        className={`chain-node ${nodeType}`}
                      >
                        {index > 0 && <div className="chain-connector" />}
                        <div className="node-icon">
                          {nodeType === 'signer' ? (
                            <Package size={16} />
                          ) : nodeType === 'trustanchor' ? (
                            <Shield size={16} />
                          ) : (
                            <Info size={16} />
                          )}
                        </div>
                        <div className="node-content">
                          <h5 className="node-title">{nodeTypeLabel}</h5>
                          <p className="node-id">{node.id}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-data-message">{t('noTrustChain')}</p>
              )}
            </AccordionDetails>
          </Accordion>
          
          {/* Timeline Section */}
          <Accordion
            expanded={expandedSections.timeline}
            onChange={handleAccordionChange('timeline')}
            elevation={0}
            sx={{ 
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
              borderRadius: '8px', 
              overflow: 'hidden',
              mb: 2,
              '&:before': { display: 'none' } // Remove the default divider
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown />}
              sx={{ 
                borderBottom: expandedSections.timeline ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                px: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Clock size={18} style={{ marginRight: 12, color: theme.palette.primary.main }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
                  {t('validationTimeline')}
                </Typography>
                {timelineEvents.length > 0 && (
                  <Chip 
                    label={timelineEvents.length}
                    size="small"
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2.5 }}>
              {timelineEvents.length > 0 ? (
                <div className="timeline">
                  {timelineEvents.map((event, i) => (
                    <div key={`${event.type}-${i}`} className="timeline-item">
                      <div className="timeline-marker" />
                      <div className="timeline-content">
                        <div className="timeline-time">
                          {event.timestamp ? new Date(event.timestamp).toLocaleString() : t('unknownTime')}
                          {event.timestamp && ` (${formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })})`}
                        </div>
                        <h5 className="timeline-title">{event.type}</h5>
                        <p className="timeline-details">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data-message">{t('noTimelineEvents')}</p>
              )}
            </AccordionDetails>
          </Accordion>
          
          {/* Constraints Section */}
          <Accordion
            expanded={expandedSections.constraints}
            onChange={handleAccordionChange('constraints')}
            elevation={0}
            sx={{ 
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
              borderRadius: '8px', 
              overflow: 'hidden',
              mb: 2,
              '&:before': { display: 'none' } // Remove the default divider
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown />}
              sx={{ 
                borderBottom: expandedSections.constraints ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                px: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <AlertTriangle size={18} style={{ marginRight: 12, color: theme.palette.warning.main }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
                  {t('validationConstraints')}
                </Typography>
                {technicalData.constraints.length > 0 && (
                  <Chip 
                    label={technicalData.constraints.length}
                    size="small"
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2.5 }}>
              {technicalData.constraints.length > 0 ? (
                <div className="constraints-list">
                  {technicalData.constraints.map((constraint, i) => {
                    const status = constraint.ValidationStatus?.MainIndication.includes('passed') 
                      ? 'passed' 
                      : constraint.ValidationStatus?.MainIndication.includes('failed')
                        ? 'failed'
                        : 'disabled';
                        
                    return (
                      <div 
                        key={`${constraint.ValidationConstraintIdentifier}-${i}`} 
                        className={`constraint-item ${status}`}
                      >
                        <div className="constraint-status">
                          <div className={`status-icon ${status}`}>
                            {status === 'passed' ? (
                              <Check size={20} />
                            ) : status === 'failed' ? (
                              <AlertTriangle size={20} />
                            ) : (
                              <Info size={20} />
                            )}
                          </div>
                        </div>
                        <div className="constraint-content">
                          <h5 className="constraint-name">{constraint.ValidationConstraintIdentifier}</h5>
                          <p className="constraint-detail">
                            {constraint.ValidationStatus 
                              ? `${constraint.ValidationStatus.MainIndication}${constraint.ValidationStatus.SubIndication 
                                ? ` - ${constraint.ValidationStatus.SubIndication}` 
                                : ''}`
                              : t('noValidationDetails')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-data-message">{t('noConstraints')}</p>
              )}
            </AccordionDetails>
          </Accordion>
        </div>
        
        <div className="technical-footer">
          <Button
            variant="outlined"
            startIcon={<FileDown size={16} />}
            onClick={downloadRawReport}
            sx={{ px: 3 }}
          >
            {t('downloadRawReport')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TechnicalDetails 