import React, { useEffect, useState } from 'react'
import './PendingRequests.css'
import { useNavigate } from 'react-router-dom'
import { authFetch, getUser } from '../../api'
import ApprovalFlowTracker from '../../components/ApprovalFlowTracker'

const PendingRequests = () => {
    const navigate = useNavigate()
    const user = getUser()
    const displayName = user?.name || user?.username || 'Student'

    const [requests, setRequests] = useState([])
    const [filteredRequests, setFilteredRequests] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('all') // all, submitted, in_review, approved
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [modalVisible, setModalVisible] = useState(false)

    useEffect(() => {
        fetchRequests()
    }, [])

    useEffect(() => {
        applyFilter()
    }, [filter, requests])

    const fetchRequests = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await authFetch('/api/auth/bonafide/my/')
            // Filter out fully approved or rejected for "Pending" view
            const pending = (data || []).filter(r => 
                !['approved', 'rejected'].includes(r.status)
            )
            setRequests(pending)
        } catch (err) {
            setError(err?.detail || 'Failed to load requests')
        } finally {
            setLoading(false)
        }
    }

    const applyFilter = () => {
        if (filter === 'all') {
            setFilteredRequests(requests)
        } else if (filter === 'submitted') {
            setFilteredRequests(requests.filter(r => r.status === 'submitted'))
        } else if (filter === 'in_review') {
            setFilteredRequests(requests.filter(r => 
                r.status.includes('review') || r.status.includes('approved') && r.status !== 'approved'
            ))
        }
    }

    const viewDetails = (request) => {
        setSelectedRequest(request)
        setModalVisible(true)
    }

    const getStatusColor = (status) => {
        const colors = {
            draft: '#3b82f6',
            submitted: '#f59e0b',
            tutor_review: '#f97316',
            tutor_approved: '#84cc16',
            hod_review: '#f97316',
            hod_approved: '#84cc16',
            dean_review: '#f97316',
            approved: '#22c55e',
            rejected: '#ef4444'
        }
        return colors[status] || '#6b7280'
    }

    const getStatusLabel = (status) => {
        return status ? status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'
    }

    return (
        <div className='dashboard-container'>
            <br /><br />
            <div className='logo-container' onClick={() => navigate('/student/dashboard')}>
                <img src="/logo.png" alt="logo" />
            </div>
            <div className='user-container'>{displayName}</div>
            
            <center><h2 className='titles'>Pending Requests</h2></center>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                <button 
                    onClick={() => setFilter('all')}
                    style={{
                        padding: '8px 20px',
                        background: filter === 'all' ? '#2563eb' : 'white',
                        color: filter === 'all' ? 'white' : '#2563eb',
                        border: '2px solid #2563eb',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    All ({requests.length})
                </button>
                <button 
                    onClick={() => setFilter('submitted')}
                    style={{
                        padding: '8px 20px',
                        background: filter === 'submitted' ? '#f59e0b' : 'white',
                        color: filter === 'submitted' ? 'white' : '#f59e0b',
                        border: '2px solid #f59e0b',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    Submitted ({requests.filter(r => r.status === 'submitted').length})
                </button>
                <button 
                    onClick={() => setFilter('in_review')}
                    style={{
                        padding: '8px 20px',
                        background: filter === 'in_review' ? '#f97316' : 'white',
                        color: filter === 'in_review' ? 'white' : '#f97316',
                        border: '2px solid #f97316',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    In Review ({requests.filter(r => r.status.includes('review') || r.status.includes('approved') && r.status !== 'approved').length})
                </button>
            </div>

            <div className='log-table'>
                <div className='table-card header'>
                    <div>Type</div>
                    <div>Date</div>
                    <div>Status</div>
                    <div>Progress</div>
                    <div>Action</div>
                </div>

                {loading && <div style={{ padding: 16, color: '#888' }}>Loading...</div>}
                {error && <div style={{ padding: 12, color: 'red' }}>{error}</div>}
                {!loading && !error && filteredRequests.length === 0 && (
                    <div style={{ padding: 16, color: '#888', textAlign: 'center' }}>
                        No {filter !== 'all' ? filter.replace('_', ' ') : ''} requests found.
                    </div>
                )}

                {filteredRequests.map(r => (
                    <div className='table-card' key={r.id}>
                        <div>Bonafide</div>
                        <div>{new Date(r.created_at).toLocaleDateString()}</div>
                        <div>
                            <span style={{ 
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 600,
                                backgroundColor: getStatusColor(r.status) + '20',
                                color: getStatusColor(r.status)
                            }}>
                                {getStatusLabel(r.status)}
                            </span>
                        </div>
                        <div>
                            {r.approval_chain && (
                                <ApprovalFlowTracker chain={r.approval_chain} compact={true} />
                            )}
                        </div>
                        <div>
                            <button className='view-btn' onClick={() => viewDetails(r)}>View</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            {modalVisible && selectedRequest && (
                <div onClick={() => setModalVisible(false)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: '#fff', padding: 28, width: '90%', maxWidth: 840,
                        borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ margin: 0 }}>Request Details</h2>
                            <span style={{ 
                                padding: '6px 16px',
                                borderRadius: 16,
                                fontSize: 14,
                                fontWeight: 600,
                                backgroundColor: getStatusColor(selectedRequest.status) + '20',
                                color: getStatusColor(selectedRequest.status)
                            }}>
                                {getStatusLabel(selectedRequest.status)}
                            </span>
                        </div>

                        {/* Approval Flow Visualization */}
                        {selectedRequest.approval_chain && (
                            <>
                                <h3 style={{ marginTop: 24, marginBottom: 12, color: '#374151' }}>Approval Progress</h3>
                                <ApprovalFlowTracker chain={selectedRequest.approval_chain} />
                            </>
                        )}

                        {/* Request Details */}
                        <h3 style={{ marginTop: 24, marginBottom: 12, color: '#374151' }}>Submitted Information</h3>
                        <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                            <div style={{ marginBottom: 12 }}>
                                <strong style={{ color: '#6b7280', fontSize: 13 }}>Student Name:</strong>
                                <div style={{ color: '#1f2937', fontSize: 15 }}>{selectedRequest.student_name}</div>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <strong style={{ color: '#6b7280', fontSize: 13 }}>Roll Number:</strong>
                                <div style={{ color: '#1f2937', fontSize: 15 }}>{selectedRequest.roll_number}</div>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <strong style={{ color: '#6b7280', fontSize: 13 }}>Contact:</strong>
                                <div style={{ color: '#1f2937', fontSize: 15 }}>{selectedRequest.contact}</div>
                            </div>
                            <div>
                                <strong style={{ color: '#6b7280', fontSize: 13 }}>Reason:</strong>
                                <div style={{ color: '#1f2937', fontSize: 15 }}>{selectedRequest.reason}</div>
                            </div>
                        </div>

                        {/* AI Analysis */}
                        {selectedRequest.extracted && Object.keys(selectedRequest.extracted).length > 0 && (
                            <>
                                <h3 style={{ marginTop: 20, marginBottom: 12, color: '#374151' }}>AI Analysis</h3>
                                <div style={{ background: '#eff6ff', padding: 16, borderRadius: 8, border: '1px solid #bfdbfe' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        {Object.entries(selectedRequest.extracted).filter(([k]) => k !== 'explanation').map(([key, value]) => (
                                            <div key={key}>
                                                <strong style={{ color: '#1e40af', fontSize: 12, textTransform: 'uppercase' }}>
                                                    {key.replace(/_/g, ' ')}:
                                                </strong>
                                                <div style={{ color: '#1f2937', fontSize: 14 }}>
                                                    {typeof value === 'boolean' ? (value ? '✅ Yes' : '❌ No') : (value || '—')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                            {selectedRequest.permission_file_url && (
                                <a href={selectedRequest.permission_file_url} target="_blank" rel="noopener noreferrer">
                                    <button style={{
                                        padding: '10px 20px', background: '#2563eb',
                                        color: 'white', border: 'none', borderRadius: 8,
                                        cursor: 'pointer', fontWeight: 600
                                    }}>
                                        View Document
                                    </button>
                                </a>
                            )}
                            <button onClick={() => setModalVisible(false)} style={{
                                padding: '10px 20px', background: '#6b7280',
                                color: 'white', border: 'none', borderRadius: 8,
                                cursor: 'pointer', fontWeight: 600
                            }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PendingRequests
