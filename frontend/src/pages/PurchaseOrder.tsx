import { useEffect, useState } from 'react';
import { Printer, Mail, CheckCircle, X } from 'lucide-react';
import { apiFetch } from '../utils/api';

const PurchaseOrder = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedPoId, setSelectedPoId] = useState<number | ''>('');
  const [poDetails, setPoDetails] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [poHtml, setPoHtml] = useState<string>('');

  const fetchPurchaseOrders = async () => {
    try {
      setLoadingList(true);
      const res = await apiFetch('/purchase-orders');
      if (res.success && Array.isArray(res.data)) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let poList = res.data;
        if (user.role === 'Vendor') {
          poList = poList.filter((po: any) => po.vendor_id === user.id);
        }
        
        setPurchaseOrders(poList);
        if (poList.length > 0) {
          setSelectedPoId(poList[0].id);
        }
      }
    } catch (err: any) {
      console.error("Error loading PO list:", err.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    if (!selectedPoId) {
      setPoDetails(null);
      setInvoice(null);
      setPoHtml('');
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoadingDetails(true);
        // 1. Fetch PO details (meta info) and PDF HTML
        const res = await apiFetch(`/purchase-orders/${selectedPoId}/pdf`);
        if (res.success) {
          if (res.meta) setPoDetails(res.meta);
          if (res.pdf_html) setPoHtml(res.pdf_html);
        }

        // 2. Fetch all invoices to locate the one matching this po_id
        const invRes = await apiFetch('/invoices');
        if (invRes.success && Array.isArray(invRes.data)) {
          const matchingInvoice = invRes.data.find((inv: any) => inv.po_id === selectedPoId);
          if (matchingInvoice) {
            setInvoice(matchingInvoice);
          } else {
            setInvoice(null);
          }
        }
      } catch (err: any) {
        console.error("Error loading PO details:", err.message);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedPoId]);

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = async () => {
    if (!selectedPoId) return;
    setSendingEmail(true);
    try {
      // Hit email PO: POST /api/purchase-orders/:id/email
      const res = await apiFetch(`/purchase-orders/${selectedPoId}/email`, {
        method: 'POST',
        body: JSON.stringify({
          email_address: poDetails?.vendor_email
        })
      });
      if (res.success) {
        setShowEmailModal(true);
      }
    } catch (err: any) {
      alert(`Email dispatch failed: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!invoice) return;
    try {
      // Hit pay invoice: PATCH /api/invoices/:id/pay
      const res = await apiFetch(`/invoices/${invoice.id}/pay`, {
        method: 'PATCH'
      });
      if (res.success) {
        alert("Payment processed successfully!");
        // Refresh PO details
        if (selectedPoId) {
          const detailRes = await apiFetch(`/purchase-orders/${selectedPoId}`);
          if (detailRes.success) setPoDetails(detailRes.data);
        }
        // Refresh invoice list
        const invRes = await apiFetch('/invoices');
        if (invRes.success && Array.isArray(invRes.data)) {
          const matchingInvoice = invRes.data.find((inv: any) => inv.po_id === selectedPoId);
          if (matchingInvoice) setInvoice(matchingInvoice);
        }
      }
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    }
  };

  if (loadingList) {
    return <div className="p-8 text-center">Loading Purchase Orders...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Purchase Order & Invoice</h1>
          <p className="text-muted">
            {poDetails ? `PO Number: ${poDetails.po_number}` : "Manage generated purchase orders"}
          </p>
        </div>
        {poDetails && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={handlePrint}><Printer size={18} /> Print</button>
            <button className="btn btn-outline" disabled={sendingEmail} onClick={handleEmail}>
              <Mail size={18} /> {sendingEmail ? "Sending..." : "Email PO"}
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', maxWidth: '500px' }}>
        <div className="form-group">
          <label className="form-label">Select Active Purchase Order *</label>
          <select 
            className="form-control" 
            value={selectedPoId} 
            onChange={(e) => setSelectedPoId(parseInt(e.target.value, 10) || '')}
          >
            <option value="">Select PO...</option>
            {purchaseOrders.map((po) => (
              <option key={po.id} value={po.id}>{po.po_number} - {po.company_name} (₹{parseFloat(po.total_amount).toLocaleString()})</option>
            ))}
          </select>
        </div>
      </div>

      {loadingDetails ? (
        <div className="text-center p-8 card">Loading PO details...</div>
      ) : !poDetails ? (
        <div className="text-center p-8 text-muted card">
          Please select a Purchase Order reference from the dropdown above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card printable-area" style={{ padding: '0', overflow: 'hidden', alignSelf: 'center' }}>
            <div dangerouslySetInnerHTML={{ __html: poHtml }} />
          </div>

          {invoice ? (
            <div className="card mt-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '4px' }}>
              <div>
                <strong>Associated Invoice: {invoice.invoice_number}</strong>
                <div className="text-sm text-muted">Status: {invoice.status} | Tax: ₹{parseFloat(invoice.tax_amount).toFixed(2)}</div>
              </div>
              {invoice.status === 'Unpaid' ? (
                JSON.parse(localStorage.getItem('user') || '{}').role === 'Procurement Officer' ? (
                  <button className="btn btn-primary" onClick={handlePayInvoice}>
                    Pay Invoice
                  </button>
                ) : (
                  <span className="badge badge-warning">Unpaid</span>
                )
              ) : (
                <span className="badge badge-success">Slipped & Settled</span>
              )}
            </div>
          ) : (
            <div className="card mt-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '4px' }}>
              <div>
                <strong>No Invoice Generated Yet</strong>
                <div className="text-sm text-muted">Generate an invoice to request payment for this Purchase Order.</div>
              </div>
              {JSON.parse(localStorage.getItem('user') || '{}').role === 'Vendor' && (
                <button className="btn btn-primary" onClick={async () => {
                  try {
                    const res = await apiFetch('/invoices', {
                      method: 'POST',
                      body: JSON.stringify({ po_id: selectedPoId })
                    });
                    if (res.success) {
                      alert("Invoice generated successfully!");
                      // Refresh invoice list
                      const invRes = await apiFetch('/invoices');
                      if (invRes.success && Array.isArray(invRes.data)) {
                        const matchingInvoice = invRes.data.find((inv: any) => inv.po_id === selectedPoId);
                        if (matchingInvoice) setInvoice(matchingInvoice);
                      }
                    }
                  } catch (err: any) {
                    alert(`Failed to generate invoice: ${err.message}`);
                  }
                }}>
                  Generate Invoice
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {showEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{
            maxWidth: '450px',
            width: '90%',
            padding: '2rem',
            textAlign: 'center',
            position: 'relative',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <button 
              onClick={() => setShowEmailModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={24} />
            </button>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: '1.5rem' }}>
              <CheckCircle size={48} />
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Email Sent Successfully!</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              The Official Purchase Order <strong>{poDetails?.po_number}</strong> has been securely dispatched.
            </p>
            <div style={{ textAlign: 'left', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-color)' }}>RECIPIENTS:</div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                <li>{poDetails?.vendor_email || "vendor@example.com"} (Vendor)</li>
                <li>procurement@vendorbridge.com (Procurement Officer)</li>
                <li>manager@vendorbridge.com (Approving Manager)</li>
              </ul>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={() => setShowEmailModal(false)}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrder;
