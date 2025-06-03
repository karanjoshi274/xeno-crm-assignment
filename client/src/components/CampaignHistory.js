// client/src/components/CampaignHistory.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CampaignHistory = () => {
  const [campaigns, setCampaigns] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/campaigns`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCampaigns(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch campaigns');
      }
    };
    fetchCampaigns();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Campaign History</h2>
      {campaigns.map(c => {
        const sent = c.logs.filter(l => l.status === 'SENT').length;
        const failed = c.logs.filter(l => l.status === 'FAILED').length;
        return (
          <div
            key={c._id}
            style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', cursor: 'pointer' }}
            onClick={() => navigate(`/campaigns/${c._id}`)}
          >
            <strong>{c.name}</strong> <em>({new Date(c.createdAt).toLocaleString()})</em><br/>
            Audience: {c.audienceCount} | Sent: {sent} | Failed: {failed}
          </div>
        );
      })}
    </div>
  );
};

export default CampaignHistory;
