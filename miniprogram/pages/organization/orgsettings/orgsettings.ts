// miniprogram/pages/organization/orgsettings/orgsettings.ts
var org_id = undefined;

Page({

  // 分享统一指向猫谱首页
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

  /**
   * 页面的初始数据
   */
  data: {
    orgcat_list: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    org_id = options.org_id;
    this.loadOrg();
  },

  onShow: function () {
    this.loadOrgCat();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadOrgCat();
  },

  
  async loadOrg () {
    const db = wx.cloud.database();
    var org = (await db.collection('organization').doc(org_id).get()).data;
    console.log(org);

    this.setData({
      org: org,
    });
  },

  async loadOrgCat() {
    wx.showLoading({
      title: '加载中...'
    });

    const db = wx.cloud.database();
    var orgcat_total = this.data.orgcat_total;
    if (orgcat_total === undefined) {
      orgcat_total = (await db.collection('orgcat').where({org: org_id}).count()).total;
    }

    var orgcat_list = this.data.orgcat_list;
    if (orgcat_list.length < orgcat_total) {
      var res = await db.collection('orgcat').where({org: org_id})
                        .skip(orgcat_list.length).limit(10).get();
      orgcat_list = orgcat_list.concat(res.data);
    }

    this.setData({
      orgcat_list: orgcat_list,
      orgcat_total: orgcat_total,
    });

    wx.hideLoading();
  },

  showQRCode() {
    if (this.data.org.mpcode) {
      wx.previewImage({
        urls: [this.data.org.mpcode],
      });
      return;
    }

    wx.showLoading({
      title: '生成中...',
    });

    var that = this;
    wx.cloud.callFunction({
      name: 'getOrgMpCode',
      data: {
        _id: this.data.org._id,
        width: 500,
      },
      success: (res) => {
        wx.hideLoading();
        console.log(res);
        wx.previewImage({
          urls: [res.result],
        });
        that.setData({
          'org.mpcode': res.result
        });
      }
    })
  },

  toModifyOrg() {
    wx.navigateTo({
      url: `/pages/manage/modifyOrg/modifyOrg?org_id=${org_id}`,
    });
  },

  toAddCat() {
    wx.navigateTo({
      url: `/pages/organization/addorgcat/addorgcat?org_id=${org_id}`,
    });
  },

  toModifyCat(e) {
    var cat_id = e.currentTarget.dataset._id;
    wx.navigateTo({
      url: `/pages/organization/addorgcat/addorgcat?org_id=${org_id}&orgcat_id=${cat_id}`,
    });
  }
})