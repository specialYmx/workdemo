import { v4 as uuidv4 } from "uuid";
import marked from "marked";
import { ChatListType } from "~/model/chatModel";
export function getFetchFormat(
  item: string,
  tempTxt: string,
  chatList: ChatListType[]
): { tempTxt: string; newChatList: ChatListType[] } {
  try {
    if (typeof item === "string" && item.trim()) {
      const formatItem = item
        .replace(/End\s*$/, "")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      const data = JSON.parse(formatItem);
      tempTxt += data.content;
    }
    const newChatList = [
      ...chatList.slice(0, -1), // 保留之前的消息
      ...chatList.slice(-1).map((_item) => ({
        id: uuidv4().replace(/-/g, ""),
        isSelf: false,
        relatedDocs: "",
        isLoading: false,
        label: marked(tempTxt),
      })),
    ];
    return { newChatList, tempTxt };
  } catch (error) {
    console.error("Error fetching data:", error);
    const newChatList = [
      ...chatList.slice(0, -1), // 保留之前的消息
      ...chatList.slice(-1).map((_item) => ({
        id: uuidv4().replace(/-/g, ""),
        isSelf: false,
        relatedDocs: "",
        isLoading: false,
        label: "解析错误，请联系管理员",
      })),
    ];
    return { newChatList, tempTxt };
  }
}
