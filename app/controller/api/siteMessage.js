/*
 * @Author: doramart 
 * @Date: 2019-09-26 09:19:25 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-10-05 17:39:56
 */
const _ = require('lodash');


let SiteMessageController = {


    async list(ctx, app) {

        try {

            let payload = ctx.query;
            let type = ctx.query.type;
            let queryObj = {};
            let userInfo = ctx.session.user || {};

            if (!_.isEmpty(userInfo)) {
                queryObj.passiveUser = userInfo._id;
            }

            if (type) {
                queryObj.type = type;
            }

            let siteMessageList = await ctx.service.siteMessage.find(payload, {
                query: queryObj
            });

            ctx.helper.renderSuccess(ctx, {
                data: siteMessageList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },


    async setMessageHasRead(ctx, app) {

        try {
            let errMsg = '',
                targetIds = ctx.query.ids;
            let messageType = ctx.query.type;
            let queryObj = {};
            // 用户只能操作自己的消息
            let userInfo = ctx.session.user || {};
            if (!_.isEmpty(userInfo)) {
                queryObj.passiveUser = userInfo._id;
            } else {
                throw new Error(ctx.__(ctx.__("validate_error_params")))
            }

            // 设置我所有未读的为已读
            if (targetIds == 'all') {
                if (messageType) {
                    queryObj.type = messageType;
                }
                queryObj.isRead = false;
            } else {
                if (!checkCurrentId(targetIds)) {
                    errMsg = ctx.__("validate_error_params");
                } else {
                    targetIds = targetIds.split(',');
                }
                if (errMsg) {
                    throw new Error(errMsg);
                }
                queryObj['_id'] = {
                    $in: targetIds
                };
            }

            await ctx.service.siteMessage.updateMany(ctx, '', {
                'isRead': true
            }, queryObj)

            ctx.helper.renderSuccess(ctx, {
                data: {}
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }

    },

    // 获取私信概要
    async getSiteMessageOutline(ctx, app) {

        try {

            let userInfo = ctx.session.user;
            // 获取未读消息数量
            let noReadGoodNum = await ctx.service.siteMessage.count({
                isRead: false,
                type: '4',
                passiveUser: userInfo._id
            });

            let noReadGoodContent = await ctx.service.siteMessage.find({
                isPaging: '0',
                pageSize: 1
            }, {
                query: {
                    type: '4',
                    passiveUser: userInfo._id
                }
            })

            let noReadFollowNum = await ctx.service.siteMessage.count({
                isRead: false,
                type: '2',
                passiveUser: userInfo._id
            });
            let noReadFollowContent = await ctx.service.siteMessage.find({
                isPaging: '0',
                pageSize: 1
            }, {
                query: {
                    type: '2',
                    passiveUser: userInfo._id
                }
            })

            let noReadCommentNum = await ctx.service.siteMessage.count({
                isRead: false,
                type: '3',
                passiveUser: userInfo._id
            });
            let noReadCommentContent = await ctx.service.siteMessage.find({
                isPaging: '0',
                pageSize: 1
            }, {
                query: {
                    type: '3',
                    passiveUser: userInfo._id
                }
            })

            let userNotify_num = await ctx.service.systemNotify.count({
                isRead: false,
                user: userInfo._id
            });

            let userNotifyContent = await ctx.service.systemNotify.find({}, {
                query: {
                    isRead: false,
                    user: userInfo._id
                },
                populate: ['notify']
            })

            let renderData = {
                first_privateLetter: userNotifyContent[0] || {},
                private_no_read_num: userNotify_num,
                no_read_good_num: noReadGoodNum,
                first_good_message: noReadGoodContent[0] || {},
                no_read_follow_num: noReadFollowNum,
                first_follow_message: noReadFollowContent[0] || {},
                no_read_comment_num: noReadCommentNum,
                first_comment_message: noReadCommentContent[0] || {},
            }

            ctx.helper.renderSuccess(ctx, {
                data: renderData
            });

        } catch (err) {
            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    }

}

module.exports = SiteMessageController;