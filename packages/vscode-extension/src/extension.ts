import * as vscode from "vscode";
import { RSCAnalyzer } from "./analyzer";
import { RSCDecorationProvider } from "./decorationProvider";
import { RSCHoverProvider } from "./hoverProvider";

let analyzer: RSCAnalyzer;
let decorationProvider: RSCDecorationProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log("RSC Boundary Marker is now active");

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
  analyzer = new RSCAnalyzer(workspaceRoot);
  decorationProvider = new RSCDecorationProvider();

  // Register hover provider
  const hoverProvider = new RSCHoverProvider(analyzer);
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      [
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "typescriptreact" },
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "javascriptreact" },
      ],
      hoverProvider
    )
  );

  // Update decorations when active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (editor) {
        await updateDecorations(editor);
      }
    })
  );

  // Update decorations when document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) {
        analyzer.invalidateFile(event.document.uri.fsPath);
        await updateDecorations(editor);
      }
    })
  );

  // Update decorations on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      analyzer.invalidateFile(document.uri.fsPath);
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === document) {
        await updateDecorations(editor);
      }
    })
  );

  // Initial decoration for current editor
  if (vscode.window.activeTextEditor) {
    updateDecorations(vscode.window.activeTextEditor);
  }

  // Analyze workspace on startup
  if (workspaceRoot) {
    analyzer.analyzeWorkspace(workspaceRoot).then(() => {
      if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
      }
    });
  }

  // Add command to refresh analysis
  context.subscriptions.push(
    vscode.commands.registerCommand("rscBoundaryMarker.refresh", async () => {
      analyzer.clearCache();
      if (workspaceRoot) {
        await analyzer.analyzeWorkspace(workspaceRoot);
      }
      if (vscode.window.activeTextEditor) {
        await updateDecorations(vscode.window.activeTextEditor);
      }
      vscode.window.showInformationMessage("RSC Boundary Marker: Analysis refreshed");
    })
  );

  context.subscriptions.push(decorationProvider);
}

async function updateDecorations(editor: vscode.TextEditor) {
  const document = editor.document;

  // Only process React/TypeScript files
  if (!isReactFile(document)) {
    decorationProvider.clearDecorations(editor);
    return;
  }

  const info = await analyzer.analyzeFile(document.uri.fsPath);
  decorationProvider.updateDecorations(editor, info);
}

function isReactFile(document: vscode.TextDocument): boolean {
  const validLanguages = [
    "typescript",
    "typescriptreact",
    "javascript",
    "javascriptreact",
  ];
  return validLanguages.includes(document.languageId);
}

export function deactivate() {
  if (decorationProvider) {
    decorationProvider.dispose();
  }
}
