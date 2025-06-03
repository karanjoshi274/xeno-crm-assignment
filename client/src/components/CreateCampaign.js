// client/src/components/CreateCampaign.js
import React, { useState } from 'react';
import axios from 'axios';

const initialRule = { table: 'customer', field: '', operator: '', value: '' };

const CreateCampaign = () => {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [rules, setRules] = useState([ { ...initialRule } ]);
  const [previewCount, setPreviewCount] = useState(null);

  // Rule fields for customer and order
  const customerFields = [
    { value: 'age', label: 'Age' },
    { value: 'city', label: 'City' }
  ];
  const orderFields = [
    { value: 'amount', label: 'Order Amount' },
    { value: 'product', label: 'Product' }
  ];

  // Handler to update a rule
  const handleRuleChange = (index, key, value) => {
    const newRules = [...rules];
    newRules[index][key] = value;
    // Reset dependent fields
    if (key === 'table') {
      newRules[index].field = '';
      newRules[index].operator = '';
      newRules[index].value = '';
    }
    if (key === 'field') {
      newRules[index].operator = '';
      newRules[index].value = '';
    }
    setRules(newRules);
  };

  const addRule = () => {
    setRules([...rules, { ...initialRule }]);
  };

  const removeRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
  };

  // Get operator options based on field type
  const getOperators = (field) => {
    if (['age', 'amount'].includes(field)) {
      return [
        { value: 'eq', label: '=' },
        { value: 'gt', label: '>' },
        { value: 'lt', label: '<' }
      ];
    } else {
      return [
        { value: 'eq', label: '=' },
        { value: 'neq', label: '≠' }
      ];
    }
  };

  // Preview audience
  const handlePreview = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/campaigns/preview`,
        { rules },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPreviewCount(res.data.count);
    } catch (err) {
      console.error('Preview failed', err);
      alert('Failed to preview audience');
    }
  };

  // Create campaign
  const handleCreate = async () => {
    if (!name || !objective) {
      alert('Please provide campaign name and objective');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/campaigns`,
        { name, objective, rules },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Campaign created successfully');
      window.location.href = '/campaigns'; // redirect to history
    } catch (err) {
      console.error('Create failed', err);
      alert('Failed to create campaign');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Create Campaign</h2>
      <div>
        <label>Name: </label>
        <input value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label>Objective: </label>
        <input value={objective} onChange={e => setObjective(e.target.value)} style={{ width: '400px' }} />
      </div>
      <h3>Audience Rules</h3>
      {rules.map((rule, idx) => (
        <div key={idx} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px' }}>
          <select
            value={rule.table}
            onChange={e => handleRuleChange(idx, 'table', e.target.value)}
          >
            <option value="customer">Customer</option>
            <option value="order">Order</option>
          </select>

          <select
            value={rule.field}
            onChange={e => handleRuleChange(idx, 'field', e.target.value)}
            style={{ marginLeft: '10px' }}
          >
            <option value="">Select Field</option>
            {(rule.table === 'customer' ? customerFields : orderFields).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={rule.operator}
            onChange={e => handleRuleChange(idx, 'operator', e.target.value)}
            style={{ marginLeft: '10px' }}
          >
            <option value="">Operator</option>
            {getOperators(rule.field).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <input
            value={rule.value}
            onChange={e => handleRuleChange(idx, 'value', e.target.value)}
            placeholder="Value"
            style={{ marginLeft: '10px' }}
          />

          <button onClick={() => removeRule(idx)} style={{ marginLeft: '10px' }}>Remove</button>
        </div>
      ))}
      <button onClick={addRule}>+ Add Rule</button>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handlePreview}>Preview Audience</button>
        {previewCount !== null && <span style={{ marginLeft: '10px' }}>Audience size: {previewCount}</span>}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleCreate}>Create Campaign</button>
      </div>
    </div>
  );
};

export default CreateCampaign;
