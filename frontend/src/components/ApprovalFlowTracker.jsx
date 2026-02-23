import React from 'react'
import './ApprovalFlowTracker.css'

/**
 * Visual approval flow tracker showing Tutor → HOD → Dean progress
 * 
 * Props:
 * - chain: Array from request.approval_chain API field
 * - compact: boolean (show mini version)
 */
const ApprovalFlowTracker = ({ chain, compact = false }) => {
    if (!chain || chain.length === 0) return null

    const getStepIcon = (status) => {
        switch(status) {
            case 'approved': return '✅'
            case 'pending': return '👤'
            case 'waiting': return '⏳'
            case 'rejected': return '❌'
            default: return '○'
        }
    }

    const getStepColor = (status) => {
        switch(status) {
            case 'approved': return '#22c55e'  // green
            case 'pending': return '#f59e0b'    // orange
            case 'waiting': return '#9ca3af'    // gray
            case 'rejected': return '#ef4444'   // red
            default: return '#d1d5db'
        }
    }

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return null
        const date = new Date(timestamp)
        return date.toLocaleDateString('en-IN', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (compact) {
        return (
            <div className="approval-flow-compact">
                {chain.map((step, i) => (
                    <div 
                        key={i} 
                        className="flow-dot" 
                        style={{ backgroundColor: getStepColor(step.status) }}
                        title={`${step.step}: ${step.status}`}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="approval-flow-tracker">
            <div className="flow-steps">
                {chain.map((step, index) => (
                    <React.Fragment key={index}>
                        <div className={`flow-step ${step.status}`}>
                            <div className="step-icon-wrapper">
                                <div 
                                    className="step-icon" 
                                    style={{ 
                                        backgroundColor: getStepColor(step.status),
                                        color: 'white'
                                    }}
                                >
                                    {getStepIcon(step.status)}
                                </div>
                            </div>
                            
                            <div className="step-details">
                                <div className="step-label">{step.step}</div>
                                
                                {step.approver && (
                                    <div className="step-approver">{step.approver}</div>
                                )}
                                
                                {step.timestamp && (
                                    <div className="step-timestamp">
                                        {formatTimestamp(step.timestamp)}
                                    </div>
                                )}
                                
                                {step.status === 'pending' && (
                                    <div className="step-status-text">In Review</div>
                                )}
                                
                                {step.status === 'waiting' && (
                                    <div className="step-status-text">Waiting</div>
                                )}
                                
                                {step.comment && (
                                    <div className="step-comment" title={step.comment}>
                                        💬 Has comment
                                    </div>
                                )}
                            </div>
                        </div>

                        {index < chain.length - 1 && (
                            <div 
                                className={`flow-connector ${chain[index + 1].status !== 'waiting' ? 'active' : ''}`}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}

export default ApprovalFlowTracker
