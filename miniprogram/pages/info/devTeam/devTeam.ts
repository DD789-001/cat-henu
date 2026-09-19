// miniprogram/pages/info/devTeam/devTeam.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {

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
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

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

  copyOpenSourceLink: function() {
    wx.setClipboardData({
      data: 'https://github.com/DD789-001/cat-henu',
    });
  }
})