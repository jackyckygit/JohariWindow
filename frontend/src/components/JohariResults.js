import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/JohariWindowTheme.css';
import { IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const JohariResults = ({ name, adjectives }) => {
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [selfAdjectives, setSelfAdjectives] = useState([]);
  const [peerAssessments, setPeerAssessments] = useState([]);
  const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '' });
  const [johariData, setJohariData] = useState({
    arena: [],
    blindSpot: [],
    facade: [],
    unknown: []
  });

  useEffect(() => {
    calculateJohariWindow();
  }, [selfAdjectives, peerAssessments]);

  useEffect(() => {
    updateAssessments();
  }, []);

  const updateAssessments = async()=>{
    axios.get(`/jw-api/johari/users?userName=${name}&peerAssementFromSameGroup=true`).then((res)=>{
      let user = res.data.data[0]
      setSelfAdjectives(user.selfAssessment)
      setPeerAssessments(user.peerAssessments)
    }).catch((err)=>{
      console.error('Error getting peers', err);
    })
  }

  const handleRefreshPeer = async () => {
    updateAssessments()
  };

  /**
   * combine repeated items in array
   * @param {*} list with some reducdant items
   * @returns 
   */
  const reduceAdj = (list) => {
    let combined = list.reduce((acc, curr)=>{
      if (acc[curr] == null){
        acc[curr] = 1;
      }
      else {
        acc[curr]+=1;
      }
      return acc;
    }, {} )
    return Object.entries(combined).map(([k, v])=>(v==1)?k:`${k}x${v}`)
  }

  const calculateJohariWindow = () => {
    const peerAdjectives = peerAssessments.flatMap(assessment => assessment.adjectives);
    const peerAdjectivesSet = new Set(peerAdjectives);
    const selfAdjectivesSet = new Set(selfAdjectives);
    const blindSpotRep = peerAdjectives.filter(adj => !selfAdjectivesSet.has(adj));

    const arena = reduceAdj(peerAdjectives.filter(p=>selfAdjectivesSet.has(p)));
    const blindSpot = reduceAdj(blindSpotRep);
    const facade = selfAdjectives.filter(adj => !peerAdjectivesSet.has(adj));
    const unknown = adjectives.filter(adj => !selfAdjectivesSet.has(adj) && !peerAdjectivesSet.has(adj));

    setJohariData({ arena, blindSpot, facade, unknown });
  };

  const handleDownloadReport = async () => {
    if (!userInfo.name || !userInfo.email || !userInfo.phone) {
      alert('Please fill in all fields to download the report.');
      return;
    }
    try {
      await axios.post('/jw-api/send-report', { 
        ...userInfo, 
        johariData: { 
          selfAdjectives, 
          peerAssessments,
          johariWindow: johariData
        } 
      });
      alert('Report has been sent to your email.');
      setShowDownloadPopup(false);
    } catch (error) {
      alert('Failed to send report. Please try again.');
    }
  };

  const renderAdjectiveList = (_adjectives) => {
    return (
      <div className="adjective-list">
        {_adjectives.map(adj => <span key={adj} className="adjective-item">{adj}</span>)}
      </div>
    );
  };

  return (
    <div className="johari-results">
      <div className="johari-container">
        <div className="johari-window">
          <h2 className='tab-title'>根據以下友伴，這是你的周哈里窗
            <IconButton aria-label="refresh" size='large' color='secondary' onClick={handleRefreshPeer}>
              <RefreshIcon fontSize="inherit"/>
            </IconButton>
          </h2>
          <div className="peer-list">
            {peerAssessments.map(peer => (
              <button
                key={peer.peerName}
                type="button"
                className="peer-item"
              >
                {peer.peerName}
              </button>
            ))}
          </div>
          <div className="johari-grid">
            <div className="johari-quadrant">
              <h3>開放我</h3>
              {renderAdjectiveList(johariData.arena)}
            </div>
            <div className="johari-quadrant">
              <h3>盲目我</h3>
              {renderAdjectiveList(johariData.blindSpot)}
            </div>
            <div className="johari-quadrant">
              <h3>隱藏我</h3>
              {renderAdjectiveList(johariData.facade)}
            </div>
            <div className="johari-quadrant">
              <h3>未知我</h3>
              {renderAdjectiveList(johariData.unknown)}
            </div>
          </div>
        </div>
      </div>
      {showDownloadPopup && (
        <div className="download-popup">
          <h3>Enter your details to receive the report</h3>
          <input
            type="text"
            placeholder="Name"
            value={userInfo.name}
            onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={userInfo.email}
            onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={userInfo.phone}
            onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
            required
          />
          <button onClick={handleDownloadReport}>Send Report</button>
          <button onClick={() => setShowDownloadPopup(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default JohariResults;