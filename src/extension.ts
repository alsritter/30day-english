import * as vscode from 'vscode'
import * as fs from 'fs'

import { MemoryRecordProvider } from './memory-record'

let isCheckingEnabled = false
let statusBar: vscode.StatusBarItem
let currentWord: string
const specialWordMappings: { [key: string]: string } = {}
const wordSamples: { [key: string]: [string, string] } = {}
const memoryRecord: {
  [date: string]: {
    [word: string]: {
      correct: number
      wrong: number
    }
  }
} = {}

export function activate(context: vscode.ExtensionContext) {
  initializeStatusBarItems(context)
  initializeToggleCheckItem(context)

  // 从 globalState 加载 memoryRecord
  loadMemoryRecord(context)

  const memoryRecordProvider = new MemoryRecordProvider(memoryRecord)

  // Initialize the tree view
  vscode.window.createTreeView('memory-record-view', {
    treeDataProvider: memoryRecordProvider
  })

  // Listen for changes to the text document and trigger checks
  vscode.workspace.onDidChangeTextDocument((event) =>
    handleDocumentChange(event, memoryRecordProvider, context)
  )

  // Load the word samples upon activation
  loadWordSamples(context)
}

// Initialize and display the status bar items
function initializeStatusBarItems(context: vscode.ExtensionContext) {
  statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  )
  statusBar.command = '30dayEnglish.loadWordSamples'
  statusBar.text = '加载词汇文件'
  statusBar.show()
  return statusBar
}

// Load word samples
function loadWordSamples(context: vscode.ExtensionContext) {
  const defaultFilePath = vscode.Uri.file(
    context.extensionPath + '/defaultWords.json'
  ).fsPath

  // 获取文件路径从 VS Code 配置
  const filePath =
    (vscode.workspace
      .getConfiguration('30day-english')
      .get('wordSamplesPath') as string) || defaultFilePath

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const rawWordSamples = JSON.parse(fileContent)

    // 处理特殊的单词组，例如 "Child/Children"
    for (const key in rawWordSamples) {
      // 如果键中包含 "/"，则分割它并为每个部分都添加一个词汇条目
      if (key.includes('/')) {
        const parts = key.split('/')
        for (const part of parts) {
          wordSamples[cleanString(part)] = rawWordSamples[key]
        }
      } else {
        wordSamples[cleanString(key)] = rawWordSamples[key]
      }
    }

    // 显示第一个单词的中文提示
    const firstKey = Object.keys(wordSamples)[0]
    statusBar.text = wordSamples[firstKey][1] // 中文提示
    currentWord = firstKey
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(`Error reading file: ${error.message}`)
    } else {
      vscode.window.showErrorMessage(`Unknown error reading file: ${error}`)
    }
  }
}

function initializeToggleCheckItem(
  context: vscode.ExtensionContext
): vscode.StatusBarItem {
  function updateToggleText(toggleCheckItem: vscode.StatusBarItem) {
    toggleCheckItem.text = isCheckingEnabled ? '检查开启' : '检查关闭'
  }

  const toggleCheckItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    99
  )
  toggleCheckItem.command = '30dayEnglish.toggleCheck'
  updateToggleText(toggleCheckItem)
  toggleCheckItem.show()

  context.subscriptions.push(
    vscode.commands.registerCommand('30dayEnglish.toggleCheck', () => {
      isCheckingEnabled = !isCheckingEnabled
      updateToggleText(toggleCheckItem)
    })
  )

  return toggleCheckItem
}

// 从 globalState 加载 memoryRecord
function loadMemoryRecord(context: vscode.ExtensionContext) {
  const storedMemoryRecord = context.globalState.get<{
    [date: string]: {
      [word: string]: {
        correct: number
        wrong: number
      }
    }
  }>('memoryRecord')

  if (storedMemoryRecord) {
    for (const date in storedMemoryRecord) {
      if (!memoryRecord[date]) {
        memoryRecord[date] = {}
      }
      for (const word in storedMemoryRecord[date]) {
        memoryRecord[date][word] = storedMemoryRecord[date][word]
      }
    }
  }
}

// 保存 memoryRecord 到 globalState
function saveMemoryRecord(context: vscode.ExtensionContext) {
  context.globalState.update('memoryRecord', memoryRecord)
}

function checkLastLine(
  editor: vscode.TextEditor,
  event: vscode.TextDocumentChangeEvent,
  memoryRecordProvider: MemoryRecordProvider,
  context: vscode.ExtensionContext
) {
  function getNextKey(currentKey: string): string | undefined {
    const keys = Object.keys(wordSamples)
    const currentIndex = keys.indexOf(currentKey)
    if (currentIndex !== -1 && currentIndex + 1 < keys.length) {
      return keys[currentIndex + 1]
    }
    return undefined
  }

  // 只在敲回车时进行检查
  if (
    event.contentChanges.length === 1 &&
    event.contentChanges[0].text === '\n'
  ) {
    if (!isCheckingEnabled) return // 如果检查未启用，则直接返回

    const lastLine = editor.document.lineAt(editor.document.lineCount - 2) // 由于是敲击回车后的事件，所以应该检查前一行
    const word = cleanString(lastLine.text.trim())

    memoryRecordProvider.refresh()

    // 检查清洗后的单词是否在 wordSamples 中
    const matchKey = Object.keys(wordSamples).find(
      (key) => cleanString(key) === word
    )

    if (!memoryRecord[getDate()]) {
      memoryRecord[getDate()] = {}
    }

    if (!memoryRecord[getDate()][currentWord]) {
      memoryRecord[getDate()][currentWord] = { correct: 0, wrong: 0 }
    }

    if (matchKey) {
      vscode.window.showInformationMessage(
        `Correct! ${wordSamples[matchKey][0]}`
      )

      memoryRecord[getDate()][currentWord].correct =
        (memoryRecord[getDate()][currentWord].correct || 0) + 1

      // Update the status bar with the next word's Chinese hint
      const nextKey = getNextKey(matchKey)
      if (nextKey) {
        statusBar.text = wordSamples[nextKey][1]
        currentWord = nextKey
      } else {
        statusBar.text = 'Well done!'
      }

      // 保存 memoryRecord
      saveMemoryRecord(context)
    } else {
      vscode.window.showErrorMessage(
        `Incorrect! ${wordSamples[currentWord][0]}`
      )
      memoryRecord[getDate()][currentWord].wrong =
        (memoryRecord[getDate()][currentWord].wrong || 0) + 1

      // 保存 memoryRecord
      saveMemoryRecord(context)
    }

    // 删除最后一行
    editor.edit((builder) => {
      const range = new vscode.Range(
        new vscode.Position(editor.document.lineCount - 2, 0),
        new vscode.Position(editor.document.lineCount - 1, 0)
      )
      builder.delete(range)
    })
  }
}

function cleanString(str: string): string {
  let cleaned = str.replace(/[ ;]/g, '').toLowerCase() // 移除空格、分号并转换为小写
  return specialWordMappings[cleaned] || cleaned
}

function getDate(): string {
  const today = new Date().toISOString().split('T')[0] // 获取 YYYY-MM-DD 格式的日期
  return today
}

function handleDocumentChange(
  event: vscode.TextDocumentChangeEvent,
  memoryRecordProvider: MemoryRecordProvider,
  context: vscode.ExtensionContext
) {
  if (event.document.isDirty && !event.document.isUntitled) {
    const editor = vscode.window.activeTextEditor
    if (editor) {
      checkLastLine(editor, event, memoryRecordProvider, context)
    }
  }
}

export function deactivate() {}
