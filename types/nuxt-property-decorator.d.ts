declare module "nuxt-property-decorator" {
  import Vue from "vue";
  export { Vue };
  export const Component: any;
  export const Prop: any;
  export const Watch: any;
  export const Emit: any;
  export const Inject: any;
  export const Model: any;
  export const Provide: any;
  export const State: any;
  export const Getter: any;
  export const Action: any;
  export const Mutation: any;
  export const namespace: any;

  export type NuxtContext = {
    app: any;
    $axios: any;
    env: object;
    error: Function;
    from: any;
    isDev: boolean;
    isHMR: boolean;
    isStatic: boolean;
    next: Function;
    params: Record<string, string>;
    payload: any;
    query: Record<string, string>;
    redirect: Function;
    req: any;
    res: any;
    route: any;
    store: any;
  };

  export function asyncData<T = any>(
    cb: (ctx: NuxtContext) => Promise<T> | T
  ): any;

  export function fetch(cb: (ctx: NuxtContext) => Promise<void> | void): any;

  export function head(): any;
}
