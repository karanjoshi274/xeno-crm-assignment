// client/src/components/CreateCampaign.js
import React, { useState } from 'react';
import axios from 'axios';

const initialRule = { table: 'customer', field: '', operator: '', value: '' };

const CreateCampaign = () => {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [rules, setRules] = useState([{ ...initialRule }]);
  const [previewCount, setPreviewCount] = useState(null);

  const customerFields = [
    { value: 'age', label: 'Age' },
    { value: 'city', label: 'City' },
  ];
  const orderFields = [
    { value: 'amount', label: 'Order Amount' },
    { value: 'product', label: 'Product' },
  ];

  const handleRuleChange = (index, key, value) => {
    const newRules = [...rules];
    newRules[index][key] = value;
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

  const getOperators = (field) => {
    if (['age', 'amount'].includes(field)) {
      return [
        { value: 'eq', label: '=' },
        { value: 'gt', label: '>' },
        { value: 'lt', label: '<' },
      ];
    } else {
      return [
        { value: 'eq', label: '=' },
        { value: 'neq', label: '≠' },
      ];
    }
  };

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
      window.location.href = '/campaigns';
    } catch (err) {
      console.error('Create failed', err);
      alert('Failed to create campaign');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-4">Create Campaign</h2>
        <div className="mb-4">
          <label className="block font-medium mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="mb-6">
          <label className="block font-medium mb-1">Objective</label>
          <input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <h3 className="text-lg font-semibold mb-2">Audience Rules</h3>
        {rules.map((rule, idx) => (
          <div key={idx} className="flex flex-wrap gap-2 items-center mb-4">
            <select
              value={rule.table}
              onChange={(e) => handleRuleChange(idx, 'table', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value="customer">Customer</option>
              <option value="order">Order</option>
            </select>

            <select
              value={rule.field}
              onChange={(e) => handleRuleChange(idx, 'field', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Select Field</option>
              {(rule.table === 'customer' ? customerFields : orderFields).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={rule.operator}
              onChange={(e) => handleRuleChange(idx, 'operator', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Operator</option>
              {getOperators(rule.field).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <input
              value={rule.value}
              onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
              placeholder="Value"
              className="border border-gray-300 rounded px-2 py-1"
            />

            <button
              onClick={() => removeRule(idx)}
              className="text-red-600 hover:underline ml-2"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addRule}
          className="mb-4 text-indigo-600 hover:underline"
        >
          + Add Rule
        </button>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handlePreview}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Preview Audience
          </button>
          {previewCount !== null && (
            <span className="text-gray-700">Audience size: {previewCount}</span>
          )}
        </div>

        <button
          onClick={handleCreate}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Create Campaign
        </button>
      </div>
    </div>
  );
};

export default CreateCampaign;
