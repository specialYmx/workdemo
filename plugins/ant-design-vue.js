import Vue from 'vue';
import {
  Button,
  Card,
  Table,
  Menu,
  Icon,
  Dropdown,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Modal,
  Form,
  FormModel,
  Tabs,
  Tag,
  Badge,
  Pagination,
  Divider,
  Layout,
  Row,
  Col,
  Popover,
  Tooltip,
  Radio,
  Avatar,
  List,
  Breadcrumb,
  Empty,
  Spin,
  Cascader,
  Upload,
  Progress,
  Switch,
  Alert,
  message,
  ConfigProvider,
  Checkbox
} from 'ant-design-vue';
import zhCN from 'ant-design-vue/lib/locale-provider/zh_CN';

// 注册组件
Vue.use(Button);
Vue.use(Card);
Vue.use(Table);
Vue.use(Menu);
Vue.use(Icon);
Vue.use(Dropdown);
Vue.use(Input);
Vue.use(InputNumber);
Vue.use(Select);
Vue.use(DatePicker);
Vue.use(Modal);
Vue.use(Form);
Vue.use(FormModel);
Vue.use(Tabs);
Vue.use(Tag);
Vue.use(Badge);
Vue.use(Pagination);
Vue.use(Divider);
Vue.use(Layout);
Vue.use(Row);
Vue.use(Col);
Vue.use(Popover);
Vue.use(Tooltip);
Vue.use(Radio);
Vue.use(Avatar);
Vue.use(List);
Vue.use(Breadcrumb);
Vue.use(Empty);
Vue.use(Spin);
Vue.use(Cascader);
Vue.use(Upload);
Vue.use(Progress);
Vue.use(Switch);
Vue.use(Alert);
Vue.use(ConfigProvider);
Vue.use(Checkbox);

// 设置中文本地化
Vue.prototype.$antLocale = zhCN;

// 全局挂载message组件
Vue.prototype.$message = message;

// 全局挂载Modal.confirm方法
Vue.prototype.$confirm = Modal.confirm;
