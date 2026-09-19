// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const isManager = (await cloud.callFunction({ name: 'isManager', data: { openid: openid, req: 99 } }));
  if (!isManager.result) {
    return { ok: false, msg: 'not a manager', result: isManager };
  }

  const _id = event._id;
  const level = event.level;

  if (level > 99) {
    return {ok: false, msg: 'level > 99'}
  }

  const result = await db.collection('user').doc(_id).update({
    data: {
      manager: level
    },
  });
  const updated = result.stats.updated;

  // stats.updated === 0 表示写入值与现有值相同（doc 不存在时 update 会直接抛异常），
  // 属于幂等成功。原实现把它判为失败，导致管理员将某人设为「它已有的等级」时误报
  // 「更新失败 updated: 0」。
  if (updated === 0) {
    return { ok: true, noChange: true, msg: '等级未变化', result: result };
  }
  return { ok: true, msg: '更新成功', result: result };
}