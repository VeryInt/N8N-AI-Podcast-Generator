function run(inputString) {
    // 假设 AI 生成的 JSON 字符串位于第一个输入项的 'jsonString' 字段中。
    // 请根据你的 n8n 工作流实际配置调整此路径。
    // const inputString = items[0].json.aiOutputString; // 示例：假设AI输出的字符串在 items[0].json.aiOutputString
  
    if (!inputString || typeof inputString !== 'string') {
      throw new Error("Input string is missing or not a string.");
    }
  
    let parsedData;
    let repairedString = inputString;
  
    try {
      // 尝试直接解析。如果字符串是规范的 JSON (如 output_one)，则直接成功。
      parsedData = JSON.parse(repairedString);
      console.log("Successfully parsed JSON directly.");
    } catch (initialError) {
      console.log("Initial JSON.parse failed. Attempting repairs...", initialError.message);
  
      // --- 修复策略 ---
  
      // 1. 修复未转义的换行符：将所有字面量换行符 `\n` 替换为 JSON 规范的转义换行符 `\\n`。
      // 这是 `output_two` 中最主要的解析错误原因。
      repairedString = repairedString.replace(/\n/g, '\\n');
      console.log("Applied repair 1: Replaced literal newlines with escaped newlines.");
  
      // 2. 修复 `output_two` 中特定的结构性错误：`",\"\n` 模式。
      // 在 `output_two` 中，`content` 字段的结束符 `",` 后跟着一个多余的 `"`，
      // 然后才是 `\n` (现在已转义为 `\\n`) 和 `theme` 字段。
      // 示例：`...realtime)\",\"\ntheme\":\"开发工具\",...`
      // 经过修复1后变为：`...realtime)\",\"\\ntheme\":\"开发工具\",...`
      // 我们需要将 `",` 后面的 `\"\\n` 部分替换为 `,`，以形成正确的 `","theme":` 结构。
      repairedString = repairedString.replace(/",\\"\\n/g, '","');
      console.log("Applied repair 2: Fixed malformed field separator `\",\\n`.");
  
      // 3. 修复可能存在的其他常见问题（可选，根据实际AI输出可能需要）
      //    例如：AI有时可能在JSON字符串中输出未转义的单引号，或者其他特殊字符。
      //    这里暂时不添加，以保持代码精简和针对性。
  
      try {
        // 尝试用修复后的字符串再次解析
        parsedData = JSON.parse(repairedString);
        console.log("Successfully parsed JSON after repairs.");
      } catch (repairError) {
        console.log("Failed to parse JSON even after repair attempts.");
        console.log("Original parsing error:", initialError.message);
        console.log("Repair attempt error:", repairError.message);
        console.log("String after repairs:", repairedString);
        // 如果修复后仍然失败，抛出错误，以便 n8n 工作流能够捕获并处理。
        throw new Error(`Failed to parse JSON after repair attempts: ${repairError.message}`);
      }
    }
  
    // n8n 的 "Code" 节点通常期望返回一个包含对象的数组。
    // 如果你的 JSON 字符串本身就是一个数组（如本例），可以直接返回它。
    // 如果是一个对象，则返回 [parsedData]
    return {output: JSON.stringify(parsedData)}
  }
  
  
  return run($json.output)