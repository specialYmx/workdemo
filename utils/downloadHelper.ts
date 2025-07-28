/**
 * 下载文件工具函数
 */

/**
 * HTTP响应头接口
 */
export interface ResponseHeaders {
  [key: string]: string | string[] | undefined;
  "content-disposition"?: string;
  "content-type"?: string;
  "content-length"?: string;
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
  loading(content: string, duration?: number): void;
  success(content: string, duration?: number): void;
  error(content: string, duration?: number): void;
  destroy(): void;
}

/**
 * 下载服务函数类型
 */
export type DownloadServiceFunction<T = Record<string, unknown>> = (
  params: T
) => Promise<DownloadResult | null>;

/**
 * 处理文件下载
 * @param result - API返回的下载结果
 * @param defaultFileName - 默认文件名
 * @returns boolean - 下载是否成功
 */
export function handleFileDownload(
  result: DownloadResult | null,
  defaultFileName: string
): boolean {
  if (!result || !result.data) {
    return false;
  }

  try {
    // 创建下载链接
    const url = window.URL.createObjectURL(result.data);
    const link = document.createElement("a");
    link.href = url;

    // 尝试从响应头获取文件名，如果没有则使用默认名称
    let fileName = defaultFileName;
    if (result.headers && result.headers["content-disposition"]) {
      const disposition = result.headers["content-disposition"];
      const matches = disposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (matches && matches[1]) {
        fileName = matches[1].replace(/['"]/g, "");
      }
    }

    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("文件下载处理失败:", error);
    return false;
  }
}

/**
 * 通用文件下载函数
 * @param downloadService - 下载服务函数
 * @param params - 下载参数
 * @param fileName - 文件名
 * @param messageService - 消息服务
 * @returns Promise<void>
 */
export async function downloadFile<T = Record<string, unknown>>(
  downloadService: DownloadServiceFunction<T>,
  params: T,
  fileName: string,
  messageService: MessageService
): Promise<void> {
  try {
    messageService.loading(`正在准备下载: ${fileName}`, 0);

    const result = await downloadService(params);

    // 关闭loading消息
    messageService.destroy();

    if (handleFileDownload(result, `${fileName}.pdf`)) {
      messageService.success(`下载成功: ${fileName}`);
    } else {
      messageService.error("下载失败，请重试");
    }
  } catch (error) {
    // 关闭loading消息
    messageService.destroy();
    console.error("下载失败:", error);
    messageService.error("下载失败，请检查网络连接后重试");
  }
}
