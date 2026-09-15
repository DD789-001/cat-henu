// 负责用户表的管理、使用接口
// 获取当前用户
// 如果数据库中没有会后台自动新建并返回
export function getUser() {
  return new Promise<any>((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'userOp',
      data: {
        op: 'get'
      },
      success: (res) => {
        console.log(res);
        resolve(res.result);
      },
      fail: reject
    });
  });
}

export function hasCustomUserInfo(userInfo):Boolean {
  return Boolean(
    userInfo &&
    userInfo.avatarUrl &&
    userInfo.nickName &&
    userInfo.nickName !== '微信用户'
  );
}

export async function saveUserProfile(nickName:string, avatarUrl:string) {
  const currentUser = await getUser();
  const normalizedNickName = (nickName || '').trim();
  if (!normalizedNickName || normalizedNickName.length > 32) {
    throw new Error('昵称应为 1 至 32 个字符');
  }
  if (!avatarUrl) {
    throw new Error('请选择头像');
  }

  let savedAvatarUrl = avatarUrl;
  if (!avatarUrl.startsWith('cloud://') && !avatarUrl.startsWith('https://')) {
    const extensionMatch = avatarUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';
    const uploadResult = await wx.cloud.uploadFile({
      cloudPath: `avatars/${currentUser._id}-${Date.now()}.${extension}`,
      filePath: avatarUrl
    });
    savedAvatarUrl = uploadResult.fileID;
  }

  const result = await wx.cloud.callFunction({
    name: 'userOp',
    data: {
      op: 'updateProfile',
      userInfo: {
        nickName: normalizedNickName,
        avatarUrl: savedAvatarUrl
      }
    }
  });
  return result.result;
}

export async function getUserInfoOrFalse() {
  const user = await getUser();
  if (hasCustomUserInfo(user.userInfo)) {
    return user;
  }
  wx.showToast({
    title: '请先在拍照月榜完善头像和昵称',
    icon: 'none'
  });
  return false;
}
