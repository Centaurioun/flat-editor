import * as vscode from 'vscode'
import { parse, stringify } from 'yaml'
import { getNonce } from './lib'
import type { FlatState } from './types'

export class FlatConfigEditor implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new FlatConfigEditor(context)
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      FlatConfigEditor.viewType,
      provider
    )
    return providerRegistration
  }

  private static readonly viewType = 'flat.config'

  constructor(private readonly context: vscode.ExtensionContext) {}

  // Called when our custom editor is opened.
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const updateWebview = async () => {
      webviewPanel.webview.html = await this.getHtmlForWebview(
        webviewPanel.webview
      )
    }

    const changeDocumentSubscription = vscode.workspace.onDidSaveTextDocument(
      e => {
        if (e.uri.toString() === document.uri.toString()) {
          updateWebview()
        }
      }
    )

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose()
    })

    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    }

    webviewPanel.webview.html = await this.getHtmlForWebview(
      webviewPanel.webview
    )

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage(async e => {
      switch (e.type) {
        case 'updateText':
          this.updateTextDocument(document, e.data)
          break
        default:
          break
      }
    })
  }

  /**
   * Get the static html used for the editor webviews.
   */
  private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'out/webviews/index.js')
    )

    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'out/webviews/index.css')
    )

    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        'node_modules',
        'vscode-codicons',
        'dist',
        'codicon.css'
      )
    )
    const codiconsFontUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        'node_modules',
        'vscode-codicons',
        'dist',
        'codicon.ttf'
      )
    )

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce()

    const workspaceRootUri = vscode.workspace.workspaceFolders?.[0].uri
    if (!workspaceRootUri) {
      throw new Error('No workspace open')
    }

    const flatFileUri = vscode.Uri.joinPath(workspaceRootUri, 'flat.yml')
    const document = await vscode.workspace.openTextDocument(flatFileUri)
    const rawFlatYaml = document.getText()
    const parsedConfig = parse(rawFlatYaml)
    const stringifiedConfig = encodeURIComponent(JSON.stringify(parsedConfig))

    return /* html */ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} 'self' data:; style-src ${webview.cspSource} ${codiconsUri}; script-src 'nonce-${nonce}'; font-src ${codiconsFontUri};">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">


				<link href="${styleVSCodeUri}" rel="stylesheet" />
        <link href="${codiconsUri}" rel="stylesheet" />
        <script nonce="${nonce}">
          window.acquireVsCodeApi = acquireVsCodeApi;
        </script>

				<title>Flat Editor</title>
			</head>
			<body>
				<div data-config="${stringifiedConfig}" id="root"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`
  }

  /**
   * Write out the yaml to a given document.
   */
  private updateTextDocument(document: vscode.TextDocument, data: any) {
    // todo
    const edit = new vscode.WorkspaceEdit()
    const currentText = document.getText()
    const newText = this.serializeWorkflow(data)
    if (currentText === newText) return

    // Replaces the entire document every time
    // TODO, maybe: more specific edits
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      newText
    )

    return vscode.workspace.applyEdit(edit)
  }

  private serializeWorkflow(data: FlatState): string {
    // const doc: FlatYamlDoc = {
    //   name: 'Flat',
    //   on: {
    //     workflow_dispatch: null,
    //   },
    //   jobs: {},
    // }
    // if (data.triggerPush) {
    //   doc.on.push = null
    // }
    // if (data.triggerSchedule) {
    //   doc.on.schedule = [
    //     {
    //       cron: data.triggerSchedule,
    //     },
    //   ]
    // }

    // data.jobs.forEach(j => {
    //   doc.jobs[j.name] = {
    //     'runs-on': 'ubuntu-latest',
    //     steps: [
    //       {
    //         name: 'Checkout repo',
    //         uses: 'actions/checkout@v2',
    //       },
    //       ...j.job.steps,
    //     ],
    //   }
    // })
    const serialized = stringify(data)
    return serialized
  }
}
