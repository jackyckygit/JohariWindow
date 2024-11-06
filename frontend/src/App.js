import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/GreatLakesTheme.css';
import JohariWindow from './components/JohariWindow';
import PeerAssessment from './components/PeerAssessment';
import JohariResults from './components/JohariResults';
import LoadingScreen from './components/LoadingScreen';
import UserInfoPopup from './components/UserInfoPopup';
import JohariWindowLogo from './images/logo192.png';


function App() {
  const [stage, setStage] = useState('userInfo');
  const [name, setName] = useState(''); // This is now the userName
  // const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState('');
  const [adjectives, setAdjectives] = useState([]);
  const [minAdj, setMinAdj] = useState()
  const [maxAdj, setMaxAdj] = useState()
  const [selfAdjectives, setSelfAdjectives] = useState([]);
  const [peerAssessments, setPeerAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      axios.get('/jw-api/johari/config').then((res)=>{
        setAdjectives(res.data?.data?.adjectives || [])
        setMinAdj(res.data?.data?.minAdj)
        setMaxAdj(res.data?.data?.maxAdj)
        setIsLoading(false)
      }).catch((err)=>{
        console.error('Error getting adjectives', err);
        alert('Failed to initialize');
      })
    }
    catch(err){
      console.error('Error getting adjectives 2', err);
    }
  }, []);

  const handleUserInfoSubmit = async (userInfo) => {
    try {
      const response = await axios.post('/jw-api/johari/saveUserInfo', {
        userName: userInfo.name,
        group: userInfo.group,
        // email: userInfo.email
      });
      
      if (response.data.success) {
        setName(userInfo.name); // Setting the userName
        // setEmail(userInfo.email);
        setPhone(userInfo.phone);
        setGroup(userInfo.group);
        setStage('selfAssessment');
      } else {
        alert(`Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      if (error.response) {
        alert(`Error: ${error.response.data.message || 'Unknown server error'}`);
      } else if (error.request) {
        alert('Error: No response received from the server');
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleSelfAssessmentSubmit = (adjectives) => {
    setSelfAdjectives(adjectives);
    // setStage('peerAssessment');
  };

  const handlePeerAssessmentSubmit = (peerAssessment) => {
    setPeerAssessments([...peerAssessments, peerAssessment]);
    // setStage('results'); don't change to display result
  };

  const handleNavigate = (path) => {
    // This function can be expanded to handle different navigation paths
    if (path === '/johari-window') {
      setStage('results');
    }
  };

  const handleDownloadReport = async (userInfo) => {
    try {
      await axios.post('/jw-api/johari/send-report', { 
        ...userInfo, 
        johariData: { 
          selfAdjectives, 
          peerAssessments 
        } 
      });
      alert('Report has been sent to your email.');
    } catch (error) {
      console.error('Error sending report:', error);
      alert('Failed to send report. Please try again.');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <img src={JohariWindowLogo} alt="Johari Window Logo" className="window-logo" />
            <h1>周哈里窗</h1>
            {name!='' && <h2>Welcome, {name} in group {group}</h2>}
          </div>
        </div>
      </header>
      <main className="container">
        <div className="select-tab">
          <button
            type="button"
            className={`tab-item ${(stage == "selfAssessment") ? 'selected' : ''}`}
            onClick={() => setStage("selfAssessment")}
          >
            自我評估
          </button>
          <button
            type="button"
            className={`tab-item ${(stage == "peerAssessment") ? 'selected' : ''}`}
            onClick={() => setStage("peerAssessment")}
          >
            評估他人
          </button>
          <button
            type="button"
            className={`tab-item ${(stage == "results") ? 'selected' : ''}`}
            onClick={() => setStage("results")}
          >
            我的周哈里窗
          </button>

        </div>

        {stage === 'userInfo' && <UserInfoPopup onSubmit={handleUserInfoSubmit} />}
        {stage === 'selfAssessment' && (
          <JohariWindow 
            onSubmit={handleSelfAssessmentSubmit} 
            name={name} 
            // email={email} 
            phone={phone} 
            adjectives={adjectives}
            minAdj={minAdj}
            maxAdj={maxAdj}
          />
        )}
        {stage === 'peerAssessment' && (
          <PeerAssessment
            onSubmit={handlePeerAssessmentSubmit}
            userName={name} // Passing userName as a prop
            name={name} 
            // email={email} 
            group={group}
            adjectives={adjectives}
            minAdj={minAdj}
            maxAdj={maxAdj}
            onNavigate={handleNavigate}
          />
        )}
        {stage === 'results' && (
          <>
            <JohariResults 
              name={name} 
              // email={email} 
              adjectives={adjectives}
              minAdj={minAdj}
              maxAdj={maxAdj}
              selfAdjectives={selfAdjectives} 
              peerAssessments={peerAssessments}
            />
            {/* <button onClick={() => setStage('downloadReport')} className="btn">
              Download Full Report
            </button> */}
          </>
        )}
        {stage === 'downloadReport' && (
          <UserInfoPopup 
            onSubmit={handleDownloadReport}
            title="Enter your details to receive the report"
            submitButtonText="Send Report"
          />
        )}
      </main>
    </div>
  );
}

export default App;