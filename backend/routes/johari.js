const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const fs = require('fs');
const GAL = require('google-auth-library')
const GS = require('google-spreadsheet');


const readFileLineByLine = function(filePath) {
  const lines = [];
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

  return new Promise((resolve, reject) => {
    fileStream.on('data', (chunk) => {
      lines.push(...chunk.split('\n'));
    });

    fileStream.on('end', () => {
      resolve(lines);
    });

    fileStream.on('error', (err) => {
      reject(err);
    });
  });
}

const doGetConfigFromLocal = function(){
  return new Promise(async(resolve, reject)=>{
    // get from local
    try {
      const MIN_NUM_OF_PEER_ADJ = process.env.MIN_NUM_OF_PEER_ADJ;
      const MAX_NUM_OF_PEER_ADJ = process.env.MAX_NUM_OF_PEER_ADJ;
      const MIN_NUM_OF_SELF_ADJ = process.env.MIN_NUM_OF_SELF_ADJ;
      const MAX_NUM_OF_SELF_ADJ = process.env.MAX_NUM_OF_SELF_ADJ;
      const lines = await readFileLineByLine(process.env.ADJ_FILE);
      if (!lines) {
        return reject({ success: false, message: 'Adjectives not found' });
      }
      return resolve({
        success: true,
        data: {
          adjectives: lines,
          minPeerAdj:  MIN_NUM_OF_PEER_ADJ, 
          maxPeerAdj:  MAX_NUM_OF_PEER_ADJ,
          minSelfAdj:  MIN_NUM_OF_SELF_ADJ, 
          maxSelfAdj:  MAX_NUM_OF_SELF_ADJ,
        }
      });
    } catch (err) {
      console.error('unable to load the adjectives:', err);
      return reject({ success: false, message: 'Error fetching Johari Window adjectives: ' + err.message });
    }
  })
}

const doGetConfigFromGS = function(){
  return new Promise(async(resolve, reject)=>{
    const SCOPES = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ];

    const jwtFromEnv = new GAL.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY,
      scopes: SCOPES,
    });

    const doc = new GS.GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwtFromEnv);
    try {
      await doc.loadInfo(); // loads document properties and worksheets

      const sheet = doc.sheetsByTitle["config"];
      const rows = await sheet.getRows();   
      let adjectives = rows.map(r=>r.get('adjectives'))
      return resolve({
        success: true,
        data: {
          adjectives,
          minPeerAdj:  rows[0].get('MIN_NUM_OF_PEER_ADJ'), 
          maxPeerAdj:  rows[0].get('MAX_NUM_OF_PEER_ADJ'),
          minSelfAdj:  rows[0].get('MIN_NUM_OF_SELF_ADJ'), 
          maxSelfAdj:  rows[0].get('MAX_NUM_OF_SELF_ADJ'),
        }
      });

    } catch (error) {
      console.error('unable to load the adjectives:', error);
      reject({ success: false, message: error})
    }
  }
)}

const doGetConfig = function(){
  if (process.env.CONFIG_SOURCE==='GS'){
    return doGetConfigFromGS()
  }
  else {
    return doGetConfigFromLocal()
  }
}


/**
 *  saveUserInfo
 *  if the userName exist, update the userInfo 
 */ 
router.post('/saveUserInfo', async (req, res) => {
  const { userName, group, email } = req.body;

  if (userName == null || userName.replace(/ /g, '')==''
    || group == null || group.replace(/ /g, '')==''
    // || email == null || email.replace(/ /g, '')==''  
  ){
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid user information' 
    });
  }

  try {
    let user = await User.findOneAndUpdate(
      { name: userName }, 
      { $set: { group: group, email, email }}, 
      { new: true, upsert: true }
    );

    console.log(`user saved successfully: ${user}`)
    res.json({ success: true, message: 'User saved successfully' });
  } catch (err) {
    console.error('Error in /saveUserInfo:', err);
    res.status(500).json({ success: false, message: 'Error in saving user: ' + err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const query = {
      ...((req.query.userName!=null) && { name: req.query.userName }),
      ...((req.query.email!=null) && { email: req.query.email }),
      ...((req.query.group!=null) && { group: req.query.group }),
    }
    const users = await User.find(query);
    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Error fetching users: ' + err.message });
  }
});

// Self-assessment submission route
router.post('/submit-self', async (req, res) => {
  const { userName, adjectives } = req.body;

  if (userName == null || userName.replace(/ /g, '')==''){
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid user information' 
    });
  }

  console.log('Received self-assessment:', { adjectives });
  // testing different value of MAX_NUM_OF_SELF_ADJ and with and adjectives.length is > MAX_NUM_OF_SELF_ADJ
  // MAX_NUM_OF_SELF_ADJ not defined
  // MAX_NUM_OF_SELF_ADJ = ''
  // MAX_NUM_OF_SELF_ADJ = existing value in env and adjectives.length is > MAX_NUM_OF_SELF_ADJ
  if (!Array.isArray(adjectives) 
    || adjectives.length < process.env.MIN_NUM_OF_SELF_ADJ 
    || (process.env.MAX_NUM_OF_SELF_ADJ && process.env.MAX_NUM_OF_SELF_ADJ!='' && (adjectives.length > process.env.MAX_NUM_OF_SELF_ADJ)) 
  ){
    let message;
    if (process.env.MAX_NUM_OF_SELF_ADJ && process.env.MAX_NUM_OF_SELF_ADJ!=''){
      message = `Please select ${process.env.MIN_NUM_OF_SELF_ADJ}-${process.env.MAX_NUM_OF_SELF_ADJ} adjectives.`;
    }
    else {
      //MAX_NUM_OF_SELF_ADJ is not defined
      message = `Please select more than ${process.env.MIN_NUM_OF_SELF_ADJ} adjectives.`
    }
    return res.status(400).json({ 
      success: false, 
      message
    });
  }

  try {
    // find an existing one and update
    let user = await User.findOneAndUpdate(
      { name: userName }, 
      { $set: { selfAssessment: adjectives }}, 
      { new: true, upsert: false }
    );

    if (user!=null && !user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user information' 
      });
    }

    console.log('Self-assessment saved successfully');
    res.json({ success: true, message: 'Self-assessment submitted successfully' });
  } catch (err) {
    console.error('Error in /submit-self:', err);
    res.status(500).json({ success: false, message: 'Error submitting self-assessment: ' + err.message });
  }
});

// Peer assessment submission route
router.post('/submit-peer', async (req, res) => {
  const { userName, peerName, group, peerEmail, adjectives } = req.body;
  
  console.log('Received peer assessment:', { userName, peerName, group, peerEmail, adjectives });
  let not_defined_max = process.env.MAX_NUM_OF_PEER_ADJ == null || process.env.MAX_NUM_OF_PEER_ADJ == ''

  if (!userName || !peerName || !Array.isArray(adjectives) || adjectives.length < process.env.MIN_NUM_OF_PEER_ADJ || (!not_defined_max && adjectives.length > process.env.MAX_NUM_OF_PEER_ADJ)) {
    let message;
    if (!not_defined_max){
      message = `Please select ${process.env.MIN_NUM_OF_PEER_ADJ}-${process.env.MAX_NUM_OF_PEER_ADJ} adjectives.`;
    }
    else {
      //MAX_NUM_OF_PEER_ADJ is not defined
      message = `Please select more than ${process.env.MIN_NUM_OF_SELF_ADJ} adjectives.`
    }
    return res.status(400).json({ 
      success: false, 
      message 
    });
  }

  // userName, the submitter
  // peerName, the peer assessted by submitter
  // group,
  // peerEmail, the email of the peer, not used
  // adjectives: selectedAdjectives

  try {
    // find an existing one and update
    let user = await User.findOne({ name: peerName });

    if (user!=null && !user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user information' 
      });
    }

    let prevPeerAssessments = user.peerAssessments || [];
    let newPeerAssessments = {
      peerName: userName, 
      adjectives
    }
    let updatePeerAssessments = prevPeerAssessments
    let targetIndex = prevPeerAssessments.findIndex(pp=> pp.peerName == userName)

    if (targetIndex != -1){
      updatePeerAssessments[targetIndex] = newPeerAssessments
    }
    else {
      updatePeerAssessments.push(newPeerAssessments)
    }

    user = await User.findOneAndUpdate(
      { name: peerName }, 
      { $set: { peerAssessments: updatePeerAssessments }}, 
      { new: true, upsert: false }
    );
    console.log(`return user: ${user}`)    
    console.log('Peer assessment saved successfully');
    res.json({ success: true, message: 'Peer assessment submitted successfully' });
  } catch (err) {
    console.error('Error in /submit-peer:', err);
    res.status(500).json({ success: false, message: 'Error submitting peer assessment: ' + err.message });
  }
});

// Get Johari Window data
router.get('/window/:userName', async (req, res) => {
  try {
    const user = await User.findOne({ name: req.params.userName });
    if (user!=null && !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      data: {
        selfAssessment: user.selfAssessment,
        peerAssessments: user.peerAssessments
      }
    });
  } catch (err) {
    console.error('Error fetching Johari Window data:', err);
    res.status(500).json({ success: false, message: 'Error fetching Johari Window data: ' + err.message });
  }
});

// TODO put update the adjectives

// get the adjectives list TODO change to get config
// router.get('/adjectives', async (req, res) => {
//   try {
 
//     let lines = await readFileLineByLine(process.env.ADJ_FILE);
//     if (!lines) {
//       return res.status(404).json({ success: false, message: 'Adjectives not found' });
//     }
//     res.json({
//       success: true,
//       data: lines
//     });
//   } catch (err) {
//     console.error('unable to load the adjectives:', err);
//     res.status(500).json({ success: false, message: 'Error fetching Johari Window adjectives: ' + err.message });
//   }
// });

router.get('/config', (req, res) => {
  doGetConfig()
    .then(result=>{
      res.json(result)
    })
    .catch(err=>res.status(500).json(err))
});

module.exports = router;