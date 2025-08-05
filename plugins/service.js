import RoadLawyerService from "~/service/RoadLawyerService";

export default ({ $axios }, inject) => {
  // 直接注入roadLawyerService到Vue实例中，可以通过this.$roadLawyerService访问
  inject("roadLawyerService", RoadLawyerService($axios));
};
