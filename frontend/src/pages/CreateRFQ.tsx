import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { Check, ArrowLeft, ArrowRight, Save, Trash2, Plus } from 'lucide-react';

const CreateRFQ = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Stepper states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Furniture');
  const [deadline, setDeadline] = useState('');
  const [items, setItems] = useState<any[]>([
    { item_name: '', quantity: 1, unit: 'Pcs' }
  ]);
  
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load vendors to select from in step 2
    apiFetch('/vendors')
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setAllVendors(res.data);
        }
      })
      .catch(err => console.error("Error loading vendors:", err.message));
  }, []);

  const handleAddItem = () => {
    setItems([...items, { item_name: '', quantity: 1, unit: 'Pcs' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleVendorToggle = (vendorId: number) => {
    if (selectedVendorIds.includes(vendorId)) {
      setSelectedVendorIds(selectedVendorIds.filter(id => id !== vendorId));
    } else {
      setSelectedVendorIds([...selectedVendorIds, vendorId]);
    }
  };

  const validateStep1 = () => {
    if (!title.trim()) return "RFQ Title is required";
    if (!category || category === "Select Category") return "Category is required";
    if (!deadline) return "Submission Deadline is required";
    
    for (const item of items) {
      if (!item.item_name.trim()) return "All items must have a name";
      if (item.quantity <= 0) return "Quantity must be greater than 0";
    }
    return "";
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedVendorIds.length === 0) {
        setError("Please select at least one vendor to assign");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const createdBy = user?.id || 1; // Fallback to id 1

      const payload = {
        title,
        description,
        category,
        deadline,
        created_by: createdBy,
        items,
        vendor_ids: selectedVendorIds
      };

      const res = await apiFetch('/rfqs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        // Log activity
        await apiFetch('/activity-logs', {
          method: 'POST',
          body: JSON.stringify({
            activity_type: 'RFQ Creation',
            log_summary: `Created RFQ "${title}" with ${items.length} items assigned to ${selectedVendorIds.length} vendors`
          })
        }).catch(() => {});

        navigate('/procurement/dashboard');
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit RFQ");
    } finally {
      setLoading(false);
    }
  };

  const categories = ['IT Equipment', 'Furniture', 'Stationery'];
  const filteredVendors = allVendors.filter(v => v.category === category || selectedVendorIds.includes(v.user_id));

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Create RFQ</h1>
        <p className="text-muted">Request for Quotation Creator Wizard</p>
      </div>

      <div className="step-container" style={{ maxWidth: '600px', margin: '0 auto 3rem' }}>
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-circle">{step > 1 ? <Check size={16} /> : "1"}</div>
          <span className="text-sm">Details</span>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-circle">{step > 2 ? <Check size={16} /> : "2"}</div>
          <span className="text-sm">Vendors</span>
        </div>
        <div className={`step ${step === 3 ? 'active' : ''}`}>
          <div className="step-circle">3</div>
          <span className="text-sm">Review</span>
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: '800px', margin: '0 auto 1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '4px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {step === 1 && (
          <div>
            <h2 className="mb-4">Step 1: RFQ Details</h2>
            <div className="form-group">
              <label className="form-label">RFQ Title *</label>
              <input type="text" className="form-control" placeholder="e.g., Office Furniture Procurement Q3" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Product/Service Category *</label>
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Submission Deadline *</label>
                <input type="date" className="form-control" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} placeholder="Detailed description of requirements..." value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
            </div>

            <h3 className="mb-2 mt-4" style={{ fontSize: '1.1rem' }}>RFQ Items List</h3>
            <div className="table-container" style={{ marginBottom: '1.5rem' }}>
              <table style={{ border: '1px solid var(--border-color)' }}>
                <thead style={{ backgroundColor: 'var(--bg-input)' }}>
                  <tr>
                    <th>Item Description *</th>
                    <th style={{ width: '120px' }}>Quantity *</th>
                    <th style={{ width: '120px' }}>Unit *</th>
                    <th style={{ width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input type="text" className="form-control" placeholder="Item name" value={item.item_name} onChange={(e) => handleItemChange(index, 'item_name', e.target.value)} />
                      </td>
                      <td>
                        <input type="number" min="1" className="form-control" placeholder="0" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 0)} />
                      </td>
                      <td>
                        <select className="form-control" value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)}>
                          <option>Pcs</option>
                          <option>Boxes</option>
                          <option>Kg</option>
                          <option>Hours</option>
                        </select>
                      </td>
                      <td>
                        <button type="button" className="text-danger" onClick={() => handleRemoveItem(index)}>
                          <Trash2 size={18} color="var(--danger)"/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={handleAddItem} className="btn btn-outline mt-4" style={{ fontSize: '0.875rem' }}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Next: Select Vendors <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="mb-4">Step 2: Assign Vendors</h2>
            <p className="text-muted mb-4">Select the suppliers to invite for this RFQ (Category: {category})</p>

            {filteredVendors.length === 0 ? (
              <div className="text-center p-8 text-muted border" style={{ borderRadius: '6px' }}>
                No suppliers registered in category "{category}". Go to Vendors page to add some first.
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Select</th>
                      <th>Company Name</th>
                      <th>Category</th>
                      <th>Contact Person</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor.user_id}>
                        <td>
                          <input type="checkbox" style={{ transform: 'scale(1.2)', cursor: 'pointer' }} checked={selectedVendorIds.includes(vendor.user_id)} onChange={() => handleVendorToggle(vendor.user_id)} />
                        </td>
                        <td className="font-bold">{vendor.company_name}</td>
                        <td>{vendor.category}</td>
                        <td>{vendor.name}</td>
                        <td>★ {parseFloat(vendor.rating_indicator || '5.0').toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Next: Review RFQ <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="mb-4">Step 3: Review and Submit</h2>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent)' }}>{title}</h3>
              <p style={{ margin: '0 0 1rem 0' }}>{description || "No description provided."}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div><strong>Category:</strong> {category}</div>
                <div><strong>Deadline:</strong> {new Date(deadline).toLocaleDateString()}</div>
                <div><strong>Items Count:</strong> {items.length}</div>
                <div><strong>Assigned Suppliers:</strong> {selectedVendorIds.length} selected</div>
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem 0' }}>RFQ Items Summary</h4>
              <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                {items.map((it, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{it.item_name} - {it.quantity} {it.unit}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button type="button" className="btn btn-primary" disabled={loading} onClick={handleSubmit}>
                <Save size={16} /> {loading ? "Creating..." : "Publish RFQ"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateRFQ;
