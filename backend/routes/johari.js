const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const fs = require('fs');

function readFileLineByLine(filePath) {
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
    // console.log(`users222: ${JSON.stringify(users)}`)    
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
  if (!Array.isArray(adjectives) || adjectives.length < process.env.MIN_NUM_OF_ADJ || adjectives.length > process.env.MAX_NUM_OF_ADJ) {
    return res.status(400).json({ 
      success: false, 
      message: `Please select ${process.env.MIN_NUM_OF_ADJ}-${process.env.MAX_NUM_OF_ADJ} adjectives.` 
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

  if (!userName || !peerName || !Array.isArray(adjectives) || adjectives.length < process.env.MIN_NUM_OF_ADJ || adjectives.length > process.env.MAX_NUM_OF_ADJ) {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid data provided. Please ensure all fields are filled and ${process.env.MIN_NUM_OF_ADJ}-${process.env.MAX_NUM_OF_ADJ} adjectives are selected.` 
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

// QR code generation route
router.post('/generate-qr', async (req, res) => {
  const { userName, peerName, peerEmail } = req.body;

  console.log('Received QR code generation request:', { userName, peerName, peerEmail });

  if (!userName || !peerName || !peerEmail) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided. Please ensure all fields are filled.'
    });
  }

  try {
    const assessmentId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const assessmentUrl = `${process.env.FRONTEND_URL}/peer-assessment/${assessmentId}`;
    console.log(`assessmentUrl: ${assessmentUrl}`)

    const qrCodeData = await QRCode.toDataURL(assessmentUrl);

    let user = await User.findOne({ name: userName });
    if (user!=null && !user) {
      user = new User({ 
        name: userName,
        group: "TODO_GROUP",
      });
    }

    user.peerAssessments.push({
      peerName,
      peerEmail,
      assessmentId,
      completed: false
    });
    await user.save();

    console.log('QR code generated successfully');
    res.json({
      success: true,
      qrCodeData,
      assessmentUrl
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).json({ success: false, message: 'Error generating QR code: ' + err.message });
  }
});

// Send email to peer
router.post('/send-peer-email', async (req, res) => {
  const { userName, peerName, peerEmail, generateQR } = req.body;

  console.log('Received send peer email request:', { userName, peerName, peerEmail, generateQR });

  if (!userName || !peerName || !peerEmail) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid data provided. Please ensure all fields are filled.' 
    });
  }

  try {
    let user = await User.findOne({ name: userName });
    if (user!=null && !user) {
      user = new User({ name: userName });
    }

    const assessmentId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const assessmentLink = `${process.env.FRONTEND_URL}/peer-assessment/${assessmentId}`;

    let qrCodeData;
    if (generateQR) {
      qrCodeData = await QRCode.toDataURL(assessmentLink);
    }

    user.peerAssessments.push({
      peerName,
      peerEmail,
      assessmentId,
      completed: false
    });
    await user.save();

    // Configure the transporter with your email service details
    const transporter = nodemailer.createTransport({
      service: 'your-email-service',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: peerEmail,
      subject: 'Peer Assessment Request for Johari Window',
      html: `
        <p>Dear ${peerName},</p>
        <p>${userName} has requested your input for their Johari Window assessment.</p>
        <p>Please click on the following link to complete the assessment:</p>
        <p><a href="${assessmentLink}">${assessmentLink}</a></p>
        ${generateQR ? '<p>Alternatively, you can scan the QR code attached to this email.</p>' : ''}
        <p>Thank you for your participation!</p>
      `,
      attachments: generateQR ? [
        {
          filename: 'qr-code.png',
          content: qrCodeData.split(';base64,').pop(),
          encoding: 'base64'
        }
      ] : []
    };

    await transporter.sendMail(mailOptions);
    
    console.log('Peer assessment invitation sent successfully');
    res.json({ success: true, message: 'Peer assessment invitation sent successfully' });
  } catch (err) {
    console.error('Error in /send-peer-email:', err);
    res.status(500).json({ success: false, message: 'Error sending peer assessment email: ' + err.message });
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

router.get('/config', async (req, res) => {
  try {
    const MIN_NUM_OF_ADJ = process.env.MIN_NUM_OF_ADJ;
    const MAX_NUM_OF_ADJ = process.env.MAX_NUM_OF_ADJ;
    const lines = await readFileLineByLine(process.env.ADJ_FILE);
    if (!lines) {
      return res.status(404).json({ success: false, message: 'Adjectives not found' });
    }
    res.json({
      success: true,
      data: {
        adjectives: lines,
        minAdj:  MIN_NUM_OF_ADJ, 
        maxAdj:  MAX_NUM_OF_ADJ
      }
    });
  } catch (err) {
    console.error('unable to load the adjectives:', err);
    res.status(500).json({ success: false, message: 'Error fetching Johari Window adjectives: ' + err.message });
  }
});


module.exports = router;