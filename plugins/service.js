import LawyerService from "~/service/LawyerService";

export default ({ $axios }, inject) => {
  // 创建服务实例
  const services = {
    lawyer: LawyerService($axios),
  };

  // 注入到Vue实例中，可以通过this.$service访问
  inject("service", services);
};
