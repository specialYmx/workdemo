import Vuex from 'vuex';
import Vue from 'vue';
// import { IBankState } from './bank'

Vue.use(Vuex);
export interface IRootState {}

export const store = new Vuex.Store<IRootState>({});
