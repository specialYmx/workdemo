/**
 * 法规分类数据
 * 用于页面中的分类选择器、筛选器等组件
 */

// 一级分类
export const categoryOptions = [
  { label: "综合类", value: "综合类" },
  { label: "机构监管", value: "机构监管" },
  { label: "公司治理", value: "公司治理" },
  { label: "风控合规", value: "风控合规" },
  { label: "信息披露", value: "信息披露" },
  { label: "关联交易", value: "关联交易" },
  { label: "运营与信息统计", value: "运营与信息统计" },
  { label: "环境、社会和治理（ESG）", value: "环境、社会和治理（ESG）" },
  { label: "自律规则", value: "自律规则" },
  { label: "资产配置", value: "资产配置" },
  { label: "存款及有价证券", value: "存款及有价证券" },
  { label: "股权及不动产", value: "股权及不动产" },
  { label: "基础设施", value: "基础设施" },
  { label: "金融产品", value: "金融产品" },
  { label: "保险资管产品", value: "保险资管产品" },
  { label: "产品注册、登记", value: "产品注册、登记" },
  { label: "境外投资", value: "境外投资" },
  { label: "重要政策选编", value: "重要政策选编" },
];

// 级联分类数据（包含二级分类）
export const cascaderOptions = [
  {
    value: '综合类',
    label: '综合类',
    children: []
  },
  {
    value: '机构监管',
    label: '机构监管',
    children: []
  },
  {
    value: '公司治理',
    label: '公司治理',
    children: [
      {
        value: '公司治理',
        label: '公司治理',
      },
      {
        value: '董监高管理',
        label: '董监高管理',
      },
      {
        value: '章程',
        label: '章程',
      }
    ]
  },
  {
    value: '风控合规',
    label: '风控合规',
    children: [
      {
        value: '综合类',
        label: '综合类',
      },
      {
        value: '财会类',
        label: '财会类',
      }
    ]
  },
  {
    value: '信息披露',
    label: '信息披露',
    children: []
  },
  {
    value: '关联交易',
    label: '关联交易',
    children: []
  },
  {
    value: '运营与信息统计',
    label: '运营与信息统计',
    children: [
      {
        value: '信息统计',
        label: '信息统计',
      },
      {
        value: '信息系统安全',
        label: '信息系统安全',
      }
    ]
  },
  {
    value: '环境、社会和治理（ESG）',
    label: '环境、社会和治理（ESG）',
    children: []
  },
  {
    value: '自律规则',
    label: '自律规则',
    children: []
  },
  {
    value: '资产配置',
    label: '资产配置',
    children: []
  },
  {
    value: '存款及有价证券',
    label: '存款及有价证券',
    children: [
      {
        value: '存款',
        label: '存款',
      },
      {
        value: '债券',
        label: '债券',
      },
      {
        value: '股票',
        label: '股票',
      },
      {
        value: '公募基金',
        label: '公募基金',
      },
      {
        value: 'REITs',
        label: 'REITs',
      }
    ]
  },
  {
    value: '股权及不动产',
    label: '股权及不动产',
    children: []
  },
  {
    value: '基础设施',
    label: '基础设施',
    children: []
  },
  {
    value: '金融产品',
    label: '金融产品',
    children: [
      {
        value: '综合性规定',
        label: '综合性规定',
      },
      {
        value: '集合信托',
        label: '集合信托',
      },
      {
        value: '资产支持计划',
        label: '资产支持计划',
      },
      {
        value: '衍生品及其他',
        label: '衍生品及其他',
      }
    ]
  },
  {
    value: '保险资管产品',
    label: '保险资管产品',
    children: []
  },
  {
    value: '产品注册、登记',
    label: '产品注册、登记',
    children: [
      {
        value: '规范性文件',
        label: '规范性文件',
      },
      {
        value: '监管口径',
        label: '监管口径',
      },
      {
        value: '自律规则',
        label: '自律规则',
      }
    ]
  },
  {
    value: '境外投资',
    label: '境外投资',
    children: []
  },
  {
    value: '重要政策选编',
    label: '重要政策选编',
    children: [
      {
        value: '综合',
        label: '综合',
      },
      {
        value: '基础设施',
        label: '基础设施',
      },
      {
        value: '创业投资',
        label: '创业投资',
      },
      {
        value: 'PPP',
        label: 'PPP',
      },
      {
        value: '医疗、健康、养老产业',
        label: '医疗、健康、养老产业',
      },
      {
        value: '农业',
        label: '农业',
      },
      {
        value: '其他行业',
        label: '其他行业',
      },
      {
        value: '其他综合性政策文件',
        label: '其他综合性政策文件',
      }
    ]
  }
]; 