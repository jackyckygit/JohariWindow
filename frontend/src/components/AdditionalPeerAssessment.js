import React, { useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';

const AdditionalPeerAssessment = ({ onSubmit, onCancel, peerIndex }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [generateQR, setGenerateQR] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Name and email are required');
      return;
    }
    try {
      // Generate QR code if checked
      let qrCodeData = null;
      if (generateQR) {
        qrCodeData = await QRCode.toDataURL(`https://your-app-url.com/peer-assessment/${peerIndex}`);
      }
      
      // Send email with or without QR code
      await axios.post('/jw-api/send-peer-invitation', { name, email, qrCodeData });
      
      onSubmit({ name, email, qrCodeSent: generateQR });
    } catch (error) {
      setError('Failed to send invitation. Please try again.');
    }
  };

  return (
    <div className="additional-peer-assessment">
      <h3>Add Peer {peerIndex}</h3>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Peer's Name"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Peer's Email"
          required
        />
        <label>
          <input
            type="checkbox"
            checked={generateQR}
            onChange={(e) => setGenerateQR(e.target.checked)}
          />
          Generate QR Code
        </label>
        <button type="submit">Send Invitation</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </form>
    </div>
  );
};

export default AdditionalPeerAssessment;