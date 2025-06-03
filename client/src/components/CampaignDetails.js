// client/src/components/CampaignDetails.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const CampaignDetails = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/campaigns/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCampaign(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch campaign');
      }
    };
    fetchCampaign();
  }, [id]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!campaign) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/campaigns/${id}/summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSummary(res.data.summary);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSummary();
  }, [campaign, id]);

  if (!campaign) return <div>Loading...</div>;

  const sent = campaign.logs.filter(l => l.status === 'SENT').length;
  const failed = campaign.logs.filter(l => l.status === 'FAILED').length;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Campaign Details: {campaign.name}</h2>
      <p><strong>Objective:</strong> {campaign.objective}</p>
      <p><strong>Created At:</strong> {new Date(campaign.createdAt).toLocaleString()}</p>
      <h3>Rules:</h3>
      <ul>
        {campaign.rules.map((r, idx) => (
          <li key={idx}>
            {r.table}.{r.field} {r.operator} {r.value}
          </li>
        ))}
      </ul>
      <h3>Audience & Delivery:</h3>
      <p>
        Audience Size: {campaign.audienceCount}<br/>
        Sent: {sent} | Failed: {failed}
      </p>
      <h3>Performance Summary:</h3>
      <p>{summary}</p>
    </div>
  );
};

export default CampaignDetails;
