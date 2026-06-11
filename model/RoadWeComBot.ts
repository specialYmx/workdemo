import type { ResponseHeaders } from './LawyerModel';

export interface WeComBotApiResponse<T = unknown> {
  status: number;
  message: string;
  data: T;
  success: boolean;
  timestamp: number;
}

export interface WeComBotPageData<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
  pages?: number;
}

export interface WeComBotListResult<T> {
  success: boolean;
  message: string;
  status: number;
  timestamp?: number;
  data: WeComBotPageData<T>;
}

export interface WeComBotOperationResponse {
  status: number;
  message: string;
  success: boolean;
  timestamp: number;
  data?: unknown;
}

export interface WeComBotDownloadResponse {
  data: Blob;
  headers: ResponseHeaders;
}

export interface WeComBotBaseQuery {
  pageNum?: number;
  pageSize?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface WeComBotGroupChat {
  id: string;
  groupChatName: string;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface WeComBotGroupChatQuery extends WeComBotBaseQuery {
  id?: string;
  groupChatName?: string;
}

export interface SaveWeComBotGroupChatParams {
  id: string;
  groupChatName: string;
  oldId?: string;
}

export interface WeComBotRobot {
  id: string;
  robotName: string;
  robotType: string;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface WeComBotRobotQuery extends WeComBotBaseQuery {
  id?: string;
  robotName?: string;
  robotType?: string;
}

export interface SaveWeComBotRobotParams {
  id: string;
  robotName: string;
  robotType: string;
  oldId?: string;
}

export interface WeComBotGroupChatRobot {
  id?: string;
  groupChatId: string;
  groupChatName: string;
  robotId: string;
  robotName: string;
  enable: boolean;
  createTime?: string;
  updateTime?: string;
  switchLoading?: boolean;
  [key: string]: unknown;
}

export interface WeComBotGroupChatRobotQuery extends WeComBotBaseQuery {
  id?: string;
  groupChatId?: string;
  groupChatName?: string;
  robotId?: string;
  robotName?: string;
  enable?: boolean;
}

export interface SaveWeComBotGroupChatRobotParams {
  id?: string;
  groupChatId: string;
  groupChatName: string;
  robotId: string;
  robotName: string;
  enable: boolean;
}

export interface WeComBotChatLog {
  id: string | number;
  msgId?: string;
  groupChatId?: string;
  groupChatName?: string | null;
  fromUserId?: string;
  fromUserName?: string | null;
  msgType?: string;
  content: string;
  quotedContent?: string | null;
  quotedMsgType?: string | null;
  streamId?: string;
  status?: number;
  priority?: number;
  retryCount?: number;
  maxRetry?: number;
  errorMessage?: string | null;
  metadata?: string | null;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  serverId?: string;
  aibotid?: string;
  chatType?: string;
  wecomBotTaskAttachment?: WeComBotTaskAttachment | null;
  wecomBotTaskResults?: WeComBotTaskResult[];
  [key: string]: unknown;
}

export interface WeComBotTaskAttachment {
  id: string | number;
  fileName: string;
  localPath: string;
}

export interface WeComBotTaskResult {
  id: string | number;
  resultContent: string;
  resultType: string;
  createdAt: string;
  errorMessage?: string | null;
}

export interface WeComBotChatLogQuery extends WeComBotBaseQuery {
  pageNum: number;
  pageSize: number;
  groupChatId?: string;
  startTime?: string;
  endTime?: string;
}

export interface WeComBotService {
  getGroupChat: (params?: WeComBotGroupChatQuery) => Promise<WeComBotListResult<WeComBotGroupChat>>;
  getGroupChatOptions: () => Promise<WeComBotListResult<WeComBotGroupChat>>;
  saveGroupChat: (params: SaveWeComBotGroupChatParams) => Promise<WeComBotOperationResponse>;
  deleteGroupChat: (id: string) => Promise<WeComBotOperationResponse>;
  getRobot: (params?: WeComBotRobotQuery) => Promise<WeComBotListResult<WeComBotRobot>>;
  getRobotOptions: () => Promise<WeComBotListResult<WeComBotRobot>>;
  saveRobot: (params: SaveWeComBotRobotParams) => Promise<WeComBotOperationResponse>;
  deleteRobot: (id: string) => Promise<WeComBotOperationResponse>;
  getGroupChatRobot: (
    params?: WeComBotGroupChatRobotQuery
  ) => Promise<WeComBotListResult<WeComBotGroupChatRobot>>;
  saveGroupChatRobot: (
    params: SaveWeComBotGroupChatRobotParams
  ) => Promise<WeComBotOperationResponse>;
  deleteGroupChatRobot: (id: string) => Promise<WeComBotOperationResponse>;
  getChatLog: (params: WeComBotChatLogQuery) => Promise<WeComBotListResult<WeComBotChatLog>>;
  downloadAttachment: (id: string) => Promise<WeComBotDownloadResponse | null>;
}
