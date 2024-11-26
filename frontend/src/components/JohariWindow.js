import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Snackbar } from '@mui/material';
import Alert from '@mui/material/Alert';
import '../styles/JohariWindowTheme.css';

const JohariWindow = ({ name, adjectives, minSelfAdj, maxSelfAdj, onSubmit }) => {
  const [selectedAdjectives, setSelectedAdjectives] = useState([]); 

  const [progress, setProgress] = useState(0);
  const [alert, setAlert] = useState({ open: false, message: "", severity: null})

  useEffect(() => {
    setProgress((selectedAdjectives.length / minSelfAdj) * 100); 
  }, [selectedAdjectives]);

  //initialize the selectedAdjectives base on the selfAssessment
  useEffect(() => {
    axios.get(`/jw-api/johari/users?userName=${name}`).then((res)=>{
      let user = res.data.data[0]
      if (user.selfAssessment != null){
        setSelectedAdjectives(user.selfAssessment)
      }
    }).catch((err)=>{
      console.error('Error getting userInfo', err);
    })

  }, []);

  const getProgressColor = (progress) => {
    if (progress <= 20) return '#8B0000';
    if (progress <= 40) return '#FF0000';
    if (progress <= 60) return '#FFA500';
    if (progress <= 80) return '#FFFF00';
    if (progress < 100) return '#90EE90';
    return '#006400';
  };

  const handleAdjectiveToggle = (adjective) => {
    setSelectedAdjectives(prev => {
      if (prev.includes(adjective)) {
        return prev.filter(a => a !== adjective);
      } else if (maxSelfAdj == undefined || prev.length < maxSelfAdj) {
        return [...prev, adjective];
      } else {
        displayAlert(`Maximum allowed is ${maxSelfAdj} adjectives. Please uncheck one to select a new adjective.`);
        return prev;
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedAdjectives.length < minSelfAdj) { 
      displayAlert(`Please select at least ${minSelfAdj} adjectives.`);
      return;
    }
    try {
      console.log('Submitting self-assessment:', { adjectives: selectedAdjectives });
      const response = await axios.post('/jw-api/johari/submit-self', {
        userName: name,
        adjectives: selectedAdjectives
      });
      
      if (response.data.success) {
        onSubmit(selectedAdjectives);
        displaySuccess('Submitted successfully')
      } else {
        displayAlert(`Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      if (error.response) {
        displayAlert(`Error: ${error.response.data.message || 'Unknown server error'}`);
      } else if (error.request) {
        displayAlert('Error: No response received from the server');
      } else {
        displayAlert(`Error: ${error.message}`);
      }
    }
  };

  const displayAlert = (message)=>{
    setAlert({
      open: true, message, severity: "error"
    })
  }
  const displaySuccess = (message)=>{
    setAlert({
      open: true, message, severity: "success"
    })
  }

  return (
    <div className="container">
      <div>
      {
        (maxSelfAdj)? (
          <h2>請選出{minSelfAdj}-{maxSelfAdj}個你自己的特質</h2>
        ):(
          <h2>請選出最少{minSelfAdj}個你自己的特質</h2>
        )
      }
      </div>
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
          disabled={selectedAdjectives.length < minSelfAdj}
        >
          Submit
        </button>
      </form>
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

export default JohariWindow;