const fs = require("fs");
const path = require("path");

// 读取文件内容
function processFile(filePath) {
  console.log(`处理文件: ${filePath}`);

  let content = fs.readFileSync(filePath, "utf8");
  let originalContent = content;

  // 处理 "国家金融监督管理总局" 的情况
  content = content.replace(
    /(\s+)websiteName: "国家金融监督管理总局",(\n)/g,
    '$1websiteName: "国家金融监督管理总局",$2$1legalSource: "国家金融监督管理总局",$2'
  );

  // 处理 "中国证监会" 的情况
  content = content.replace(
    /(\s+)websiteName: "中国证监会",(\n)/g,
    '$1websiteName: "中国证监会",$2$1legalSource: "证监会公告",$2'
  );

  // 处理 "不在..." 开头的情况
  content = content.replace(
    /(\s+)websiteName: "不在[^"]*",(\n)/g,
    '$1websiteName: "不在国家金融监督管理总局",$2$1legalSource: "其他机构",$2'
  );

  // 处理空字符串的情况
  content = content.replace(
    /(\s+)websiteName: "",(\n)/g,
    '$1websiteName: "",$2$1legalSource: "其他机构",$2'
  );

  // 检查是否有变化
  if (content !== originalContent) {
    // 写回文件
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`文件处理完成: ${filePath}`);
  } else {
    console.log(`文件无需处理: ${filePath}`);
  }
}

// 处理 mock 文件
const mockFiles = ["mock/index.js", "mock/updates.js"];

mockFiles.forEach((file) => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    processFile(fullPath);
  } else {
    console.log(`文件不存在: ${fullPath}`);
  }
});

console.log("所有文件处理完成！");
