// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as fs from 'fs'

let isCheckingEnabled = false

export function activate(context: vscode.ExtensionContext) {
  let wordSamples: { [key: string]: [string, string] } = {}
  let memoryRecord: { [word: string]: number } = {}

  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  )
  statusBar.command = 'extension.loadWordSamples'
  statusBar.text = '加载词汇文件'
  statusBar.show()

  // 检查开关
  const toggleCheckItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    99
  )
  toggleCheckItem.command = 'extension.toggleCheck'
  updateToggleText()
  toggleCheckItem.show()

  function updateToggleText() {
    toggleCheckItem.text = isCheckingEnabled ? '检查开启' : '检查关闭'
  }

  context.subscriptions.push(statusBar)
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.toggleCheck', () => {
      isCheckingEnabled = !isCheckingEnabled
      updateToggleText()
    })
  )

  const defaultFilePath = vscode.Uri.file(
    context.extensionPath + '/defaultWords.json'
  ).fsPath

  function loadWordSamples() {
    vscode.window
      .showInputBox({ prompt: 'Enter the path to the word samples file:' })
      .then((filePath) => {
        if (!filePath) {
          filePath = defaultFilePath
        }

        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          wordSamples = JSON.parse(fileContent)

          // 显示第一个单词的中文提示
          const firstKey = Object.keys(wordSamples)[0]
          statusBar.text = wordSamples[firstKey][1] // 中文提示
        } catch (error) {
          if (error instanceof Error) {
            vscode.window.showErrorMessage(
              `Error reading file: ${error.message}`
            )
          } else {
            vscode.window.showErrorMessage(
              `Unknown error reading file: ${error}`
            )
          }
        }
      })
  }

  function checkLastLine(editor: vscode.TextEditor) {
    if (!isCheckingEnabled) return // 如果检查未启用，则直接返回

    const lastLine = editor.document.lineAt(editor.document.lineCount - 1)
    const word = lastLine.text.trim()

    if (word) {
      if (word in wordSamples) {
        vscode.window.showInformationMessage(`Correct! ${wordSamples[word][0]}`)
        memoryRecord[word] = (memoryRecord[word] || 0) + 1

        // Update the status bar with the next word's Chinese hint
        const nextKey = getNextKey(word)
        if (nextKey) {
          statusBar.text = wordSamples[nextKey][1]
        } else {
          statusBar.text = 'Well done!'
        }
      } else {
        vscode.window.showErrorMessage(`Incorrect!`)
        memoryRecord[word] = (memoryRecord[word] || 0) - 1
      }

      // 删除最后一行
      editor.edit((builder) => {
        const range = new vscode.Range(
          new vscode.Position(editor.document.lineCount - 1, 0),
          new vscode.Position(editor.document.lineCount, 0)
        )
        builder.delete(range)
      })
    }
  }

  function getNextKey(currentKey: string): string | undefined {
    const keys = Object.keys(wordSamples)
    const currentIndex = keys.indexOf(currentKey)
    if (currentIndex !== -1 && currentIndex + 1 < keys.length) {
      return keys[currentIndex + 1]
    }
    return undefined
  }

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.isDirty && !event.document.isUntitled) {
      const editor = vscode.window.activeTextEditor
      if (editor) {
        checkLastLine(editor)
      }
    }
  })

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.loadWordSamples',
      loadWordSamples
    )
  )
}

export function deactivate() {}
