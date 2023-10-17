import * as vscode from 'vscode'

// MemoryRecord Tree View related logic
export class MemoryRecordItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None)
    this.tooltip = `${this.label}: ${this.description}`
    this.contextValue = 'memoryRecordItem'
  }
}

export class MemoryRecordProvider
  implements vscode.TreeDataProvider<MemoryRecordItem>
{
  private memoryRecord: { [word: string]: { correct: number; wrong: number } }
  private _onDidChangeTreeData: vscode.EventEmitter<
    MemoryRecordItem | undefined | void
  > = new vscode.EventEmitter<MemoryRecordItem | undefined | void>()
  readonly onDidChangeTreeData: vscode.Event<
    MemoryRecordItem | undefined | void
  > = this._onDidChangeTreeData.event

  constructor(memoryRecord: {
    [word: string]: { correct: number; wrong: number }
  }) {
    this.memoryRecord = memoryRecord
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: MemoryRecordItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: MemoryRecordItem): Thenable<MemoryRecordItem[]> {
    if (!element) {
      return Promise.resolve(
        Object.keys(this.memoryRecord).map((key) => {
          const record = this.memoryRecord[key]
          const description = `Correct: ${record.correct}, Wrong: ${record.wrong}`
          return new MemoryRecordItem(key, description)
        })
      )
    }
    return Promise.resolve([])
  }
}
