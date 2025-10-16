import { Module, VuexModule, Mutation, Action, getModule } from 'vuex-module-decorators'
import { store } from '../index'

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

  get needRefresh() {
    return (pageName: string): boolean => {
      return this.refreshFlags[pageName] || false;
    };
  }

  @Mutation
  SET_REFRESH_FLAG(pageName: string): void {
    if (Object.prototype.hasOwnProperty.call(this.refreshFlags, pageName)) {
      this.refreshFlags = {
        ...this.refreshFlags,
        [pageName]: true
      };
    }
  }

  @Mutation
  CLEAR_REFRESH_FLAG(pageName: string): void {
    if (Object.prototype.hasOwnProperty.call(this.refreshFlags, pageName)) {
      this.refreshFlags = {
        ...this.refreshFlags,
        [pageName]: false
      };
    }
  }

  @Action
  markPageRefresh(pageName: string): void {
    this.SET_REFRESH_FLAG(pageName);
  }

  @Action
  clearPageRefresh(pageName: string): void {
    this.CLEAR_REFRESH_FLAG(pageName);
  }
}

export const LawyerStoreModule = getModule(LawyerModule);