import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Snackbar, IconButton } from '@mui/material';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import '../styles/GreatLakesTheme.css';

const PeerAssessment = ({ name, minAdj, maxAdj , group, adjectives, onSubmit, userName, onNavigate }) => {
  const [selectedAdjectives, setSelectedAdjectives] = useState([]);
  const [progress, setProgress] = useState(0);
  const [peerName, setPeerName] = useState('');
  const [peerEmail, setPeerEmail] = useState('');
  const [peerList, setPeerList] = useState([]);
  const [alert, setAlert] = useState({ open: false, message: "", severity: null})

  useEffect(() => {
    setProgress((selectedAdjectives.length / minAdj) * 100);
  }, [selectedAdjectives]);

  useEffect(() => {
    updatePeers()
  }, []);

  const updatePeers = async()=>{
    axios.get(`/jw-api/johari/users?group=${group}`).then((res)=>{
      let userList = res.data.data
      let peers = userList.filter(v=>v.name != name)
      console.log(peers)
      setPeerList(peers)
    }).catch((err)=>{
      console.error('Error getting peers', err);
    })
  }

  const getProgressColor = (progress) => {
    if (progress <= 20) return '#8B0000';
    if (progress <= 40) return '#FF0000';
    if (progress <= 60) return '#FFA500';
    if (progress <= 80) return '#FFFF00';
    if (progress < 100) return '#90EE90';
    return '#006400';
  };

  const handleAdjectiveToggle = (adjective) => {
    if (peerName==''){
      setAlert({
        open: true, message: `Please select a peer first`, severity: "error"
      })
    }
    else {
      setSelectedAdjectives(prev => {
        if (prev.includes(adjective)) {
          return prev.filter(a => a !== adjective);
        } else if (maxAdj && prev.length < maxAdj) {
          return [...prev, adjective];
        } else {
          setAlert({
            open: true, message: `Maximum allowed is ${maxAdj} adjectives. Please uncheck one to select a new adjective.`, severity: "error"
          })
          return prev;
        }
      });
    }
  };

  const handleSelectedPeer = (pn) => {
    setPeerName(pn);
    // get the existing assessment of pn by current user
    axios.get(`/jw-api/johari/users?userName=${pn}`).then((res)=>{
      let user = res.data.data[0]
      let peerAssessments = user.peerAssessments;
      let assesserted = peerAssessments.find(pa=>pa.peerName==name)
      if (assesserted != null){
        setSelectedAdjectives(assesserted.adjectives)
      }
      else {
        setSelectedAdjectives([])
      }
    }).catch((err)=>{
      console.error('Error getting userInfo', err);
    })

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!peerName.trim()) {
      setAlert({
        open: true, message: 'Please select a peer.', severity: "error"
      })
      return;
    }
    if (maxAdj){
      if (selectedAdjectives.length < minAdj || selectedAdjectives.length > maxAdj) {
        setAlert({
          open: true, message: `Please select ${minAdj}-${maxAdj} adjectives.`, severity: "error"
        })
        return;
      }
    }
    else {
      if (selectedAdjectives.length < minAdj) {
        setAlert({
          open: true, message: `Please select at least ${minAdj} adjectives.`, severity: "error"
        })
        return;
      }
    }

    try {
      const response = await axios.post('/jw-api/johari/submit-peer', {
        userName, // Using the userName prop in the request
        peerName,
        group,
        peerEmail,
        adjectives: selectedAdjectives
      });
      
      if (response.data.success) {
        onSubmit({ peerName, adjectives: selectedAdjectives });
        setAlert({
          open: true, message: "Submitted successfully", severity: "success"
        })
      } else {
        setAlert({
          open: true, message: response.data.message, severity: "error"
        })
      }
    } catch (error) {
      console.error('Error submitting peer assessment:', error);
      setAlert({
        open: true, message: error.response?.data?.message || error.message, severity: "error"
      })
    }
  };

  const handleRefreshPeer = async () => {
    updatePeers()
  };

  return (
    <div className="container">
      <h2 className='tab-title'>選擇要評估的友伴
        <IconButton aria-label="refresh" size='large' color='secondary' onClick={handleRefreshPeer}>
          <RefreshIcon fontSize="inherit"/>
        </IconButton>
      </h2>
      <div className="peer-list">
        {peerList.map(peer => (
          <button
            key={peer.name}
            type="button"
            className={`peer-btn ${(peer.name == peerName) ? 'selected' : ''}`}
            onClick={() => handleSelectedPeer(peer.name)}
          >
            {peer.name}
          </button>
        ))}
      </div>
      {/* <div className="refresh-btn">
        <button 
          onClick={handleRefreshPeer} 
          className="refresh-peer-btn"
        >
          刷新友伴
        </button>
      </div> */}
      {
        peerName && <div>
        {
          (maxAdj)? (
            <h2>請選出{minAdj}-{maxAdj}個{peerName}的特質</h2>
          ):(
            <h2>請選出最少{minAdj}個{peerName}的特質</h2>
          )
        }
        </div>
      }
      {
        peerName && (<>
          <div className="progress-bar">
            <div
              className="progress"
              style={{
                width: `${progress}%`,
                backgroundColor: getProgressColor(progress)
              }}
            ></div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="adjective-grid">
              {adjectives.map(adjective => (
                <button
                  key={adjective}
                  type="button"
                  className={`adjective-btn ${selectedAdjectives.includes(adjective) ? 'selected' : ''}`}
                  onClick={() => handleAdjectiveToggle(adjective)}
                >
                  {adjective}
                </button>
              ))}
            </div>
            <button
              className="btn submit-btn"
              type="submit"
              disabled={selectedAdjectives.length < minAdj || !peerName.trim()}
            >Submit
            </button>
          </form>
        </>)
      }
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={ alert.open }
        onClose={()=>{setAlert({...alert, open:false})}}
        autoHideDuration={alert.severity=="success"?6000:null}
      >
        <div>
          <Alert onClose={()=>{setAlert({...alert, open:false})}} severity={alert.severity}>
            {alert.message}
          </Alert>
        </div>
      </Snackbar>
    </div>
  );
};

export default PeerAssessment;