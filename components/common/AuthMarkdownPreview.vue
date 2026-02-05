<template>
  <div ref="previewContainer" class="auth-markdown-preview">
    <v-md-preview :text="renderContent" />
  </div>
</template>

<script lang="ts">
  import { Component, Vue, Prop, Watch } from 'nuxt-property-decorator';
  import {
    TRANSPARENT_GIF_DATA_URL,
    extractMarkdownImageUrls,
    replaceMarkdownImageUrls,
    maskMarkdownImageUrls,
    getImageIdFromUrl,
    resolveImageRenderUrl
  } from '~/utils/markdownImageAuth';

  @Component({
    name: 'auth-markdown-preview'
  })
  class AuthMarkdownPreview extends Vue {
    @Prop({ default: '' }) text!: string;
    @Prop({ default: false }) enableImageAuth!: boolean;

    renderContent: string = '';
    private resolveTaskId: number = 0;

    @Watch('text', { immediate: true })
    @Watch('enableImageAuth')
    onSourceChange(): void {
      this.prepareRenderContent();
    }

    beforeDestroy(): void {
      this.resolveTaskId += 1;
    }

    private applyResolvedImageUrls(urlMap: Map<string, string>): void {
      const patch = () => {
        const container = this.$refs.previewContainer as HTMLElement | undefined;
        if (!container) return;

        const images = container.querySelectorAll('img');
        const resolvedByOrder = Array.from(urlMap.values());

        images.forEach((img: HTMLImageElement, index: number) => {
          const srcAttr = img.getAttribute('src') || '';
          let renderUrl = urlMap.get(srcAttr) || urlMap.get(img.src);

          if (!renderUrl) {
            const imageId = getImageIdFromUrl(srcAttr) || getImageIdFromUrl(img.src);
            if (imageId) {
              for (const [originUrl, resolvedUrl] of urlMap.entries()) {
                if (getImageIdFromUrl(originUrl) === imageId) {
                  renderUrl = resolvedUrl;
                  break;
                }
              }
            }
          }

          if (!renderUrl && index < resolvedByOrder.length) {
            renderUrl = resolvedByOrder[index];
          }

          if (renderUrl && img.src !== renderUrl) {
            img.src = renderUrl;
          }
        });
      };

      this.$nextTick(() => {
        patch();
        setTimeout(patch, 0);
      });
    }

    private async prepareRenderContent(): Promise<void> {
      const sourceText = this.text || '';
      const currentTaskId = ++this.resolveTaskId;

      if (!sourceText) {
        this.renderContent = '';
        return;
      }

      if (!this.enableImageAuth) {
        this.renderContent = sourceText;
        return;
      }

      const imageUrls = extractMarkdownImageUrls(sourceText);
      if (imageUrls.length === 0) {
        this.renderContent = sourceText;
        return;
      }

      const urlMap = new Map<string, string>();
      imageUrls.forEach(imageUrl => urlMap.set(imageUrl, TRANSPARENT_GIF_DATA_URL));

      // Prevent unauthenticated browser image loading before custom requests complete.
      this.renderContent = maskMarkdownImageUrls(sourceText, TRANSPARENT_GIF_DATA_URL);

      await Promise.all(
        imageUrls.map(async imageUrl => {
          try {
            const response = await this.$axios.get(imageUrl, { responseType: 'blob' });
            const renderUrl = await resolveImageRenderUrl(response, imageUrl);
            if (renderUrl) {
              urlMap.set(imageUrl, renderUrl);
            }
          } catch (error) {
            console.warn('图片请求失败，保留占位图:', imageUrl, error);
          }
        })
      );

      if (currentTaskId !== this.resolveTaskId) {
        return;
      }

      this.renderContent = replaceMarkdownImageUrls(sourceText, urlMap);
      this.applyResolvedImageUrls(urlMap);
    }
  }

  export default AuthMarkdownPreview;
</script>
