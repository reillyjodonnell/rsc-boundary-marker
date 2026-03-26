import * as vscode from "vscode";
import { RSCAnalyzer, ComponentInfo } from "./analyzer";

export class RSCDecorationProvider {
  private serverDecorationType: vscode.TextEditorDecorationType;
  private clientDecorationType: vscode.TextEditorDecorationType;
  private clientInheritedDecorationType: vscode.TextEditorDecorationType;

  constructor() {
    this.serverDecorationType = vscode.window.createTextEditorDecorationType({
      before: {
        contentText: "Server",
        backgroundColor: "#A7E8BD",
        color: "#1a1a1a",
        fontWeight: "bold",
        margin: "0 8px 0 0",
        padding: "2px 6px",
        borderRadius: "4px",
      },
    });

    this.clientDecorationType = vscode.window.createTextEditorDecorationType({
      before: {
        contentText: "Client",
        backgroundColor: "#E5D1D0",
        color: "#1a1a1a",
        fontWeight: "bold",
        margin: "0 8px 0 0",
        padding: "2px 6px",
        borderRadius: "4px",
      },
    });

    this.clientInheritedDecorationType = vscode.window.createTextEditorDecorationType({
      before: {
        contentText: "Client (inherited)",
        backgroundColor: "#E5D1D0",
        color: "#1a1a1a",
        fontWeight: "bold",
        margin: "0 8px 0 0",
        padding: "2px 6px",
        borderRadius: "4px",
      },
    });
  }

  updateDecorations(editor: vscode.TextEditor, info: ComponentInfo | null) {
    if (!info) {
      this.clearDecorations(editor);
      return;
    }

    const document = editor.document;
    const text = document.getText();

    // Find the first component declaration line
    const componentLine = this.findComponentDeclarationLine(text);
    if (componentLine === -1) {
      this.clearDecorations(editor);
      return;
    }

    const range = new vscode.Range(
      new vscode.Position(componentLine, 0),
      new vscode.Position(componentLine, 0)
    );

    // Clear all decorations first
    this.clearDecorations(editor);

    // Apply the appropriate decoration
    if (info.type === "server") {
      editor.setDecorations(this.serverDecorationType, [{ range }]);
    } else if (info.hasUseClientDirective) {
      editor.setDecorations(this.clientDecorationType, [{ range }]);
    } else {
      // Client by inheritance
      editor.setDecorations(this.clientInheritedDecorationType, [{ range }]);
    }
  }

  private findComponentDeclarationLine(text: string): number {
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip "use client" directive
      if (trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'")) {
        continue;
      }

      // Look for export default function/const
      if (
        trimmed.startsWith("export default function") ||
        trimmed.startsWith("export default class") ||
        trimmed.match(/^export\s+default\s+/) ||
        trimmed.match(/^export\s+function\s+/) ||
        trimmed.match(/^function\s+\w+.*\{?\s*$/) ||
        trimmed.match(/^const\s+\w+.*=.*\(/) ||
        trimmed.match(/^export\s+const\s+\w+/)
      ) {
        return i;
      }
    }

    return -1;
  }

  clearDecorations(editor: vscode.TextEditor) {
    editor.setDecorations(this.serverDecorationType, []);
    editor.setDecorations(this.clientDecorationType, []);
    editor.setDecorations(this.clientInheritedDecorationType, []);
  }

  dispose() {
    this.serverDecorationType.dispose();
    this.clientDecorationType.dispose();
    this.clientInheritedDecorationType.dispose();
  }
}
