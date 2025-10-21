import * as vscode from "vscode";
import * as path from "path";

// Helper function to detect if cn utility exists in the project
async function detectCnUtility(): Promise<{ exists: boolean; fileUri?: vscode.Uri; aliasPath?: string }> {
  try {
    // Search for common cn utility file patterns
    const patterns = [
      { pattern: '**/lib/utils.ts', aliasPath: '@/lib/utils' },
      { pattern: '**/lib/utils.js', aliasPath: '@/lib/utils' },
      { pattern: '**/utils/cn.ts', aliasPath: '@/utils/cn' },
      { pattern: '**/utils/cn.js', aliasPath: '@/utils/cn' },
      { pattern: '**/src/lib/utils.ts', aliasPath: '@/lib/utils' },
      { pattern: '**/src/utils/cn.ts', aliasPath: '@/utils/cn' },
    ];

    for (const { pattern, aliasPath } of patterns) {
      const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 1);
      if (files.length > 0) {
        // Check if the file contains a cn function
        const document = await vscode.workspace.openTextDocument(files[0]);
        const text = document.getText();
        if (/\bfunction\s+cn\b|\bconst\s+cn\s*=|\bexport\s+.*\bcn\b/.test(text)) {
          return { exists: true, fileUri: files[0], aliasPath };
        }
      }
    }
    return { exists: false };
  } catch (error) {
    return { exists: false };
  }
}

// Helper function to check if path alias (@) is configured
async function hasPathAlias(): Promise<boolean> {
  try {
    // Check both tsconfig.json and jsconfig.json
    const configFiles = await vscode.workspace.findFiles(
      '**/tsconfig.json',
      '**/node_modules/**',
      1
    );
    
    const jsConfigFiles = await vscode.workspace.findFiles(
      '**/jsconfig.json',
      '**/node_modules/**',
      1
    );
    
    const allConfigFiles = [...configFiles, ...jsConfigFiles];
    
    if (allConfigFiles.length > 0) {
      const document = await vscode.workspace.openTextDocument(allConfigFiles[0]);
      const text = document.getText();
      
      // Try to parse the JSON and check for path aliases
      try {
        // Remove comments from JSON (simple approach)
        const cleanedText = text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const config = JSON.parse(cleanedText);
        
        // Check if compilerOptions.paths exists and has @ alias
        if (config.compilerOptions?.paths) {
          const paths = config.compilerOptions.paths;
          // Check for @ or @/* aliases
          return '@/*' in paths || '@' in paths;
        }
      } catch (parseError) {
        // Fallback to regex if JSON parsing fails
        return /@["'\/]/.test(text) && /paths/.test(text) && /compilerOptions/.test(text);
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Helper function to calculate relative import path
function getRelativePath(fromFile: vscode.Uri, toFile: vscode.Uri): string {
  const fromDir = path.dirname(fromFile.fsPath);
  const toPath = toFile.fsPath;
  
  let relativePath = path.relative(fromDir, toPath);
  
  // Remove file extension
  relativePath = relativePath.replace(/\.(ts|js)$/, '');
  
  // Ensure it starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  // Convert Windows backslashes to forward slashes
  relativePath = relativePath.replace(/\\/g, '/');
  
  return relativePath;
}

// Helper function to add import statement if it doesn't exist
function addImportIfNeeded(
  document: vscode.TextDocument,
  utilityFunction: string,
  importPath: string | undefined,
  edits: vscode.TextEdit[]
): void {
  const text = document.getText();
  
  // Check if import already exists
  const hasImport = new RegExp(`import\s+.*\b${utilityFunction}\b.*from`).test(text);
  
  if (!hasImport && importPath) {
    // Find the position to insert the import (after last import or at the beginning)
    const lines = text.split('\n');
    let insertLine = 0;
    
    // Find the last import statement
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s+/.test(lines[i].trim())) {
        insertLine = i + 1;
      }
    }
    
    // Create the import statement
    const importStatement = `import { ${utilityFunction} } from "${importPath}";\n`;
    const insertPosition = new vscode.Position(insertLine, 0);
    
    edits.unshift(vscode.TextEdit.insert(insertPosition, importStatement));
  }
}

// Helper function to check if prettier-plugin-tailwindcss is installed
async function hasPrettierTailwindPlugin(): Promise<boolean> {
  try {
    const packageJsonFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**', 1);
    if (packageJsonFiles.length > 0) {
      const document = await vscode.workspace.openTextDocument(packageJsonFiles[0]);
      const text = document.getText();
      const packageJson = JSON.parse(text);
      
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      return 'prettier-plugin-tailwindcss' in deps;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Helper function to format document with Prettier if available
async function formatWithPrettier(document: vscode.TextDocument): Promise<void> {
  try {
    // Execute Prettier format command
    await vscode.commands.executeCommand('editor.action.formatDocument');
  } catch (error) {
    // Prettier not available or failed, continue without it
  }
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "extension.tailwindFormatter",
    () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) return;

      const selection = editor.selection;

      // If there's no selection (isEmpty), do nothing here
      // The onWillSaveTextDocument handler will take care of it
      if (selection.isEmpty) {
        return;
      }

      // If there's a selection, apply the current transformation
      const text = editor.document.getText(selection);

      const trimmed = text.replace(/^['"`]|['"`]|,$/g, "");
      const transformed = trimmed
        .replace(/\,/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .map((str) => `'${str}'`)
        .join(", ");

      editor.edit((editBuilder) => {
        editBuilder.replace(selection, `${transformed}`);
      });
    }
  );

  // Handler for transforming className on save (when there's no selection)
  const onSaveDisposable = vscode.workspace.onWillSaveTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;

    if (!editor || editor.document !== event.document) return;

    const selection = editor.selection;

    // Only apply auto-transformation if there's no selection
    if (!selection.isEmpty) return;

    const document = event.document;
    const text = document.getText();

    // Detect which utility function is used
    // 1. Check if cn() or clsx() is used in the current file
    const usesCnInFile = /\bcn\s*\(/.test(text);
    const usesClsxInFile = /\bclsx\s*\(/.test(text);

    // 2. Check if cn utility exists in the project (async, but we'll use a promise)
    const detectAndTransform = async () => {
      // Check if prettier-plugin-tailwindcss is installed
      const hasPrettierPlugin = await hasPrettierTailwindPlugin();
      
      // If Prettier plugin is available, format first to sort classes
      if (hasPrettierPlugin) {
        await formatWithPrettier(document);
      }
      
      const cnUtilityInfo = await detectCnUtility();
      
      // Determine which function to use:
      // - If cn() is used in file, use cn
      // - Else if clsx() is used in file, use clsx
      // - Else if cn utility exists in project, use cn
      // - Otherwise default to clsx
      const utilityFunction = usesCnInFile ? "cn" 
        : usesClsxInFile ? "clsx" 
        : cnUtilityInfo.exists ? "cn" 
        : "clsx";
      
      // Determine the import path
      let importPath: string | undefined;
      if (cnUtilityInfo.exists && cnUtilityInfo.fileUri) {
        const hasAlias = await hasPathAlias();
        if (hasAlias && cnUtilityInfo.aliasPath) {
          importPath = cnUtilityInfo.aliasPath;
        } else {
          // Use relative path
          importPath = getRelativePath(document.uri, cnUtilityInfo.fileUri);
        }
      }

      // Regex patterns to find className* strings (matches className, classNameLabel, etc.)
      // Pattern 1: className*="..." or className*='...'
      const classNameRegex1 = /(className\w*)=(["'])([\s\S]*?)\2/g;
      // Pattern 2: className*={"..."} or className*={'...'}
      const classNameRegex2 = /(className\w*)=\{\s*(["'])([\s\S]*?)\2\s*\}/g;

      const edits: vscode.TextEdit[] = [];

      // Process pattern 1: className*="..."
      let match;
      while ((match = classNameRegex1.exec(text)) !== null) {
        const fullMatch = match[0];
        const attrName = match[1]; // e.g., "className" or "classNameLabel"
        const classes = match[3];

        const classArray = classes.split(/\s+/).filter(Boolean);

        if (classArray.length >= 1) {
          const formattedClasses = classArray.map((cls) => `'${cls}'`).join(", ");
          const replacement = `${attrName}={${utilityFunction}(${formattedClasses})}`;

          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + fullMatch.length);
          const range = new vscode.Range(startPos, endPos);

          edits.push(vscode.TextEdit.replace(range, replacement));
        }
      }

      // Process pattern 2: className*={"..."}
      while ((match = classNameRegex2.exec(text)) !== null) {
        const fullMatch = match[0];
        const attrName = match[1]; // e.g., "className" or "classNameLabel"
        const classes = match[3];

        const classArray = classes.split(/\s+/).filter(Boolean);

        if (classArray.length >= 1) {
          const formattedClasses = classArray.map((cls) => `'${cls}'`).join(", ");
          const replacement = `${attrName}={${utilityFunction}(${formattedClasses})}`;

          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + fullMatch.length);
          const range = new vscode.Range(startPos, endPos);

          edits.push(vscode.TextEdit.replace(range, replacement));
        }
      }

      if (edits.length > 0) {
        // Add import statement if using cn and it doesn't exist
        if (utilityFunction === "cn") {
          addImportIfNeeded(document, utilityFunction, importPath, edits);
        }
        
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(document.uri, edits);
        return vscode.workspace.applyEdit(workspaceEdit);
      }
    };

    // Execute the async transformation
    event.waitUntil(detectAndTransform());
  });

  context.subscriptions.push(disposable, onSaveDisposable);
}
