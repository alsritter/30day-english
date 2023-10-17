import * as vscode from 'vscode'

export class MemoryRecordDateItem extends vscode.TreeItem {
  constructor(
    public readonly date: string,
    public readonly wordItems: MemoryRecordItem[]
  ) {
    super(date, vscode.TreeItemCollapsibleState.Collapsed)
    this.contextValue = 'memoryRecordDateItem'
  }
}

export class MemoryRecordItem extends vscode.TreeItem {
  constructor(
    public readonly word: string,
    public readonly correct: number,
    public readonly wrong: number
  ) {
    super(word, vscode.TreeItemCollapsibleState.None)
    this.description = `Correct: ${this.correct}, Wrong: ${this.wrong}`
    this.tooltip = `${this.word}: ${this.description}`
    this.contextValue = 'memoryRecordItem'
  }
}

export class MemoryRecordProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private memoryRecord: {
    [date: string]: {
      [word: string]: {
        correct: number
        wrong: number
      }
    }
  }
  private _onDidChangeTreeData: vscode.EventEmitter<
    MemoryRecordItem | undefined | void
  > = new vscode.EventEmitter<MemoryRecordItem | undefined | void>()
  readonly onDidChangeTreeData: vscode.Event<
    MemoryRecordItem | undefined | void
  > = this._onDidChangeTreeData.event

  constructor(memoryRecord: {
    [date: string]: {
      [word: string]: {
        correct: number
        wrong: number
      }
    }
  }) {
    this.memoryRecord = memoryRecord
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (element) {
      if (element.contextValue === 'memoryRecordDateItem') {
        return Promise.resolve((element as MemoryRecordDateItem).wordItems)
      }
    } else {
      return Promise.resolve(
        Object.keys(this.memoryRecord).map((date) => {
          const wordItems = Object.keys(this.memoryRecord[date]).map((word) => {
            const record = this.memoryRecord[date][word]
            return new MemoryRecordItem(word, record.correct, record.wrong)
          })
          return new MemoryRecordDateItem(date, wordItems)
        })
      )
    }
    return Promise.resolve([])
  }
}
