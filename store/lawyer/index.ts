import { Module, VuexModule, Mutation, getModule } from 'vuex-module-decorators';
import { store } from '../index';

interface RefreshFlagsState {
  manualReviewList: boolean;
  knowledgeList: boolean;
  updatesList: boolean;
  [key: string]: boolean;
}

export interface LawyerState {
  refreshFlags: RefreshFlagsState;
}

@Module({
  namespaced: true,
  name: 'lawyer',
  store,
  dynamic: true
})
class LawyerModule extends VuexModule implements LawyerState {
  refreshFlags: RefreshFlagsState = {
    manualReviewList: false,
    knowledgeList: false,
    updatesList: false
  };

  @Mutation
  markPageRefresh(pageName: string): void {
    this.refreshFlags = {
      ...this.refreshFlags,
      [pageName]: true
    };
  }

  @Mutation
  clearPageRefresh(pageName: string): void {
    this.refreshFlags = {
      ...this.refreshFlags,
      [pageName]: false
    };
  }
}

export const LawyerStoreModule = getModule(LawyerModule);
