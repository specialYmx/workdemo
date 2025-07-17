import Vue from "vue";
import {
  Button,
  Card,
  Table,
  Menu,
  Icon,
  Dropdown,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
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
  message,
} from "ant-design-vue";

// 注册组件
Vue.use(Button);
Vue.use(Card);
Vue.use(Table);
Vue.use(Menu);
Vue.use(Icon);
Vue.use(Dropdown);
Vue.use(Input);
Vue.use(Select);
Vue.use(DatePicker);
Vue.use(Modal);
Vue.use(Form);
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

// 全局挂载message组件
Vue.prototype.$message = message;
