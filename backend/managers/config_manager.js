'use strict'
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

const getConfig = function(){
  if (process.env.CONFIG_SOURCE==='GS'){
    return doGetConfigFromGS()
  }
  else {
    return doGetConfigFromLocal()
  }
}

module.exports = { getConfig }
