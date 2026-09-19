// miniprogram/pages/manage/filters/filters.ts
import { isManager, loadFilter } from '../../../utils'

interface AreaItem {
  name: string;
  campus: string;
}

interface CampusGroup {
  name: string;
  items: AreaItem[];   // 该校区下的区域，一个校区可对应多个区域
  addingArea: boolean; // 是否正在该校区下新增区域
}

interface ColourItem {
  name: string;
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tipText: '正在鉴权...',
    tipBtn: false,
    auth: false,
    // 校区列表（每个校区下挂多个区域）
    campuses: [] as CampusGroup[],
    // 花色列表
    colours: [] as ColourItem[],
    addingCampus: false,
    addingColour: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.checkAuth();
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

  // 没有权限，返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 检查权限
  checkAuth() {
    const that = this;
    isManager(function (res) {
      if (res) {
        that.setData({
          auth: true
        });
        that.reloadFilter();
      } else {
        that.setData({
          tipText: '只有管理员Level-2才能进入嗷',
          tipBtn: true,
        });
        console.log("Not a manager.");
      }
    }, 2);
  },

  // 加载数据库里的 filters，应该只有一个
  reloadFilter() {
    wx.showLoading({
      title: '加载中...',
    });
    const that = this;
    loadFilter().then(res => {
      const campusNames: string[] = Array.isArray(res.campuses) ? res.campuses : [];
      const areas: AreaItem[] = Array.isArray(res.area) ? res.area : [];
      const colour: string[] = Array.isArray(res.colour) ? res.colour : [];

      // 用个object当作字典，先把校区建好，再把区域按 campus 归入对应校区
      const classifier: { [name: string]: CampusGroup } = {};
      for (const name of campusNames) {
        classifier[name] = {
          name: name,
          items: [],
          addingArea: false,
        };
      }
      for (const area of areas) {
        if (classifier[area.campus]) {
          classifier[area.campus].items.push({ name: area.name, campus: area.campus });
        } else {
          console.warn('忽略未配置校区的区域', area);
        }
      }

      that.setData({
        campuses: campusNames.map(name => classifier[name]),
        colours: colour.map(name => ({ name: name })),
        addingCampus: false,
        addingColour: false,
      });
      wx.hideLoading();
    }).catch(err => {
      console.error(err);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    })
  },

  /* ------------------------- 校区 ------------------------- */

  // 展开/收起「新增校区」表单
  toggleAddCampus() {
    this.setData({
      addingCampus: !this.data.addingCampus
    });
  },

  // 确认新增校区：校区不允许重复
  confirmAddCampus(e) {
    const name = (e.detail.value.name || '').trim();
    if (name == '') {
      wx.showToast({
        title: '请输入校区名称',
        icon: 'none'
      });
      return false;
    }
    const campuses = this.data.campuses;
    if (campuses.some(c => c.name == name)) {
      wx.showToast({
        title: '校区不能重复',
        icon: 'none'
      });
      return false;
    }

    campuses.push({
      name: name,
      items: [],
      addingArea: false,
    });
    this.setData({
      campuses: campuses,
      addingCampus: false,
    });
    wx.showToast({
      title: '已添加',
      icon: 'success',
      duration: 800,
    });
  },

  // 校区上移/下移
  moveCampus(e) {
    const index = Number(e.currentTarget.dataset.campusindex);
    const direct = e.currentTarget.dataset.direct; // 'up' or 'down'
    const campuses = this.data.campuses;

    const newIndex = (direct === 'up') ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= campuses.length) {
      return false;
    }

    const temp = campuses[index];
    campuses[index] = campuses[newIndex];
    campuses[newIndex] = temp;
    this.setData({ campuses: campuses });
  },

  // 删除校区：需先清空该校区下的区域，且不能有猫猫在用
  deleteCampus(e) {
    const index = Number(e.currentTarget.dataset.campusindex);
    const campuses = this.data.campuses;
    const campus = campuses[index];

    if (campus.items.length) {
      wx.showToast({
        title: '请先删除该校区下的区域',
        icon: 'none'
      });
      return false;
    }

    wx.showLoading({
      title: '检查中...',
      mask: true
    });
    const db = wx.cloud.database();
    db.collection('cat').where({ campus: campus.name }).count().then(res => {
      if (res.total) {
        wx.hideLoading();
        wx.showToast({
          title: '该校区下还有猫猫，无法删除',
          icon: 'none',
        });
        return false;
      }
      // 执行删除
      campuses.splice(index, 1);
      this.setData({ campuses: campuses }, () => {
        wx.hideLoading();
        wx.showToast({
          title: '删除成功',
        });
      });
    }).catch(err => {
      console.error(err);
      wx.hideLoading();
      wx.showToast({
        title: '检查失败',
        icon: 'none'
      });
    });
  },

  /* ------------------------- 区域 ------------------------- */

  // 在指定校区下展开/收起「新增区域」表单
  toggleAddArea(e) {
    const campusIndex = Number(e.currentTarget.dataset.campusindex);
    const campuses = this.data.campuses;
    campuses[campusIndex].addingArea = !campuses[campusIndex].addingArea;
    this.setData({ campuses: campuses });
  },

  // 确认在所选校区下新增区域：同一校区内不允许重名
  confirmAddArea(e) {
    const campusIndex = Number(e.currentTarget.dataset.campusindex);
    const campuses = this.data.campuses;
    const campus = campuses[campusIndex];
    const name = (e.detail.value.name || '').trim();

    if (name == '') {
      wx.showToast({
        title: '请输入区域名称',
        icon: 'none'
      });
      return false;
    }
    if (campus.items.some(item => item.name == name)) {
      wx.showToast({
        title: '该校区下区域不能重复',
        icon: 'none'
      });
      return false;
    }

    campus.items.push({
      name: name,
      campus: campus.name,
    });
    campus.addingArea = false;
    this.setData({ campuses: campuses });
    wx.showToast({
      title: '已添加',
      icon: 'success',
      duration: 800,
    });
  },

  // 区域上移/下移
  moveArea(e) {
    const campusIndex = Number(e.currentTarget.dataset.campusindex);
    const index = Number(e.currentTarget.dataset.areaindex);
    const direct = e.currentTarget.dataset.direct; // 'up' or 'down'

    const campuses = this.data.campuses;
    const items = campuses[campusIndex].items;

    const newIndex = (direct === 'up') ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) {
      return false;
    }

    const temp = items[index];
    items[index] = items[newIndex];
    items[newIndex] = temp;
    this.setData({ campuses: campuses });
  },

  // 删除区域：有猫猫在用则不允许删
  deleteArea(e) {
    const campusIndex = Number(e.currentTarget.dataset.campusindex);
    const index = Number(e.currentTarget.dataset.areaindex);

    const campuses = this.data.campuses;
    const campus = campuses[campusIndex];
    const area = campus.items[index];

    wx.showLoading({
      title: '检查中...',
      mask: true
    });
    const db = wx.cloud.database();
    db.collection('cat').where({ area: area.name, campus: campus.name }).count().then(res => {
      if (res.total) {
        wx.hideLoading();
        wx.showToast({
          title: '无法删除有猫猫的选项',
          icon: 'none',
        });
        return false;
      }
      // 执行删除
      campus.items.splice(index, 1);
      this.setData({ campuses: campuses }, () => {
        wx.hideLoading();
        wx.showToast({
          title: '删除成功',
        });
      });
    }).catch(err => {
      console.error(err);
      wx.hideLoading();
      wx.showToast({
        title: '检查失败',
        icon: 'none'
      });
    });
  },

  /* ------------------------- 花色 ------------------------- */

  // 展开/收起「新增花色」表单
  toggleAddColour() {
    this.setData({
      addingColour: !this.data.addingColour
    });
  },

  confirmAddColour(e) {
    const name = (e.detail.value.name || '').trim();
    if (name == '') {
      return false;
    }
    const colours = this.data.colours;
    if (colours.some(item => item.name == name)) {
      wx.showToast({
        title: '名字不能重复',
        icon: 'none'
      });
      return false;
    }

    colours.push({ name: name });
    this.setData({
      colours: colours,
      addingColour: false,
    });
  },

  // 花色上移/下移
  moveColour(e) {
    const index = Number(e.currentTarget.dataset.index);
    const direct = e.currentTarget.dataset.direct; // 'up' or 'down'
    const colours = this.data.colours;

    const newIndex = (direct === 'up') ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= colours.length) {
      return false;
    }

    const temp = colours[index];
    colours[index] = colours[newIndex];
    colours[newIndex] = temp;
    this.setData({ colours: colours });
  },

  deleteColour(e) {
    const index = Number(e.currentTarget.dataset.index);
    const colours = this.data.colours;
    const colour = colours[index];

    wx.showLoading({
      title: '检查中...',
      mask: true
    });
    const db = wx.cloud.database();
    db.collection('cat').where({ colour: colour.name }).count().then(res => {
      if (res.total) {
        wx.hideLoading();
        wx.showToast({
          title: '无法删除有猫猫的选项',
          icon: 'none',
        });
        return false;
      }
      colours.splice(index, 1);
      this.setData({ colours: colours }, () => {
        wx.hideLoading();
        wx.showToast({
          title: '删除成功',
        });
      });
    }).catch(err => {
      console.error(err);
      wx.hideLoading();
      wx.showToast({
        title: '检查失败',
        icon: 'none'
      });
    });
  },

  /* ------------------------- 上传 ------------------------- */

  // 确定上传：还原成数据库原始格式 {campuses, area, colour}
  uploadFilters() {
    const that = this;
    const campuses = this.data.campuses;

    // 区域扁平化，每项带上所属校区
    const area: AreaItem[] = [];
    for (const campus of campuses) {
      for (const item of campus.items) {
        area.push({
          name: item.name,
          campus: campus.name,
        });
      }
    }

    wx.showLoading({
      title: '正在上传...',
    });
    wx.cloud.callFunction({
      name: 'updateFilter',
      data: {
        to_upload: {
          area: area,
          campuses: campuses.map(c => c.name),
          colour: this.data.colours.map(c => c.name),
        }
      }
    }).then(res => {
      wx.hideLoading();
      that.reloadFilter();
    }).catch(err => {
      console.error(err);
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    });
  }
})
