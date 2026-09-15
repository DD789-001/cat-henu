// 负责用户表的各种操作
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();

function normalizeUserInfo(userInfo) {
  if (!userInfo || typeof userInfo !== 'object') {
    throw new Error('userInfo is required');
  }
  const nickName = typeof userInfo.nickName === 'string' ? userInfo.nickName.trim() : '';
  const avatarUrl = typeof userInfo.avatarUrl === 'string' ? userInfo.avatarUrl : '';
  if (!nickName || nickName.length > 32) {
    throw new Error('invalid nickName');
  }
  if (!avatarUrl || avatarUrl.length > 512) {
    throw new Error('invalid avatarUrl');
  }
  return { nickName, avatarUrl };
}

function defaultNickname(id) {
  const digits = String(id || '')
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) % 1000000;
  return `HENU 猫友 ${String(digits).padStart(6, '0')}`;
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  // 获取当前操作是干啥子的
  const op = event.op;
  switch(op) {
    case 'get': {
      let user = (await db.collection('user').where({'openid': openid}).get()).data[0];
      if (user) {
        if (!user.userInfo || user.userInfo.nickName === '微信用户') {
          await db.collection('user').doc(user._id).update({
            data: {
              userInfo: {
                ...(user.userInfo || {}),
                nickName: defaultNickname(user._id)
              }
            }
          });
          user = (await db.collection('user').doc(user._id).get()).data;
        }
        return user;
      }
      await db.collection('user').add({data: {'openid': openid}});
      user = (await db.collection('user').where({ 'openid': openid }).get()).data[0];
      await db.collection('user').doc(user._id).update({
        data: {
          userInfo: {
            nickName: defaultNickname(user._id),
            avatarUrl: ''
          }
        }
      });
      return (await db.collection('user').doc(user._id).get()).data;
    }
    case 'update':
    case 'updateProfile': {
      const currentUser = (await db.collection('user').where({'openid': openid}).get()).data[0];
      if (!currentUser) {
        throw new Error('user not found');
      }
      const userInfo = normalizeUserInfo(
        event.op === 'updateProfile' ? event.userInfo : event.user && event.user.userInfo
      );
      await db.collection('user').doc(currentUser._id).update({
        data: { userInfo }
      });
      return (await db.collection('user').where({ 'openid': openid }).get()).data[0];
    }
    default: {
      return "unknow op: " + op;
    }
  }
}
