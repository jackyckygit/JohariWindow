// import { expect } from 'chai';
import * as chai from "chai";
import {default as chaiHttp, request} from "chai-http";
chai.use(chaiHttp);
const expect = chai.expect;

import TH from './common/test-helper.mjs';

describe('Testing api', () => {
  before((done)=>{
    TH.start().then(function() {
      done();
    })
    .catch((err)=>{done(err)});
  })
  
  describe('testing config api', () => {
    it('get config', (done) => {
      TH.sendGETRequest(`/jw-api/johari/config`).then((_data)=>{
        // console.log(`/jw-api/johari/config returned data: ${_data}`)
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
      userName: "TestUserA",
      email: "TestUserA@test.com",
      group: "TestGroupA"
    }

    it('create user with normal info', (done) => {
      TH.sendPOSTRequest(`/jw-api/johari/saveUserInfo`, userA, null).then((data)=>{
        // console.log(`data return for saveUserInfo: ${data}`)
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('get user by name', (done) => {
      TH.sendGETRequest(`/jw-api/johari/users`, { userName: userA.userName }).then((_data)=>{
        // console.log(`data return for get user: ${_data}`)
        let data = JSON.parse(_data).data
        expect(data).to.be.an('array').of.length(1);
        let user = data[0]
        expect(user).to.have.property('name', userA.userName);
        expect(user).to.have.property('email', userA.email);
        expect(user).to.have.property('group', userA.group);
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('get user by name with peerAssementFromSameGroup set to true', (done) => {
      TH.sendGETRequest(`/jw-api/johari/users?userName=${userA.userName}&peerAssementFromSameGroup=true`, null).then((_data)=>{
        // console.log(`data return for get user: ${_data}`)
        let data = JSON.parse(_data).data
        expect(data).to.be.an('array').of.length(1);
        let user = data[0]
        expect(user).to.have.property('name', userA.userName);
        expect(user).to.have.property('email', userA.email);
        expect(user).to.have.property('group', userA.group);
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('update user email', (done) => {
      userA.email = "ChangedTestUserA@test.com",
      TH.sendPOSTRequest(`/jw-api/johari/saveUserInfo`, userA, null).then((data)=>{
        // console.log(`data return for saveUserInfo: ${data}`)
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('get user by name', (done) => {
      TH.sendGETRequest(`/jw-api/johari/users`, { userName: userA.userName }).then((_data)=>{
        // console.log(`data return for get user: ${_data}`)
        let data = JSON.parse(_data).data
        expect(data).to.be.an('array').of.length(1);
        let user = data[0]
        expect(user).to.have.property('name', userA.userName);
        expect(user).to.have.property('email', userA.email);
        expect(user).to.have.property('group', userA.group);
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('update user peer assessemnt', (done) => {
      let peerAssessment =  {
        userName: 'TestUserB',
        peerName: 'TestUserA',
        group: 'A',
        peerEmail: '',
        adjectives: [ 'A', 'B', 'C', 'G', 'D' ]
      }

      TH.sendPOSTRequest(`/jw-api/johari/submit-peer`, peerAssessment, null).then((data)=>{
        // console.log(`data return for saveUserInfo: ${data}`)
        done()
      }).catch((err)=>{
        done(err)
      })
    });

    it('get user by name', (done) => {
      TH.sendGETRequest(`/jw-api/johari/users`, { userName: userA.userName }).then((_data)=>{
        console.log(`data return for get user: ${_data}`)
        let data = JSON.parse(_data).data
        expect(data).to.be.an('array').of.length(1);
        let user = data[0]
        expect(user).to.have.property('name', userA.userName);
        expect(user).to.have.property('email', userA.email);
        expect(user).to.have.property('group', userA.group);
        done()
      }).catch((err)=>{
        done(err)
      })
    });

  });


})