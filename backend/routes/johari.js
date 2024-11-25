const express = require('express');
const router = express.Router();
const Config = require('../managers/config_manager');
const UserManager = require('../managers/user_manager')

/**
 *  saveUserInfo
 *  if the userName exist, update the userInfo 
 */ 
router.post('/saveUserInfo', async (req, res) => {
  const { userName, group, email } = req.body;

  if (userName == null || userName.trim()==''
    || group == null || group.trim()==''
  ){
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid user information' 
    });
  }

  try {
    let user = await UserManager.updateUserInfo({ userName, group, email })
    console.log(`user saved successfully: ${user}`)
    res.json({ success: true, message: 'User saved successfully' });
  } catch (err) {
    console.error('Error in /saveUserInfo:', err);
    res.status(500).json({ success: false, message: 'Error in saving user: ' + err.message });
  }
});

/**
 * query: 
 *  userName, email, group: filter for the user
 *  peerAssementFromSameGroup: true - check whether the peer assessment is coming from user in the same group
 */
router.get('/users', async (req, res) => {
  try {
    let users = await UserManager.getUsers({
      name: req.query.userName,
      email: req.query.email,
      group: req.query.group,
      peerAssementFromSameGroup: req.query.peerAssementFromSameGroup
    })
    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Error fetching users: ' + err.message });
  }
});

router.delete('/user', async (req, res) => {
  const { userName } = req.query;

  if (userName == null || userName.trim()==''){
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid user information' 
    });
  }

  try {
    await UserManager.delUser({
      name: req.query.userName,
    })
    res.json({
      success: true,
    });
  } catch (err) {
    console.error('Error deleting users:', err);
    res.status(500).json({ success: false, message: 'Error deleting users: ' + err.message });
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
    let user = UserManager.updateUserSelfAssessment({
      name: userName, selfAssessment: adjectives
    })

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
// userName, the submitter
// peerName, the peer assessted by submitter
// group,
// adjectives: selectedAdjectives
router.post('/submit-peer', async (req, res) => {
  const { userName, peerName, group, adjectives } = req.body;
  
  console.log('Received peer assessment:', { userName, peerName, group, adjectives });
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

  try {
    // find an existing one and update
    let users = await UserManager.getUsers({ name: peerName });
    let user = users[0];

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

    user = await UserManager.updateUserPeerAssessments({ name: peerName, peerAssessments: updatePeerAssessments })
    console.log(`return user: ${user}`)    
    console.log('Peer assessment saved successfully');
    res.json({ success: true, message: 'Peer assessment submitted successfully' });
  } catch (err) {
    console.error('Error in /submit-peer:', err);
    res.status(500).json({ success: false, message: 'Error submitting peer assessment: ' + err.message });
  }
});

router.get('/config', (req, res) => {
  Config.getConfig()
    .then(result=>{
      res.json(result)
    })
    .catch(err=>res.status(500).json(err))
});

module.exports = router;