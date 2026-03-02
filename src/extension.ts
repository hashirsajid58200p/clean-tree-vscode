import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  let disposableGenerate = vscode.commands.registerCommand(
    "clean-tree.generate",
    async (clickUri?: vscode.Uri) => {
      let targetPath = "";

      if (clickUri && clickUri.fsPath) {
        targetPath = clickUri.fsPath;
      } else {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          vscode.window.showErrorMessage(
            "Buddy, you need to open a project folder first!",
          );
          return;
        }
        targetPath = workspaceFolders[0].uri.fsPath;
      }

      const projectName = path.basename(targetPath);
      const panel = vscode.window.createWebviewPanel(
        "cleanTreeView",
        `Clean Tree`,
        vscode.ViewColumn.One,
        { enableScripts: true },
      );

      // --- NEW: Retrieve Saved State from VS Code Storage ---
      // If no state exists yet, we default to our standard settings
      let hideFolders = context.globalState.get<boolean>("hideFolders", true);
      let hideFiles = context.globalState.get<boolean>("hideFiles", true);
      let showIcons = context.globalState.get<boolean>("showIcons", false);

      const updateWebview = () => {
        const treeTextHTML = generateTree(
          targetPath,
          "",
          hideFolders,
          hideFiles,
          showIcons,
          false,
        );
        const rawTreeText =
          projectName +
          "\n" +
          generateTree(targetPath, "", hideFolders, hideFiles, false, true);

        panel.webview.html = getWebviewContent(
          projectName,
          treeTextHTML,
          rawTreeText,
          hideFolders,
          hideFiles,
          showIcons,
        );
      };

      panel.webview.onDidReceiveMessage(
        async (message) => {
          if (message.command === "toggleFolders") {
            hideFolders = !hideFolders;
            await context.globalState.update("hideFolders", hideFolders); // SAVE STATE
            updateWebview();
          } else if (message.command === "toggleFiles") {
            hideFiles = !hideFiles;
            await context.globalState.update("hideFiles", hideFiles); // SAVE STATE
            updateWebview();
          } else if (message.command === "toggleIcons") {
            showIcons = !showIcons;
            await context.globalState.update("showIcons", showIcons); // SAVE STATE
            updateWebview();
          } else if (message.command === "openGitHub") {
            vscode.env.openExternal(
              vscode.Uri.parse("https://github.com/hashirsajid58200p"),
            );
          } else if (message.command === "saveFile") {
            const rawTreeText =
              projectName +
              "\n" +
              generateTree(targetPath, "", hideFolders, hideFiles, false, true);
            const options: vscode.SaveDialogOptions = {
              defaultUri: vscode.Uri.file(
                path.join(targetPath, `${projectName}-tree.txt`),
              ),
              filters: { "Text Files": ["txt"], "All Files": ["*"] },
            };

            vscode.window.showSaveDialog(options).then((fileUri) => {
              if (fileUri) {
                try {
                  fs.writeFileSync(fileUri.fsPath, rawTreeText);
                  vscode.window.showInformationMessage(
                    "File Tree saved successfully!",
                  );
                } catch (error) {
                  vscode.window.showErrorMessage("Failed to save the file.");
                }
              }
            });
          }
        },
        undefined,
        context.subscriptions,
      );

      updateWebview();
    },
  );

  context.subscriptions.push(disposableGenerate);
}

// --- MASSIVELY EXPANDED ICON LOGIC ---
function getSpecificIcon(
  fileName: string,
  isDir: boolean,
  isOpenDir: boolean = false,
): string {
  if (isDir) {
    return isOpenDir
      ? '<i class="fa-solid fa-folder-open" style="color: #E8B024;"></i> '
      : '<i class="fa-solid fa-folder" style="color: #E8B024;"></i> ';
  }

  const ext = path.extname(fileName).toLowerCase();

  // Specific File Name Mapping
  const fileMap: { [key: string]: string } = {
    ".gitignore": '<i class="devicon-git-plain colored"></i> ',
    "package.json":
      '<i class="devicon-nodejs-plain colored" style="color: #83cd29;"></i> ',
    "tsconfig.json": '<i class="devicon-typescript-plain colored"></i> ',
    dockerfile: '<i class="devicon-docker-plain colored"></i> ',
    "docker-compose.yml": '<i class="devicon-docker-plain colored"></i> ',
    "tailwind.config.js":
      '<i class="devicon-tailwindcss-original colored"></i> ',
    "readme.md": '<i class="devicon-markdown-original colored"></i> ',
  };

  if (fileMap[fileName.toLowerCase()]) return fileMap[fileName.toLowerCase()];
  if (fileName.startsWith(".env"))
    return '<i class="fa-solid fa-key" style="color: #FFD700;"></i> ';

  switch (ext) {
    // --- Web & Scripting ---
    case ".html":
      return '<i class="devicon-html5-plain colored"></i> ';
    case ".css":
    case ".scss":
    case ".sass":
      return '<i class="devicon-css3-plain colored"></i> ';
    case ".js":
      return '<i class="devicon-javascript-plain colored"></i> ';
    case ".ts":
      return '<i class="devicon-typescript-plain colored"></i> ';
    case ".jsx":
    case ".tsx":
      return '<i class="devicon-react-original colored"></i> ';
    case ".json":
      return '<i class="devicon-json-plain colored" style="color: #FFD700;"></i> ';
    case ".php":
      return '<i class="devicon-php-plain colored"></i> ';

    // --- Programming Languages ---
    case ".py":
      return '<i class="devicon-python-plain colored"></i> ';
    case ".java":
    case ".jar":
      return '<i class="devicon-java-plain colored"></i> ';
    case ".cpp":
    case ".hpp":
    case ".cc":
      return '<i class="devicon-cplusplus-plain colored"></i> ';
    case ".c":
    case ".h":
      return '<i class="devicon-c-plain colored"></i> ';
    case ".cs":
      return '<i class="devicon-csharp-plain colored"></i> ';
    case ".rs":
      return '<i class="devicon-rust-plain colored"></i> ';
    case ".go":
      return '<i class="devicon-go-original-wordmark colored"></i> ';
    case ".rb":
      return '<i class="devicon-ruby-plain colored"></i> ';
    case ".swift":
      return '<i class="devicon-swift-plain colored"></i> ';
    case ".kt":
    case ".kts":
      return '<i class="devicon-kotlin-plain colored"></i> ';
    case ".dart":
      return '<i class="devicon-dart-plain colored"></i> ';

    // --- Media & Images ---
    case ".png":
    case ".jpg":
    case ".jpeg":
    case ".gif":
    case ".webp":
    case ".ico":
      return '<i class="fa-solid fa-image" style="color: #4CAF50;"></i> ';
    case ".svg":
      return '<i class="fa-solid fa-file-code" style="color: #FF9800;"></i> ';
    case ".mp4":
    case ".mov":
    case ".avi":
      return '<i class="fa-solid fa-file-video" style="color: #E91E63;"></i> ';

    // --- Config & Data ---
    case ".yaml":
    case ".yml":
      return '<i class="fa-solid fa-gears" style="color: #CB171E;"></i> ';
    case ".xml":
      return '<i class="fa-solid fa-file-code" style="color: #757575;"></i> ';
    case ".sql":
      return '<i class="fa-solid fa-database" style="color: #00BCD4;"></i> ';

    // --- Documents ---
    case ".md":
      return '<i class="devicon-markdown-original colored"></i> ';
    case ".pdf":
      return '<i class="fa-solid fa-file-pdf" style="color: #F44336;"></i> ';
    case ".txt":
      return '<i class="fa-solid fa-file-lines" style="color: #ddd;"></i> ';

    // --- Archives ---
    case ".zip":
    case ".rar":
    case ".7z":
    case ".tar":
    case ".gz":
      return '<i class="fa-solid fa-file-zipper" style="color: #FFC107;"></i> ';

    default:
      return '<i class="fa-regular fa-file" style="color: #999;"></i> ';
  }
}

function generateTree(
  dirPath: string,
  prefix: string,
  hideFolders: boolean,
  hideFiles: boolean,
  showIcons: boolean,
  isRawExport: boolean,
): string {
  let result = "";
  try {
    const items = fs.readdirSync(dirPath);
    const folderJunk = [
      ".git",
      "node_modules",
      "dist",
      "build",
      ".vscode",
      ".next",
      "__pycache__",
      "venv",
      ".venv",
      "env",
      "target",
      "bin",
      "obj",
      ".idea",
    ];
    const fileJunkExts = [".pyc", ".class", ".DS_Store", ".exe", ".log"];

    let filteredItems = items.filter((item) => {
      const itemPath = path.join(dirPath, item);
      try {
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          if (hideFolders && folderJunk.includes(item)) return false;
        } else {
          if (
            hideFiles &&
            (item.startsWith(".") || fileJunkExts.includes(path.extname(item)))
          )
            return false;
        }
        return true;
      } catch (e) {
        return false;
      }
    });

    filteredItems.sort((a, b) => {
      try {
        const aIsDir = fs.statSync(path.join(dirPath, a)).isDirectory();
        const bIsDir = fs.statSync(path.join(dirPath, b)).isDirectory();
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.toLowerCase().localeCompare(b.toLowerCase());
      } catch (e) {
        return 0;
      }
    });

    filteredItems.forEach((item, index) => {
      const isLast = index === filteredItems.length - 1;
      const itemPath = path.join(dirPath, item);
      try {
        const stat = fs.statSync(itemPath);
        const pointer = isLast ? "┗ " : "┣ ";
        let iconHTML = "";
        if (showIcons && !isRawExport) {
          iconHTML = getSpecificIcon(item, stat.isDirectory());
        }
        result += `${prefix}${pointer}${iconHTML}${item}\n`;
        if (stat.isDirectory()) {
          const nextPrefix = prefix + (isLast ? "  " : "┃ ");
          result += generateTree(
            itemPath,
            nextPrefix,
            hideFolders,
            hideFiles,
            showIcons,
            isRawExport,
          );
        }
      } catch (err) {}
    });
  } catch (err) {}
  return result;
}

function getWebviewContent(
  projectName: string,
  treeText: string,
  rawTreeText: string,
  hideFolders: boolean,
  hideFiles: boolean,
  showIcons: boolean,
) {
  const rootIcon = showIcons ? getSpecificIcon(projectName, true, true) : "";

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css" />
        <style>
            body {
                font-family: 'Consolas', monospace;
                font-size: 14px;
                padding: 0;
                margin: 0;
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
            }
            .header {
                position: sticky;
                top: 0;
                background-color: var(--vscode-editor-background);
                padding: 14px 20px;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
                z-index: 100;
            }
            .controls {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            .btn {
                background-color: #007acc;
                color: white;
                border: 1px solid #007acc;
                padding: 6px 11px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                height: 31px;
                box-sizing: border-box;
                display: flex;
                align-items: center;
                transition: all 0.2s;
            }
            .btn:hover { background-color: #005999; border-color: #005999; }
            .btn.active { background-color: #1e1e1e; border: 1px solid #007acc; color: #007acc; }
            
            .btn-copy { background-color: #6c757d; border-color: #6c757d; }
            .btn-save { background-color: #218838; border-color: #218838; }

            .btn-heart {
                background-color: #e60000;
                border: none;
                color: white;
                width: 31px; 
                height: 31px;
                border-radius: 4px;
                cursor: pointer;
                display: grid;
                place-items: center;
                padding: 0; 
                margin: 0;
                transition: background 0.2s;
            }
            .btn-heart:hover { background-color: #b30000; }
            .btn-heart i {
                margin: 0 !important; 
                padding: 0 !important;
                font-size: 14px;
                line-height: 1;
                display: block;
            }

            .tree-content { padding: 20px; white-space: pre; line-height: 1.6; }
            .project-name { font-weight: bold; font-size: 16px; }
            
            i {
                font-size: 14px;
                vertical-align: middle;
                margin-right: 5px;
            }
            .devicon-html5-plain, .devicon-css3-plain, .devicon-javascript-plain, 
            .devicon-typescript-plain, .devicon-react-original, .devicon-nodejs-plain,
            .devicon-python-plain, .devicon-java-plain, .devicon-rust-plain {
                font-size: 15px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="project-name">${projectName} Clean Tree</div>
            <div class="controls">
                <button class="btn ${!hideFolders ? "active" : ""}" onclick="vscode.postMessage({command:'toggleFolders'})">
                    ${hideFolders ? "Show" : "Hide"} Dependencies
                </button>
                <button class="btn ${!hideFiles ? "active" : ""}" onclick="vscode.postMessage({command:'toggleFiles'})">
                    ${hideFiles ? "Show" : "Hide"} Files
                </button>
                <button class="btn ${showIcons ? "active" : ""}" onclick="vscode.postMessage({command:'toggleIcons'})">
                    Icons: ${showIcons ? "ON" : "OFF"}
                </button>
                <button id="copyBtn" class="btn btn-copy" onclick="copyToClipboard()">
                    <i class="fa-solid fa-copy"></i> Copy
                </button>
                <button class="btn btn-save" onclick="vscode.postMessage({command:'saveFile'})">
                    <i class="fa-solid fa-floppy-disk"></i> Save
                </button>
                <button class="btn-heart" onclick="vscode.postMessage({command:'openGitHub'})" title="Follow Hashir">
                    <i class="fa-solid fa-heart"></i>
                </button>
            </div>
        </div>
        <div class="tree-content"><strong>${rootIcon}${projectName}</strong>\n${treeText}</div>
        <script>
            const vscode = acquireVsCodeApi();
            const rawText = \`${rawTreeText}\`;
            function copyToClipboard() {
                navigator.clipboard.writeText(rawText).then(() => {
                    const btn = document.getElementById('copyBtn');
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                    btn.style.backgroundColor = '#218838';
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.style.backgroundColor = '';
                    }, 2000);
                });
            }
        </script>
    </body>
    </html>`;
}
