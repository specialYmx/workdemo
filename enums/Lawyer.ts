/**
 * 法规分类数据
 * 用于页面中的分类选择器、筛选器等组件
 */

// 一级分类
export const categoryOptions = [
  { label: '综合类', value: '综合类' },
  { label: '机构监管', value: '机构监管' },
  { label: '公司治理', value: '公司治理' },
  { label: '风控合规', value: '风控合规' },
  { label: '信息披露', value: '信息披露' },
  { label: '关联交易', value: '关联交易' },
  { label: '运营与信息统计', value: '运营与信息统计' },
  { label: '环境、社会和治理（ESG）', value: '环境、社会和治理（ESG）' },
  { label: '自律规则', value: '自律规则' },
  { label: '资产配置', value: '资产配置' },
  { label: '存款及有价证券', value: '存款及有价证券' },
  { label: '股权及不动产', value: '股权及不动产' },
  { label: '基础设施', value: '基础设施' },
  { label: '金融产品', value: '金融产品' },
  { label: '保险资管产品', value: '保险资管产品' },
  { label: '产品注册、登记', value: '产品注册、登记' },
  { label: '境外投资', value: '境外投资' },
  { label: '重要政策选编', value: '重要政策选编' }
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
        label: '公司治理'
      },
      {
        value: '董监高管理',
        label: '董监高管理'
      },
      {
        value: '章程',
        label: '章程'
      }
    ]
  },
  {
    value: '风控合规',
    label: '风控合规',
    children: [
      {
        value: '综合类',
        label: '综合类'
      },
      {
        value: '财会类',
        label: '财会类'
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
        label: '信息统计'
      },
      {
        value: '信息系统安全',
        label: '信息系统安全'
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
        label: '存款'
      },
      {
        value: '债券',
        label: '债券'
      },
      {
        value: '股票',
        label: '股票'
      },
      {
        value: '公募基金',
        label: '公募基金'
      },
      {
        value: 'REITs',
        label: 'REITs'
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
        label: '综合性规定'
      },
      {
        value: '集合信托',
        label: '集合信托'
      },
      {
        value: '资产支持计划',
        label: '资产支持计划'
      },
      {
        value: '衍生品及其他',
        label: '衍生品及其他'
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
        label: '规范性文件'
      },
      {
        value: '监管口径',
        label: '监管口径'
      },
      {
        value: '自律规则',
        label: '自律规则'
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
        label: '综合'
      },
      {
        value: '基础设施',
        label: '基础设施'
      },
      {
        value: '创业投资',
        label: '创业投资'
      },
      {
        value: 'PPP',
        label: 'PPP'
      },
      {
        value: '医疗、健康、养老产业',
        label: '医疗、健康、养老产业'
      },
      {
        value: '农业',
        label: '农业'
      },
      {
        value: '其他行业',
        label: '其他行业'
      },
      {
        value: '其他综合性政策文件',
        label: '其他综合性政策文件'
      }
    ]
  }
];

// 部门选项数据（下拉选择）
export const departmentOptions = [
  { value: '董事会', label: '董事会', id: '董事会' },
  { value: '总经理室', label: '总经理室', id: '总经理室' },
  { value: '总监室', label: '总监室', id: '总监室' },
  { value: '组合管理部', label: '组合管理部', id: '组合管理部' },
  { value: '研究部', label: '研究部', id: '研究部' },
  { value: '固定收益投资部', label: '固定收益投资部', id: '固定收益投资部' },
  { value: '权益投资部', label: '权益投资部', id: '权益投资部' },
  { value: '金融工程投资部', label: '金融工程投资部', id: '金融工程投资部' },
  { value: '金融市场部', label: '金融市场部', id: '金融市场部' },
  { value: '金融产品管理部', label: '金融产品管理部', id: '金融产品管理部' },
  { value: '债券业务事业部', label: '债券业务事业部', id: '债券业务事业部' },
  { value: '股权业务事业部', label: '股权业务事业部', id: '股权业务事业部' },
  { value: '股权投资部', label: '股权投资部', id: '股权投资部' },
  { value: '运营管理部', label: '运营管理部', id: '运营管理部' },
  { value: '集中交易部', label: '集中交易部', id: '集中交易部' },
  { value: '信息管理部', label: '信息管理部', id: '信息管理部' },
  { value: '信用评估部', label: '信用评估部', id: '信用评估部' },
  { value: '风险管理部', label: '风险管理部', id: '风险管理部' },
  { value: '投后管理部', label: '投后管理部', id: '投后管理部' },
  { value: '法律合规部', label: '法律合规部', id: '法律合规部' },
  { value: '审计部', label: '审计部', id: '审计部' },
  {
    value: '党委办公室/党委宣传部/办公室/董监事会办公室',
    label: '党委办公室/党委宣传部/办公室/董监事会办公室',
    id: '党委办公室/党委宣传部/办公室/董监事会办公室'
  },
  { value: '党委组织部/人力资源部', label: '党委组织部/人力资源部', id: '党委组织部/人力资源部' },
  { value: '纪委办公室/监察部', label: '纪委办公室/监察部', id: '纪委办公室/监察部' },
  { value: '财务部', label: '财务部', id: '财务部' }
];
