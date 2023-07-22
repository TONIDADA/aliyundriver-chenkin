const axios = require('axios')

const updateAccesssTokenURL = 'https://auth.aliyundrive.com/v2/account/token'
const signinURL = 'https://member.aliyundrive.com/v1/activity/sign_in_list?_rx-s=mobile'
const rewardURL = 'https://member.aliyundrive.com/v1/activity/sign_in_reward?_rx-s=mobile'

// 使用 refresh_token 更新 access_token
function updateAccesssToken(queryBody, remarks) {
    const errorMessage = [remarks, '更新 access_token 失败']
    return axios(updateAccesssTokenURL, {
        method: 'POST',
        data: queryBody,
        headers: { 'Content-Type': 'application/json' }
    })
    .then(d => d.data)
    .then(d => {
        const { code, message, nick_name, refresh_token, access_token } = d
        if (code) {
            if (
                code === 'RefreshTokenExpired' ||
                code === 'InvalidParameter.RefreshToken'
            )
                errorMessage.push('refresh_token 已过期或无效')
            else 
                errorMessage.push(message)
            return Promise.reject(errorMessage.join(', '))
        }
        return { nick_name, refresh_token, access_token }
    })
    .catch(e => {
        errorMessage.push(e.message)
        return Promise.reject(errorMessage.join(', '))
    })
}

//签到列表
function sign_in(access_token, remarks) {
    const sendMessage = [remarks]
    return axios(signinURL, {
        method: 'POST',
        data: {
            isReward: false
        },
        headers: {
            Authorization: access_token,
            'Content-Type': 'application/json'
        }
    })
    .then(d => d.data)
    .then(async json => {
        if (!json.success) {
                sendMessage.push('签到失败', json.message)
                return Promise.reject(sendMessage.join(', '))
        }

        sendMessage.push('签到成功')
        const { signInLogs, signInCount } = json.result
        const currentSignInfo = signInLogs[signInCount - 1] // 当天签到信息
        sendMessage.push(`本月累计签到 ${signInCount} 天`)
        // 未领取奖励列表
        const rewards = signInLogs.filter(
            v => v.status === 'normal' && !v.isReward
        )
        if (rewards.length) {
            for await (reward of rewards) {
            const signInDay = reward.day
            try {
                const rewardInfo = await getReward(access_token, signInDay)
                sendMessage.push(
                    `第${signInDay}天奖励领取成功: 获得${rewardInfo.name || ''}${
                        rewardInfo.description || ''
                    }`
                )
            } catch (e) {
                    sendMessage.push(`第${signInDay}天奖励领取失败:`, e)
            }
            }
        } else if (currentSignInfo.isReward) {
            sendMessage.push(
                `今日签到获得${currentSignInfo.reward.name || ''}${
                    currentSignInfo.reward.description || ''
                }`
            )
        }

        return sendMessage.join(', ')
    })
    .catch(e => {
        sendMessage.push('签到失败')
        sendMessage.push(e.message)
        return Promise.reject(sendMessage.join(', '))
    })
}

// 领取奖励
function getReward(access_token, signInDay) {
    return axios(rewardURL, {
        method: 'POST',
        data: { signInDay },
        headers: {
            authorization: access_token,
            'Content-Type': 'application/json'
        }
    })
    .then(d => d.data)
    .then(json => {
      if (!json.success) {
        return Promise.reject(json.message)
      }

      return json.result
    })
}

// 获取环境变量
async function getRefreshToken() {
    let refreshToken = process.env.refreshToken || [];
  
    let refreshTokenArray = []
  
    if (Array.isArray(refreshToken)) 
        refreshTokenArray = refreshToken
    else if (refreshToken.indexOf('&') > -1)
        refreshTokenArray = refreshToken.split('&')
    else if (refreshToken.indexOf('\n') > -1)
        refreshTokenArray = refreshToken.split('\n')
    else 
        refreshTokenArray = [refreshToken]

    if (!refreshTokenArray.length) {
        console.error("未获取到refreshToken, 程序终止")
        process.exit(0);
    }
    
    return refreshTokenArray
}

async function sent_message_by_pushplus(message) {
    const PUSHPLUS_TOKEN = process.env.PUSHPLUS_TOKEN;
    if (!PUSHPLUS_TOKEN) {
        return;
    }
    console.log("=> 发送pushplus: \n", message);
    let timer = new Date()
    let data = {
        token: PUSHPLUS_TOKEN,
        title: "aliyundriver-chenkin_" + timer.toLocaleString(),
        content: message
    }
    try {
        await axios.post("http://www.pushplus.plus/send", data);
        console.log("=> 发送pushplus成功");
    } catch (error) {
        console.log("=> 发送pushplus失败:");
        console.error(error);
    }
}

!(async () => {
    const refreshTokenArray = await getRefreshToken()
    const message = []
    let index = 1
    for await (refreshToken of refreshTokenArray) {
        let remarks = refreshToken.remarks || `账号${index}`
        const queryBody = {
            grant_type: 'refresh_token',
            refresh_token: refreshToken.value || refreshToken
        }
        try {
            const { nick_name, refresh_token, access_token } =
                await updateAccesssToken(queryBody, remarks)

            if (nick_name && nick_name !== remarks)
                remarks = `${nick_name}(${remarks})`

            const sendMessage = await sign_in(access_token, remarks)
            console.log(sendMessage + (index < refreshTokenArray.length ? '\n' : ''))
            message.push(sendMessage)
        } catch (e) {
            console.error(e)
            message.push(e)
        }
        index++
    }
    await sent_message_by_pushplus(message.join('\n'));
})()
