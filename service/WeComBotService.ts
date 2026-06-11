import { AxiosInstance } from 'axios';
import api from '~/api/index';
import type {
  SaveWeComBotGroupChatParams,
  SaveWeComBotGroupChatRobotParams,
  SaveWeComBotRobotParams,
  WeComBotApiResponse,
  WeComBotBaseQuery,
  WeComBotChatLog,
  WeComBotChatLogQuery,
  WeComBotDownloadResponse,
  WeComBotGroupChat,
  WeComBotGroupChatQuery,
  WeComBotGroupChatRobot,
  WeComBotGroupChatRobotQuery,
  WeComBotListResult,
  WeComBotOperationResponse,
  WeComBotPageData,
  WeComBotRobot,
  WeComBotRobotQuery,
  WeComBotService
} from '~/model/RoadWeComBot';

const WE_COM_BOT_BASE_URL = 'http://10.14.10.88:2025';

// 将页码、页大小转成合法正数，不合法时使用默认值，避免 NaN、0、null 影响分页。
const normalizePageValue = (value: unknown, fallback: number): number => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
};

// 列表接口失败时返回统一的空分页结构，组件侧不用额外判断 data 是否存在。
const emptyListResult = <T>(
  message = '',
  status = 500,
  current = 1,
  size = 10
): WeComBotListResult<T> => ({
  success: false,
  message,
  status,
  timestamp: Date.now(),
  data: {
    records: [],
    total: 0,
    current,
    size,
    pages: 0
  }
});

// 按后端分页结构整理成组件使用的数据，失败时返回统一空结构。
const normalizeListResult = <T>(
  response: WeComBotApiResponse<WeComBotPageData<T> | T[]>,
  params: WeComBotBaseQuery = {}
): WeComBotListResult<T> => {
  const current = normalizePageValue(params.pageNum, 1);
  const size = normalizePageValue(params.pageSize, 10);

  if (!response || response.success !== true || response.status !== 200) {
    return {
      ...emptyListResult<T>(
        response?.message || '加载数据失败',
        response?.status || 500,
        current,
        size
      )
    };
  }

  const payload = response.data;

  if (Array.isArray(payload)) {
    return {
      success: true,
      message: response.message || 'SUCCESS',
      status: response.status,
      timestamp: response.timestamp,
      data: {
        records: payload,
        total: payload.length,
        current,
        size,
        pages: payload.length > 0 ? Math.ceil(payload.length / size) : 0
      }
    };
  }

  return {
    success: true,
    message: response.message || 'SUCCESS',
    status: response.status,
    timestamp: response.timestamp,
    data: {
      records: payload.records,
      total: payload.total,
      current: normalizePageValue(payload.current, current),
      size: normalizePageValue(payload.size, size),
      pages: payload.pages
    }
  };
};

// 保存、删除等操作接口统一归一化，只有 success 为 true 且 status 为 200 才视为成功。
const normalizeOperationResponse = (
  response: WeComBotApiResponse<unknown> | null | undefined,
  fallbackMessage: string
): WeComBotOperationResponse => ({
  status: response?.status || 500,
  message: response?.message || fallbackMessage,
  success: response?.success === true && response?.status === 200,
  timestamp: response?.timestamp || Date.now(),
  data: response?.data
});

export default ($axios: AxiosInstance): WeComBotService => {
  const postJson = async <T>(url: string, data: unknown = {}): Promise<WeComBotApiResponse<T>> => {
    const response = await $axios.post<WeComBotApiResponse<T>>(url, data || {}, {
      baseURL: WE_COM_BOT_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  };

  const deleteById = async (url: string, id: string): Promise<WeComBotOperationResponse> => {
    try {
      const response = await $axios.post<WeComBotApiResponse<unknown>>(url, null, {
        baseURL: WE_COM_BOT_BASE_URL,
        params: { id }
      });
      return normalizeOperationResponse(response.data, '删除失败');
    } catch (error) {
      console.error('WeCom bot delete failed:', error);
      return normalizeOperationResponse(null, '删除失败');
    }
  };

  return {
    async getGroupChat(params: WeComBotGroupChatQuery = {}) {
      try {
        const response = await postJson<WeComBotPageData<WeComBotGroupChat>>(
          api.road.getGroupChat,
          params
        );
        return normalizeListResult<WeComBotGroupChat>(response, params);
      } catch (error) {
        console.error('Error fetching group chat list:', error);
        return emptyListResult<WeComBotGroupChat>('加载群聊列表失败');
      }
    },

    async saveGroupChat(params: SaveWeComBotGroupChatParams) {
      try {
        const response = await postJson<unknown>(api.road.saveGroupChat, params);
        return normalizeOperationResponse(response, '保存群聊失败');
      } catch (error) {
        console.error('Error saving group chat:', error);
        return normalizeOperationResponse(null, '保存群聊失败');
      }
    },

    getGroupChatOptions() {
      return this.getGroupChat({
        pageNum: 1,
        pageSize: 1000
      });
    },

    deleteGroupChat(id: string) {
      return deleteById(api.road.deleteGroupChat, id);
    },

    async getRobot(params: WeComBotRobotQuery = {}) {
      try {
        const response = await postJson<WeComBotPageData<WeComBotRobot>>(api.road.getRobot, params);
        return normalizeListResult<WeComBotRobot>(response, params);
      } catch (error) {
        console.error('Error fetching robot list:', error);
        return emptyListResult<WeComBotRobot>('加载机器人列表失败');
      }
    },

    async saveRobot(params: SaveWeComBotRobotParams) {
      try {
        const response = await postJson<unknown>(api.road.saveRobot, params);
        return normalizeOperationResponse(response, '保存机器人失败');
      } catch (error) {
        console.error('Error saving robot:', error);
        return normalizeOperationResponse(null, '保存机器人失败');
      }
    },

    getRobotOptions() {
      return this.getRobot({
        robotType: '',
        pageNum: 1,
        pageSize: 1000
      });
    },

    deleteRobot(id: string) {
      return deleteById(api.road.deleteRobot, id);
    },

    async getGroupChatRobot(params: WeComBotGroupChatRobotQuery = {}) {
      try {
        const response = await postJson<WeComBotPageData<WeComBotGroupChatRobot>>(
          api.road.getGroupChatRobot,
          params
        );
        return normalizeListResult<WeComBotGroupChatRobot>(response, params);
      } catch (error) {
        console.error('Error fetching group chat robot list:', error);
        return emptyListResult<WeComBotGroupChatRobot>('加载配置列表失败');
      }
    },

    async saveGroupChatRobot(params: SaveWeComBotGroupChatRobotParams) {
      try {
        const response = await postJson<unknown>(api.road.saveGroupChatRobot, params);
        return normalizeOperationResponse(response, '保存配置失败');
      } catch (error) {
        console.error('Error saving group chat robot:', error);
        return normalizeOperationResponse(null, '保存配置失败');
      }
    },

    deleteGroupChatRobot(id: string) {
      return deleteById(api.road.deleteGroupChatRobot, id);
    },

    async getChatLog(params: WeComBotChatLogQuery) {
      try {
        const response = await postJson<WeComBotPageData<WeComBotChatLog>>(
          api.road.getChatLog,
          params
        );
        return normalizeListResult<WeComBotChatLog>(response, params);
      } catch (error) {
        console.error('Error fetching chat log:', error);
        return emptyListResult<WeComBotChatLog>(
          '加载历史数据失败',
          500,
          params.pageNum,
          params.pageSize
        );
      }
    },

    async downloadAttachment(id: string): Promise<WeComBotDownloadResponse | null> {
      try {
        const response = await $axios.get(api.road.downloadAttachment, {
          baseURL: WE_COM_BOT_BASE_URL,
          params: { id },
          responseType: 'blob'
        });
        return {
          data: response.data,
          headers: response.headers
        };
      } catch (error) {
        console.error('Error downloading attachment:', error);
        return null;
      }
    }
  };
};
