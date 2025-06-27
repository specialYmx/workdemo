module.exports = {
  extends: ["stylelint-config-standard", "stylelint-config-prettier"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["function", "if", "each", "include", "mixin", "extend"],
      },
    ],
    "declaration-empty-line-before": null,
    "no-descending-specificity": null,
    "selector-pseudo-element-no-unknown": [
      true,
      {
        ignorePseudoElements: ["v-deep"],
      },
    ],
    "property-no-unknown": [
      true,
      {
        ignoreProperties: ["lines", "webkit-line-clamp", "webkit-box-orient"],
      },
    ],
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["deep", "global"],
      },
    ],
    "property-no-vendor-prefix": [
      true,
      {
        ignoreProperties: ["line-clamp", "box-orient"],
      },
    ],
  },
};
