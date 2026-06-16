<template>
  <div class="lawyer-zoom-control">
    <a-button icon="minus" size="small" :disabled="value <= min" @click="zoomOut" />
    <span>{{ value }}%</span>
    <a-button icon="plus" size="small" :disabled="value >= max" @click="zoomIn" />
  </div>
</template>

<script lang="ts">
  import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

  @Component({
    name: 'LawyerZoomControl'
  })
  class LawyerZoomControl extends Vue {
    @Prop({ default: 100 }) value!: number;
    @Prop({ default: 80 }) min!: number;
    @Prop({ default: 160 }) max!: number;
    @Prop({ default: 10 }) step!: number;

    zoomIn(): void {
      this.emitInput(Math.min(this.max, this.value + this.step));
    }

    zoomOut(): void {
      this.emitInput(Math.max(this.min, this.value - this.step));
    }

    @Emit('input')
    emitInput(value: number): number {
      return value;
    }
  }

  export default LawyerZoomControl;
</script>

<style lang="less" scoped>
  .lawyer-zoom-control {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
</style>
