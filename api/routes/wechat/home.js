const router = require('koa-router')()
    // node环境请求模块
const superagent = require('superagent')
    // 数据库配置
const sql = require('../config/db.config.js')
    // node自带加密模块
const crypto = require('crypto')
    // 时间格式化中间件
const moment = require('moment')
    // 消息模板
const MsgTemplate = require('../common/msgTemplate.js')

router.prefix('/wechat')

/**
 * 热门列表数据接口
 * @param  {[type]} '/hot'     [description]
 * @param  {[type]} async(ctx, next          [description]
 * @return {[json]}            [description]
 */
router.post('/hot', async(ctx, next) => {
    let page = parseInt(ctx.request.body.page) || 0;
    let pageSize = parseInt(ctx.request.body.pageSize) || 4;
    let userId = ctx.request.body.userId;
    console.log(ctx.request.body)
    let data = [],
        length = 0,
        list;
    await sql.query("SELECT * FROM message_list")
        .then(res => {
            length = res.length
        })
        .catch(err => {
            console.log(err)
        })
        // 查询列表页
    await sql.query("SELECT * FROM message_list ORDER BY views desc limit 0," + (page + 1) * pageSize)
        .then(res => {
            list = res
        })
        .catch(err => {
            console.log(err)
        })
    for (let index in list) {
        let authorInfo;
        // 查询用户信息
        await sql.query("SELECT * FROM user WHERE user_id = '" + list[index].author_id + "'")
            .then(result => {
                // console.log(result)
                authorInfo = {
                    userId: result[0].id,
                    nickname: result[0].nickname,
                    avatarUrl: result[0].avatar_url,
                    level: result[0].level
                }
            }).catch(error => {
                console.log(error);
            })

        // 查询是否点赞
        // console.log(list[index].id,userId)
        let isPraise = false;
        await sql.query("SELECT * FROM message_praise WHERE user_id = '" + userId + "' AND message_id = '" + list[index].id + "'")
            .then(res => {
                console.log(res.length)
                if (res.length != 0) {
                    isPraise = true;
                }
            }).catch(error => {
                console.log(error);
            })


        // 查询评论信息
        await sql.query("SELECT * FROM comments WHERE message_id = " + list[index].id)
            .then(comments => {
                data[index] = {
                    comments: comments,
                    authorInfo: authorInfo,
                    content: list[index],
                    img: list[index].img.split(','),
                    isPraise: isPraise
                }
            }).catch(error => {
                console.log(error);
            })
    }
    ctx.body = {
        state: 1,
        data: data,
        length: length
    };
})


/**
 * 最新发布列表数据接口
 * @param  {[type]} '/newest'     [description]
 * @param  {[type]} async(ctx, next          [description]
 * @return {[json]}            [description]
 */
router.post('/newest', async(ctx, next) => {
    let page = parseInt(ctx.request.body.page) || 0;
    let pageSize = parseInt(ctx.request.body.pageSize) || 4;
    let userId = ctx.request.body.userId;
    console.log(ctx.request.body)
    let data = [],
        length = 0,
        list;
    await sql.query("SELECT * FROM message_list")
        .then(res => {
            length = res.length
        })
        .catch(err => {
            console.log(err)
        })
        // 查询列表页
    await sql.query("SELECT * FROM message_list ORDER BY date desc limit 0," + (page + 1) * pageSize)
        .then(res => {
            list = res
        })
        .catch(err => {
            console.log(err)
        })
    for (let index in list) {
        let authorInfo;
        // 查询用户信息
        await sql.query("SELECT * FROM user WHERE user_id = '" + list[index].author_id + "'")
            .then(result => {
                // console.log(result)
                authorInfo = {
                    userId: result[0].id,
                    nickname: result[0].nickname,
                    avatarUrl: result[0].avatar_url,
                    level: result[0].level
                }
            }).catch(error => {
                console.log(error);
            })

        // 查询是否点赞
        console.log(list[index].id, userId)
        let isPraise = false;
        await sql.query("SELECT * FROM message_praise WHERE user_id = '" + userId + "' AND message_id = '" + list[index].id + "'")
            .then(res => {
                console.log(res.length)
                if (res.length != 0) {
                    isPraise = true;
                }
            }).catch(error => {
                console.log(error);
            })


        // 查询评论信息
        await sql.query("SELECT * FROM comments WHERE message_id = " + list[index].id)
            .then(comments => {
                data[index] = {
                    comments: comments,
                    authorInfo: authorInfo,
                    content: list[index],
                    img: list[index].img.split(','),
                    isPraise: isPraise
                }
            }).catch(error => {
                console.log(error);
            })
    }
    ctx.body = {
        state: 1,
        data: data,
        length: length
    };
})



/**
 * 内容浏览量统计
 * @param  {[type]} '/' [description]
 * @param  {[json]} async(ctx, next          [description]
 * @return {[type]}            [description]
 */
router.get('/views', async(ctx, next) => {
    console.log(ctx.query)
    let data = ctx.query
    await sql.query("UPDATE message_list SET views = '" + data.views + "' WHERE id = " + data.id)
        .then(result => {
            console.log("浏览量统计成功！")
        }).catch(error => {
            console.log(error);
        })
    ctx.body = {
        state: 1,
    }
})

/**
 * 发布内容点赞接口
 */
router.get('/praises', async(ctx, next) => {
    console.log(ctx.query)
    let data = ctx.query;

    await sql.query("SELECT * FROM message_praise WHERE user_id = '" + data.userId + "' AND message_id = '" + data.id + "'")
        .then(res => {
            console.log(res.length)
            if (res.length == 0) {
                sql.query("INSERT INTO message_praise (user_id, message_id) value ('" + data.userId + "','" + data.id + "')")
                    .then(res => {
                        console.log('点赞成功！', res);
                    }).catch(error => {
                        console.log(error);
                    })
            } else {
                sql.query("delete from message_praise WHERE user_id = '" + data.userId + "' AND message_id = '" + data.id + "'")
                    .then(res => {
                        console.log('取消点赞！', res);
                    }).catch(error => {
                        console.log(error);
                    })
            }
        }).catch(error => {
            console.log(error);
        })

    // 更新文章列表点赞数
    sql.query("UPDATE message_list SET praises = '" + data.praises + "' WHERE id = '" + data.id + "'")
        .then(res => {
            console.log("点赞数据统计成功！")
        })
    ctx.body = {
        state: 1,
    }
})

/**
 * 发布图片接口
 * @param  {[type]} '/release' [description]
 * @param  {[json]} async(ctx, next          [description]
 * @return {[type]}            [description]
 */
router.get('/release', async(ctx, next) => {
    console.log(ctx.query)
    let data = ctx.query
    let date = moment().format("YYYY-MM-DD HH:mm:ss")
    console.log('发布信息', date)
    let formId = data.formId;
    let user_id = data.userId;
    let msgTitle = data.title || data.description;
    await sql.query("INSERT INTO message_list ( title, description, author_id, img, date, location) VALUES ('" + data.title + "','" + data.description + "','" + user_id + "','" + data.imgArr + "','" + date + "','" + data.location + "')")
        .then(result => {
            console.log("发布成功！");
        }).catch(error => {
            console.log(error);
        })

    // 查询id
    let lastId;
    await sql.query("SELECT * FROM message_list ORDER BY id desc")
        .then(res => {
            lastId = res[0].id;
        }).catch(error => {
            console.log(error);
        })
        // 用户信息查询
    let integral, pushState, openId, nickname;
    await sql.query("SELECT * FROM user WHERE user_id ='" + user_id + "'")
        .then(res => {
            // console.log(res)
            integral = res[0].integral + 5; // 获取积分
            openId = res[0].openid; // openid
            pushState = res[0].push; // 获取推送状态
            nickname = res[0].nickname; // 发布人

        }).catch(error => {
            console.log(error);
        })

    // 等级称号设置
    let level;
    switch (true) {
        case integral < 50:
            level = '摄影菜鸟';
            break;
        case integral >= 50 && integral < 200:
            level = '摄影新手';
            break;
        case integral >= 200 && integral < 400:
            level = '摄影爱好者';
            break;
        case integral >= 400 && integral < 1000:
            level = '摄影发烧友';
            break;
        case integral >= 1000 && integral < 2000:
            level = '专业摄影师';
            break;
        default:
            level = '摄影大咖';
    }

    // 更新积分
    await sql.query("UPDATE user SET integral = '" + integral + "', level = '" + level + "' WHERE user_id ='" + user_id + "'")
        .then(res => {
            console.log('发布成功，积分更新成功！')
            if (pushState) {
                //  调用消息模板
                MsgTemplate.publishMsg(lastId, integral, formId, openId, nickname, msgTitle);
            }

        }).catch(error => {
            console.log(error);
        })
    ctx.body = {
        state: 1
    }
})

/**
 * [列表详情接口]
 * @param  {[int]}    [列表id]
 * @return {[json]}   [详情数据]
 */
router.post('/detail', async(ctx, next) => {
    console.log(ctx.query)
    let userId = ctx.request.body.userId;
    let data = {};
    await sql.query("SELECT * FROM message_list WHERE id = " + ctx.request.body.id)
        .then(result => {
            data = {
                detail: result[0],
                img: result[0].img.split(',')
            }
        }).catch(error => {
            console.log(error);
        })

    // 获取当前用户是否为当前文章点赞
    let isPraise = false;
    await sql.query("SELECT * FROM message_praise WHERE user_id = '" + userId + "' AND message_id = '" + ctx.request.body.id + "'")
        .then(res => {
            console.log(res.length)
            if (res.length != 0) {
                isPraise = true;
            }
        }).catch(error => {
            console.log(error);
        })

    // 查询发布者信息
    await sql.query("SELECT * FROM user WHERE user_id ='" + data.detail.author_id + "'")
        .then(result => {
            ctx.body = {
                state: 1,
                isPraise: isPraise,
                detail: data.detail,
                img: data.img,
                userInfo: {
                    userId: result[0].id,
                    nickname: result[0].nickname,
                    avatarUrl: result[0].avatar_url,
                    level: result[0].level
                }
            }
        }).catch(error => {
            console.log(error);
        })
})

/**
 * [详情评论列表接口]
 * @param  {[int]}    [列表id]
 * @param  {[string]} [user_id]
 * @return {[json]}   [结果]
 */
router.get('/addComment', async(ctx, next) => {
    console.log(ctx.query)
    let msgId = ctx.query.id; // 详情id
    let authorId = ctx.query.authorId; // 发布者的authorId
    // let formId = ctx.query.formId; // formId
    let title = ctx.query.detailTitle; // 详情标题
    let text = ctx.query.text; // 评论文字

    let date = moment().format("YYYY-MM-DD HH:mm:ss");
    await sql.query("INSERT INTO comments (message_id, user_id, comment, date) VALUES ('" + msgId + "', '" + ctx.query.userId + "', '" + text + "', '" + date + "')")
        .then(result => {
            // MsgTemplate.sendCommentMsg(msgId, formId, authorId, title, text); // 调用消息模板
            ctx.body = {
                state: 1,
                info: "评论成功"
            }
        }).catch(error => {
            console.log(error);
        })
})

/**
 * [详情分享接口]
 * @param  {[int]}    [详情]
 * @param  {[int]}    [分享数]
 * @return {[json]}   [结果]
 */
router.get('/detailShare', async(ctx, next) => {
    console.log(ctx.query)
    let data = ctx.query;
    await sql.query("UPDATE message_list SET shares = '" + data.shares + "' WHERE id = " + data.detailId)
        .then(result => {
            console.log("分享统计成功！")
        }).catch(error => {
            console.log(error);
        })
    ctx.body = {
        state: 1,
    }
})


/**
 * [获取详情评论接口]
 * @param  {[int]}  [列表id]
 * @return {[json]}  [评论、评论用户、评论回复、回复用户信息]
 */
router.get('/getComment', async(ctx, next) => {
    console.log(ctx.query)
    let data = [],
        list;
    await sql.query("SELECT * FROM comments WHERE message_id = " + ctx.query.id + " ORDER BY id desc")
        .then(result => {
            list = result;
        }).catch(error => {
            console.log(error);
        })
    for (let index in list) {
        // 查询用户信息
        let userInfo;
        await sql.query("SELECT * FROM user WHERE user_id = '" + list[index].user_id + "'")
            .then(result => {
                userInfo = {
                    userId: result[0].id,
                    nickname: result[0].nickname,
                    avatarUrl: result[0].avatar_url,
                    level: result[0].level
                };
            }).catch(error => {
                console.log(error);
            })

        // 查询回复列表
        let reply = [],
            replyList;
        await sql.query("SELECT * FROM reply_comments WHERE comment_id = " + list[index].id)
            .then(result => {
                // console.log("回复",list[index].id)
                replyList = result
            }).catch(error => {
                console.log(error);
            })
        for (let i in replyList) {
            // 查询回复每条的用户信息
            let userInfo;
            await sql.query("SELECT * FROM user WHERE user_id = '" + replyList[i].user_id + "'")
                .then(result => {
                    reply[i] = {
                        replyMsg: replyList[i],
                        replyUser: {
                            userId: result[0].id,
                            nickname: result[0].nickname,
                            avatarUrl: result[0].avatar_url
                        }
                    }
                }).catch(error => {
                    console.log(error);
                })
        }

        let item = {
            comment: list[index],
            userInfo: userInfo,
            reply: reply
        }

        data.push(item);
    };
    ctx.body = {
        state: 1,
        data: data,
    };
})

/**
 * [评论点赞接口]
 * @param  {[int]}  [评论id]
 * @param  {[int]}  [当前点赞数]
 * @return {[json]}  [成功信息]
 */
router.get('/commentPraise', async(ctx, next) => {
    console.log(ctx.query)
    let data = ctx.query
    await sql.query("UPDATE comments SET praise = '" + data.praise + "' WHERE id = '" + data.commentId + "'")
        .then(result => {
            console.log("点赞成功！")
        }).catch(error => {
            console.log(error);
        })
    ctx.body = {
        state: 1,
    }
})

/**
 * [回复评论接口]
 * @param  {[int]}  [评论id]
 * @param  {[string]}  [user_id]
 * @return {[json]}  [成功信息]
 */
router.get('/commentReply', async(ctx, next) => {
    console.log(ctx.query)
    let data = ctx.query
    let date = moment().format("YYYY-MM-DD HH:mm:ss");
    await sql.query("INSERT INTO reply_comments (comment_id, user_id, text, date) VALUES ('" + ctx.query.commentId + "', '" + ctx.query.userId + "', '" + ctx.query.text + "', '" + date + "')")
        .then(result => {
            ctx.body = {
                state: 1,
                info: "回复成功"
            }
        }).catch(error => {
            console.log(error);
        })
})


module.exports = router
