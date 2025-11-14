/**
 * 个人工具函数集合
 * 包含通用的工具函数
 */

/**
 * HTTP响应头接口
 */
export interface ResponseHeaders {
  [key: string]: string | string[] | undefined;
  'content-disposition'?: string;
  'content-type'?: string;
  'content-length'?: string;
}

/**
 * 文件下载结果接口
 */
export interface DownloadResult {
  data: Blob;
  headers: ResponseHeaders;
}

/**
 * 消息服务接口
 */
export interface MessageService {
  // 下载工具仅用到这两个方法，保持最小契约，避免与 UI 库类型不一致
  success(content: string, duration?: number): void;
  error(content: string, duration?: number): void;
}

/**
 * 下载配置选项接口
 */
export interface DownloadOptions {
  /** 文件名，如果后端响应头中有content-disposition则优先使用后端设置的文件名 */
  fileName?: string;
  /** 是否显示消息提示，默认为 false */
  showMessage?: boolean;
  /** 消息服务实例，当 showMessage 为 true 时必须提供 */
  messageService?: MessageService;
}

/**
 * 简化的文件下载函数 - 推荐使用
 * @param fileData - 文件数据（Blob 或包含 data 和 headers 的对象）
 * @param options - 下载配置选项
 * @returns boolean - 下载是否成功
 */
export const downloadFileWithMessage = (
  fileData: Blob | DownloadResult | null,
  options: DownloadOptions
): boolean => {
  if (!fileData) {
    console.error('文件数据为空');
    return false;
  }

  try {
    let blob: Blob;
    let fileName = options.fileName;
    // 处理不同类型的文件数据
    if (fileData instanceof Blob) {
      blob = fileData;
    } else if (fileData && typeof fileData === 'object' && 'data' in fileData) {
      if (!(fileData.data instanceof Blob)) {
        console.error('无效的文件数据类型');
        return false;
      }
      blob = fileData.data;

      // 如果后端响应头中有content-disposition，优先使用后端设置的文件名
      if (fileData.headers?.['content-disposition']) {
        const disposition = fileData.headers['content-disposition'];
        const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (matches && matches[1]) {
          const backendFileName = decodeURI(matches[1].replace(/['"]/g, '')).trim();
          // 检查后端返回的文件名是否有效（不为空、null、undefined等）
          if (backendFileName && backendFileName !== 'null' && backendFileName !== 'undefined') {
            fileName = backendFileName;
          }
        }
      }
    } else {
      console.error('不支持的文件数据格式');
      return false;
    }

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // 添加到DOM并触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 清理URL对象
    window.URL.revokeObjectURL(url);

    // 显示成功消息
    if (options.showMessage && options.messageService) {
      options.messageService.success(`下载成功: ${fileName}`);
    }

    return true;
  } catch (error) {
    console.error('文件下载失败:', error);

    // 显示错误消息
    if (options.showMessage && options.messageService) {
      options.messageService.error('下载失败，请重试');
    }

    return false;
  }
};
