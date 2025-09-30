// 使用 $input.all() 获取所有输入数据项
const allInputItems = $input.all();
 
let mergedResult = {}; // 声明一个用于存储合并结果的空对象
 
// 遍历所有输入项，将它们的 JSON 数据合并到 mergedResult 中
for (let i = 0; i < allInputItems.length; i++) {
  try {
    // 确保当前项的 json 数据存在且是对象
    if (allInputItems[i].json) {
      // 使用扩展运算符 (...) 将当前项的 JSON 数据合并到 mergedResult 中
      // 注意：如果不同输入项有相同的键名，后面的会覆盖前面的
      mergedResult = {
        ...mergedResult, // 现有结果
        ...allInputItems[i].json // 当前项的数据
      };
    }
  } catch (error) {
    console.log(`Error processing input item ${i}:`, error.message);
    // 根据需要处理错误，例如跳过此项或记录错误信息
  }
}
return [{
  json: mergedResult
}]