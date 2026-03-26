import * as vscode from "vscode";
import * as path from "path";
import { RSCAnalyzer, ComponentInfo, InheritanceNode } from "./analyzer";

export class RSCHoverProvider implements vscode.HoverProvider {
  constructor(private analyzer: RSCAnalyzer) {}

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    const info = await this.analyzer.analyzeFile(document.uri.fsPath);
    if (!info) return null;

    // Check if hovering near the top of file or on component declaration
    const line = document.lineAt(position.line);
    const text = line.text.trim();

    // Show hover on "use client" directive
    const isOnDirective = text.startsWith('"use client"') || text.startsWith("'use client'");

    // Show hover on component declarations
    const isOnComponent =
      text.startsWith("export default function") ||
      text.startsWith("export default class") ||
      text.match(/^export\s+default\s+/) ||
      text.match(/^export\s+function\s+/) ||
      text.match(/^function\s+\w+/) ||
      text.match(/^const\s+\w+.*=.*\(/);

    if (!isOnDirective && !isOnComponent) {
      return null;
    }

    const markdown = this.buildHoverContent(info);
    return new vscode.Hover(markdown);
  }

  private buildHoverContent(info: ComponentInfo): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.supportHtml = true;
    md.isTrusted = true;

    if (info.type === "server") {
      md.appendMarkdown(`### 🟢 Server Component\n\n`);
      md.appendMarkdown(`**${info.componentName}** is a React Server Component.\n\n`);
      md.appendMarkdown(`This component:\n`);
      md.appendMarkdown(`- Runs only on the server\n`);
      md.appendMarkdown(`- Can use \`async/await\` directly\n`);
      md.appendMarkdown(`- Cannot use React hooks or browser APIs\n`);
    } else if (info.hasUseClientDirective) {
      md.appendMarkdown(`### 🔵 Client Component\n\n`);
      md.appendMarkdown(`**${info.componentName}** is a Client Component.\n\n`);
      md.appendMarkdown(`Marked with \`"use client"\` directive.\n\n`);
      md.appendMarkdown(`This component:\n`);
      md.appendMarkdown(`- Runs in the browser\n`);
      md.appendMarkdown(`- Can use React hooks and browser APIs\n`);
      md.appendMarkdown(`- Creates a client boundary\n`);
    } else {
      md.appendMarkdown(`### 🟣 Client Component (inherited)\n\n`);
      md.appendMarkdown(`**${info.componentName}** is a Client Component by inheritance.\n\n`);

      if (info.inheritanceChain.length > 0) {
        md.appendMarkdown(`#### Inheritance Chain\n\n`);
        md.appendMarkdown(this.formatInheritanceChain(info.inheritanceChain));
      }

      md.appendMarkdown(`\n\nThis component is imported by a client component, so it runs on the client.\n`);
    }

    return md;
  }

  private formatInheritanceChain(chain: InheritanceNode[]): string {
    const lines: string[] = [];

    for (let i = 0; i < chain.length; i++) {
      const node = chain[i];
      const fileName = path.basename(node.filePath);
      const indent = "  ".repeat(i);
      const arrow = i > 0 ? "↳ " : "";

      if (node.reason === "directive") {
        lines.push(`${indent}${arrow}**${fileName}** \`"use client"\``);
      } else {
        lines.push(`${indent}${arrow}**${fileName}** (imported)`);
      }
    }

    return lines.join("\n\n");
  }
}
