'use strict'
const mongoose = require('mongoose');
const User = require('../models/user.model');

/**
 * update the group and email of an user
 * @param {*} param0 
 * @returns 
 */
const updateUserInfo = ({ userName, group, email })=>{
    return new Promise(async (resolve, reject)=>{
        try {
            let user = await User.findOneAndUpdate(
                { name: userName }, 
                { $set: { group: group, email, email }}, 
                { new: true, upsert: true }
            );
            resolve(user)
        } catch (error) {
            reject(error)            
        }
    })
}

const updateUserSelfAssessment = ({ name, selfAssessment})=>{
    return new Promise(async (resolve, reject)=>{
        try {
            // find an existing one and update
            let user = await User.findOneAndUpdate(
                { name }, 
                { $set: { selfAssessment }}, 
                { new: true, upsert: false }
            );
            resolve(user)
        } catch (error) {
            reject(error)            
        }
    })
}

const updateUserPeerAssessments = ({ name, peerAssessments})=>{
    return new Promise(async (resolve, reject)=>{
        try {
            // find an existing one and update
            let user = await User.findOneAndUpdate(
                { name }, 
                { $set: { peerAssessments }}, 
                { new: true, upsert: false }
            );
            resolve(user)
        } catch (error) {
            reject(error)            
        }
    })
}

/**
 * 
 * @param {userName, email, group, peerAssementFromSameGroup} 
 *  userName, email, group: filter for the user
 *  peerAssementFromSameGroup: true - check whether the peer assessment is coming from user in the same group 
 * @returns 
 */
const getUsers = ({ name, email, group, peerAssementFromSameGroup })=>{
    return new Promise(async (resolve, reject)=>{
        try {
            const query = {
                ...((name!=null) && { name }),
                ...((email!=null) && { email }),
                ...((group!=null) && { group }),
            }
            let users = await User.find(query);
            
            // filter out peer assessment is coming from user in the same group
            if ((peerAssementFromSameGroup == true || peerAssementFromSameGroup == 'true') && name != null){
                let sameGroupUsers = await User.find({
                group: users[0].group
                })
                users[0].peerAssessments = users[0].peerAssessments.filter(pa => sameGroupUsers.find(sgu=>sgu.name==pa.peerName)!=null)
            }
            resolve(users)                      
        } catch (error) {
            reject(error)
        }
    })
}

const delUser = ({ name })=>{
    return new Promise(async (resolve, reject)=>{
        try {
            // update those user record with peerAssessments from name
            // delete the user
            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
                const users = await User.find(
                    { "peerAssessments.peerName": name },
                );
                users.forEach(async user => {
                    let peerAssessments = user.peerAssessments.filter(pa=>pa.peerName!=name)
                    await User.findOneAndUpdate(
                        { name: user.name }, 
                        { $set: { peerAssessments }}, 
                        { new: true, upsert: false }
                    );
                });
                await User.deleteOne({ name })
                // Commit the transaction
                await session.commitTransaction();
                resolve();
            } catch (error) {
                // If an error occurred, abort the transaction
                await session.abortTransaction();
                reject('Transaction aborted due to error:', error);
            } finally {
                // End the session
                session.endSession();
                resolve();
            }
            
        } catch (error) {
            reject(error)
        }
    })
}
module.exports = { updateUserInfo, getUsers, updateUserSelfAssessment, updateUserPeerAssessments, delUser }
