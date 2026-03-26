import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";

export type ComponentType = "server" | "client";

export interface ComponentInfo {
  filePath: string;
  componentName: string;
  type: ComponentType;
  hasUseClientDirective: boolean;
  inheritanceChain: InheritanceNode[];
}

export interface InheritanceNode {
  filePath: string;
  componentName: string;
  reason: "directive" | "import";
}

export interface AnalysisResult {
  components: Map<string, ComponentInfo>;
  imports: Map<string, Set<string>>; // file -> imported files
}

export class RSCAnalyzer {
  private fileCache = new Map<string, string>();
  private analysisCache = new Map<string, ComponentInfo>();
  private importGraph = new Map<string, Set<string>>();
  private clientFiles = new Set<string>();
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  clearCache() {
    this.fileCache.clear();
    this.analysisCache.clear();
    this.importGraph.clear();
    this.clientFiles.clear();
  }

  invalidateFile(filePath: string) {
    this.fileCache.delete(filePath);
    this.analysisCache.delete(filePath);
    // Need to rebuild import graph when file changes
    this.importGraph.delete(filePath);
  }

  async analyzeFile(filePath: string): Promise<ComponentInfo | null> {
    const normalizedPath = path.resolve(filePath);

    // Check cache first
    if (this.analysisCache.has(normalizedPath)) {
      return this.analysisCache.get(normalizedPath)!;
    }

    const content = await this.readFile(normalizedPath);
    if (!content) return null;

    const hasDirective = this.hasUseClientDirective(content);
    const imports = this.extractImports(content, normalizedPath);

    this.importGraph.set(normalizedPath, imports);

    if (hasDirective) {
      this.clientFiles.add(normalizedPath);
    }

    const componentName = this.extractComponentName(content, normalizedPath);
    const inheritanceChain = await this.buildInheritanceChain(normalizedPath);

    const type: ComponentType = inheritanceChain.length > 0 ? "client" : "server";

    const info: ComponentInfo = {
      filePath: normalizedPath,
      componentName,
      type,
      hasUseClientDirective: hasDirective,
      inheritanceChain,
    };

    this.analysisCache.set(normalizedPath, info);
    return info;
  }

  private async readFile(filePath: string): Promise<string | null> {
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath)!;
    }

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      this.fileCache.set(filePath, content);
      return content;
    } catch {
      return null;
    }
  }

  hasUseClientDirective(content: string): boolean {
    // Check for "use client" directive at the start of the file
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*")) {
        continue;
      }
      // Check for the directive
      if (trimmed === '"use client"' || trimmed === "'use client'" ||
          trimmed === '"use client";' || trimmed === "'use client';") {
        return true;
      }
      // If we hit any other code, stop looking
      break;
    }
    return false;
  }

  private extractImports(content: string, fromFile: string): Set<string> {
    const imports = new Set<string>();
    const sourceFile = ts.createSourceFile(
      fromFile,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const importPath = moduleSpecifier.text;
          const resolvedPath = this.resolveImport(importPath, fromFile);
          if (resolvedPath) {
            imports.add(resolvedPath);
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return imports;
  }

  private resolveImport(importPath: string, fromFile: string): string | null {
    // Only resolve relative imports for now
    if (!importPath.startsWith(".")) {
      return null;
    }

    const dir = path.dirname(fromFile);
    const extensions = [".tsx", ".ts", ".jsx", ".js"];

    // Try exact path first
    let resolved = path.resolve(dir, importPath);

    // Try with extensions
    for (const ext of extensions) {
      const withExt = resolved + ext;
      if (fs.existsSync(withExt)) {
        return withExt;
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexPath = path.join(resolved, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }

  private extractComponentName(content: string, filePath: string): string {
    // Try to extract the default export component name
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    let componentName = path.basename(filePath, path.extname(filePath));

    const visit = (node: ts.Node) => {
      // Check for export default function Name()
      if (ts.isFunctionDeclaration(node) && node.name) {
        const modifiers = ts.getModifiers(node);
        const isExportDefault = modifiers?.some(
          (m) => m.kind === ts.SyntaxKind.ExportKeyword
        ) && modifiers?.some(
          (m) => m.kind === ts.SyntaxKind.DefaultKeyword
        );
        if (isExportDefault) {
          componentName = node.name.text;
        }
      }

      // Check for export default class Name
      if (ts.isClassDeclaration(node) && node.name) {
        const modifiers = ts.getModifiers(node);
        const isExportDefault = modifiers?.some(
          (m) => m.kind === ts.SyntaxKind.ExportKeyword
        ) && modifiers?.some(
          (m) => m.kind === ts.SyntaxKind.DefaultKeyword
        );
        if (isExportDefault) {
          componentName = node.name.text;
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return componentName;
  }

  private async buildInheritanceChain(filePath: string): Promise<InheritanceNode[]> {
    const chain: InheritanceNode[] = [];
    const visited = new Set<string>();

    await this.traceClientBoundary(filePath, chain, visited);

    return chain;
  }

  private async traceClientBoundary(
    filePath: string,
    chain: InheritanceNode[],
    visited: Set<string>
  ): Promise<boolean> {
    if (visited.has(filePath)) {
      return chain.length > 0;
    }
    visited.add(filePath);

    const content = await this.readFile(filePath);
    if (!content) return false;

    // Check if this file has "use client"
    if (this.hasUseClientDirective(content)) {
      chain.push({
        filePath,
        componentName: this.extractComponentName(content, filePath),
        reason: "directive",
      });
      return true;
    }

    // Find all files that import this file
    const importers = this.findImporters(filePath);

    for (const importer of importers) {
      const importerContent = await this.readFile(importer);
      if (!importerContent) continue;

      if (this.hasUseClientDirective(importerContent)) {
        chain.push({
          filePath: importer,
          componentName: this.extractComponentName(importerContent, importer),
          reason: "directive",
        });
        chain.push({
          filePath,
          componentName: this.extractComponentName(content, filePath),
          reason: "import",
        });
        return true;
      }

      // Recursively check if the importer is a client component
      const subChain: InheritanceNode[] = [];
      if (await this.traceClientBoundary(importer, subChain, visited)) {
        chain.push(...subChain);
        chain.push({
          filePath,
          componentName: this.extractComponentName(content, filePath),
          reason: "import",
        });
        return true;
      }
    }

    return false;
  }

  private findImporters(filePath: string): string[] {
    const importers: string[] = [];

    for (const [file, imports] of this.importGraph) {
      if (imports.has(filePath)) {
        importers.push(file);
      }
    }

    return importers;
  }

  async analyzeWorkspace(rootDir: string): Promise<void> {
    const files = this.findReactFiles(rootDir);

    // First pass: build import graph and identify client files
    for (const file of files) {
      const content = await this.readFile(file);
      if (!content) continue;

      if (this.hasUseClientDirective(content)) {
        this.clientFiles.add(file);
      }

      const imports = this.extractImports(content, file);
      this.importGraph.set(file, imports);
    }

    // Second pass: analyze each file with full context
    for (const file of files) {
      await this.analyzeFile(file);
    }
  }

  private findReactFiles(dir: string): string[] {
    const files: string[] = [];
    const extensions = [".tsx", ".ts", ".jsx", ".js"];

    const walk = (currentDir: string) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            // Skip node_modules and hidden directories
            if (entry.name === "node_modules" || entry.name.startsWith(".")) {
              continue;
            }
            walk(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch {
        // Ignore permission errors
      }
    };

    walk(dir);
    return files;
  }

  getComponentInfo(filePath: string): ComponentInfo | undefined {
    return this.analysisCache.get(path.resolve(filePath));
  }
}
