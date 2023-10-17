# 30day-English Challenge
一个用于 Visual Studio Code 的插件，帮助您练习并记忆常用英语词汇。

## 功能
1. **动态状态栏**：显示当前要记忆的单词的中文提示。
2. **单词检查**：在文档中输入单词后，插件会自动检查您的答案，并更新记忆记录。
3. **记忆记录视图**：查看您已经练习过的单词和对应的正确/错误次数。

## 安装
1. 打开 Visual Studio Code。
2. 转到 Extensions。
3. 搜索 ["30day-English Challenge"](https://marketplace.visualstudio.com/items?itemName=alsritter.30day-english) 并安装。

## 使用方法
1. 在 VS Code 中打开任意文档。
2. 输入 `ctrl + shift + p` 搜索 `30 Day English: Toggle Spelling Check` 启动服务。
3. 在文档最后一行中输入对应的英语单词并按 `Enter`，它会把最后一行删掉，并判断输入是否正确。
4. 插件会自动检查您的答案，并更新状态栏中的中文提示。

## 配置

如果您想使用自己的单词列表，可以在 VS Code 设置中修改 `30day-english.wordSamplesPath` 配置项，指向您的 JSON 单词文件。

默认单词文件格式如下：

```json
{
  "Relative": ["Is she a distant relative of yours?", "亲戚"],
  "Parent": ["Every parent wants the best for their child.", "家长"],
  "Child/Children": ["They have three children.", "孩子"],
  "Mother": ["My mother called me yesterday.", "母亲"],
  "Father": ["He is a loving father to his kids.", "父亲"],
}
```

## 贡献

欢迎任何形式的贡献！请通过 GitHub 提交您的建议或问题。

## 许可

此插件在 MIT 许可下发布。
