// miniprogram/pages/info/photoRank/photoRank.ts
import { getUser, hasCustomUserInfo, saveUserProfile } from '../../../user'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    profileDraft: {
      avatarUrl: '',
      nickName: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {
    await this.loadProfile();
    this.getRank();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '拍照月榜 - HENU 猫协'
    }
  },

  async loadProfile() {
    try {
      const user = await getUser();
      if (hasCustomUserInfo(user.userInfo)) {
        this.setData({ userInfo: user.userInfo });
      }
    } catch (error) {
      console.error('加载用户资料失败', error);
    }
  },

  chooseAvatar(e) {
    this.setData({
      'profileDraft.avatarUrl': e.detail.avatarUrl
    });
  },

  inputNickname(e) {
    this.setData({
      'profileDraft.nickName': e.detail.value
    });
  },

  async saveProfile() {
    wx.showLoading({title: '保存中...', mask: true});
    try {
      const user = await saveUserProfile(
        this.data.profileDraft.nickName,
        this.data.profileDraft.avatarUrl
      );
      this.setData({ userInfo: user.userInfo }, () => this.getMyRank());
      wx.showToast({title: '资料已保存'});
    } catch (error) {
      console.error('保存用户资料失败', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },
  getRank(event) {
    const that = this;
    const db = wx.cloud.database();
    db.collection('photo_rank').orderBy('mdate', 'desc').limit(1).get().then(res => {
      const rank_stat = res.data.length ? res.data[0].stat : {};
      console.log(rank_stat);
      var ranks = [];
      for (const key in rank_stat) {
        ranks.push({
          _openid: key,
          count: rank_stat[key].count,
          userInfo: rank_stat[key].userInfo,
        })
      }
      ranks.sort((a, b) => {
        return parseInt(b.count) - parseInt(a.count)
      });
      console.log(ranks);
      for (var i = 0; i < ranks.length; i++) {
        ranks[i].rank = i+1;
      }
      for (var i = 1; i<ranks.length; i++) {
        if (ranks[i].count == ranks[i-1].count) {
          ranks[i].rank = ranks[i - 1].rank;
        }
      }
      that.setData({
        ranks: ranks
      }, () => { that.getMyRank() })
    });
  },

  getMyRank() {
    if (!this.data.userInfo || !this.data.ranks) {
      return false;
    }
    const that = this;
    const ranks = this.data.ranks;
    wx.cloud.callFunction({
      name: 'login',
      complete: (res) => {
        console.log(res);
        const openid = res.result.openid;
        console.log(ranks);
        for (const i in ranks) {
          if (ranks[i]._openid === openid) {
            that.setData({
              'userInfo.photo_rank': ranks[i].rank,
              'userInfo.photo_count': ranks[i].count
            });
            return;
          }
        }
      }
    })
    
  }
})
