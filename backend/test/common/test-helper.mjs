'use strict';
/**
 * function to implement
 * creating / deleting admin
 * creating / deleting user with certain group
 */
import * as chai from "chai";
import {default as chaiHttp, request} from "chai-http";
chai.use(chaiHttp);
const expect = chai.expect;

import 'dotenv/config'

import app from '../../app.js'

var started = false;

export default {
    sendGETRequest: function(pathname, params = {}, access_token) {
        return new Promise((resolve, reject)=>{
            request.execute(app)
            .get(pathname)
            .query(params)
            .set('Authorization', `Bearer ${access_token}`)
            .end((err, res) => {
                expect(err).to.be.null; // Check for errors
                expect(res).to.have.status(200); // Check for successful status code (200)
                resolve(res.text);
            });
        })
    },
    sendPOSTRequest: function(pathname, params, access_token) {
        return new Promise((resolve, reject)=>{
            request.execute(app)
            .post(pathname)
            .send(params)
            .set('Authorization', `Bearer ${access_token}`)
            .end((err, res) => {
                expect(err).to.be.null; // Check for errors
                expect(res).to.have.status(200); // Check for successful status code (200)
                resolve(res.text);
            });
        })
    },
    sendDELRequest: function(pathname, params = {}, access_token) {
        return new Promise((resolve, reject)=>{
            request.execute(app)
            .delete(pathname)
            .query(params)
            .set('Authorization', `Bearer ${access_token}`)
            .end((err, res) => {
                expect(err).to.be.null; // Check for errors
                expect(res).to.have.status(200); // Check for successful status code (200)
                resolve(res.text);
            });
        })
    },
};
