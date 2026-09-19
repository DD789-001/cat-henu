// miniprogram/pages/info/feedback/feedback.ts
import config from '../../../config'

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  toMyFeedback() {
    wx.navigateTo({
      url: '/pages/info/feedback/myFeedback/myFeedback'
    });
  },

  toFeedback() {
    wx.navigateTo({
      url: '/pages/genealogy/feedbackDetail/feedbackDetail',
    })
  },

  toNewCat() {
    const src = config.feedback_wj_img;
    wx.previewImage({
      urls: [src],
      success: (res) => {
        console.log(res);
      },
      fail: (res) => {
        console.log(res);
      },
      complete: (res) => {
        console.log(res);
      },
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'HENU 猫协 - 发现校园身边的猫咪',
      path: '/pages/genealogy/genealogy',
    }
  },
    // 分享到朋友圈（微信限制：不能指定 path，落地页只能是当前页）
  onShareTimeline: function () {
    return {
      title: 'HENU 猫协 - 发现校园身边的猫咪',
    }
  },
})