export function formatDate(date, fmt) {
  if (
    typeof date === "string" ||
    typeof date === "number" ||
    date._isAMomentObject
  ) {
    date = new Date(date);
  }
  if (!date) {
    date = new Date();
  }
  const o = {
    "M+": date.getMonth() + 1, // 月份
    "d+": date.getDate(), // 日
    "h+": date.getHours(), // 小时
    "m+": date.getMinutes(), // 分
    "s+": date.getSeconds(), // 秒
    "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds(), // 毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  for (const k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
  return fmt;
}
export function getTimeRange(moment) {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  let starty = y;
  let startm = m;
  let endy = y;
  let endm = m + 2;

  if (!startm) {
    starty = y - 1;
    startm = 12;
  }
  if (endm > 12) {
    endy = y + 1;
    endm = endm - 12;
  }

  const start = moment(new Date(starty, startm - 1, 1)).format("YYYY-MM-DD");
  const end = moment(new Date(endy, endm, 0)).format("YYYY-MM-DD");
  return [start, end];
}
export function isToday(datetime) {
  const d = new Date(datetime).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  return !(d - today);
}

export function dateTranstor(d) {
  if (typeof d === "string") {
    return d.replace(/年|月|日/g, (v) => {
      if (v === "日") return "";
      return "-";
    });
  }
  return d;
}
