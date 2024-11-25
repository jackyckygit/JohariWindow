// import { expect } from 'chai';
import * as chai from "chai";
import {default as chaiHttp, request} from "chai-http";
chai.use(chaiHttp);
const expect = chai.expect;

import TH from './common/test-helper.mjs';

describe('Testing api', () => {
  describe('testing config api', () => {
    it('get config', (done) => {
      TH.sendGETRequest(`/jw-api/johari/config`).then((_data)=>{
        let data = JSON.parse(_data)
        expect(data).to.have.property("data")
        expect(data.data).to.have.property("adjectives")
        expect(data.data.adjectives).to.be.an('array').that.is.not.empty;
        done()
      }).catch((err)=>{
        done(err)
      })
    });
  });

  describe('testing userinfo', () => {
    let userA = {
      userName: "TestUserTA",
      group: "TestGroupA"
    }

    let userB = {
      userName: "TestUserB",
      group: "TestGroupA"
    }

    it('create user A with normal info', (done) => {
      TH.sendPOSTRequest(`/jw-api/johari/saveUserInfo`, userA, null).then((data)=>{
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('create user B with normal info', (done) => {
      TH.sendPOSTRequest(`/jw-api/johari/saveUserInfo`, userB, null).then((data)=>{
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('get user by name', (done) => {
      TH.sendGETRequest(`/jw-api/johari/users`, { userName: userA.userName }).then((_data)=>{
        let data = JSON.parse(_data).data
        expect(data).to.be.an('array').of.length(1);
        let user = data[0]
        expect(user).to.have.property('name', userA.userName);
        expect(user).to.have.property('group', userA.group);
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('get user by name with peerAssementFromSameGroup set to true', (done) => {
      TH.sendGETRequest(`/jw-api/johari/users?userName=${userA.userName}&peerAssementFromSameGroup=true`, null).then((_data)=>{
        let data = JSON.parse(_data).data
        expect(data).to.be.an('array').of.length(1);
        let user = data[0]
        expect(user).to.have.property('name', userA.userName);
        expect(user).to.have.property('group', userA.group);
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('get user by name', (done) => {
      TH.sendGETRequest(`/jw-api/johari/users`, { userName: userA.userName }).then((_data)=>{
        let data = JSON.parse(_data).data
        expect(data).to.be.an('array').of.length(1);
        let user = data[0]
        expect(user).to.have.property('name', userA.userName);
        expect(user).to.have.property('group', userA.group);
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('update user peer assessemnt', (done) => {
      let peerAssessment =  {
        userName: 'TestUserB',
        peerName: 'TestUserTA',
        peerEmail: '',
        adjectives: [ 'A', 'B', 'C', 'G', 'D' ]
      }

      TH.sendPOSTRequest(`/jw-api/johari/submit-peer`, peerAssessment, null).then((data)=>{
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('get user by name and check that there is peerAssessments from userB', (done) => {
      TH.sendGETRequest(`/jw-api/johari/users`, { userName: userA.userName }).then((_data)=>{
        let data = JSON.parse(_data).data
        expect(data).to.be.an('array').of.length(1);
        let user = data[0]
        expect(user).to.have.property('name', userA.userName);
        expect(user).to.have.property('group', userA.group);
        expect(user.peerAssessments).to.be.an('array')
        expect(user.peerAssessments.map(m=>m.peerName)).to.include('TestUserB');
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('delete user B', (done) => {
      TH.sendDELRequest(`/jw-api/johari/user`, { userName: userB.userName }).then((_data)=>{
        let success = JSON.parse(_data).success
        expect(success).to.equal(true);
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('get userA and check that there is no peerAssessments from userB', (done) => {
      TH.sendGETRequest(`/jw-api/johari/users`, { userName: userA.userName }).then((_data)=>{
        let data = JSON.parse(_data).data
        expect(data).to.be.an('array').of.length(1);
        let user = data[0]
        expect(user.peerAssessments).to.be.an('array')
        expect(user.peerAssessments.map(m=>m.peerName)).not.to.include('TestUserB');
        done()
      }).catch((err)=>{
        done(err)
      })
    });
  
    it('delete user A', (done) => {
      TH.sendDELRequest(`/jw-api/johari/user`, { userName: userA.userName }).then((_data)=>{
        let success = JSON.parse(_data).success
        expect(success).to.equal(true);
        done()
      }).catch((err)=>{
        done(err)
      })
    });

  });


})