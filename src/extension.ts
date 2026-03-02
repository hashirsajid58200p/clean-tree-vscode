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

      let hideFolders = true;
      let hideFiles = true;
      let showIcons = false;

      const updateWebview = () => {
        const treeTextHTML = generateTree(
          targetPath,
          "",
          hideFolders,
          hideFiles,
          showIcons,
          false,
        );
        panel.webview.html = getWebviewContent(
          projectName,
          treeTextHTML,
          hideFolders,
          hideFiles,
          showIcons,
        );
      };

      panel.webview.onDidReceiveMessage(
        (message) => {
          if (message.command === "toggleFolders") {
            hideFolders = !hideFolders;
            updateWebview();
          } else if (message.command === "toggleFiles") {
            hideFiles = !hideFiles;
            updateWebview();
          } else if (message.command === "toggleIcons") {
            showIcons = !showIcons;
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

// --- Specific Icon Library Logic ---
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

  switch (ext) {
    case ".html":
      return '<i class="devicon-html5-plain colored"></i> ';
    case ".css":
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
    case ".cpp":
    case ".c":
      return '<i class="devicon-cplusplus-plain colored"></i> ';
    case ".py":
      return '<i class="devicon-python-plain colored"></i> ';
    case ".java":
      return '<i class="devicon-java-plain colored"></i> ';
    case ".rs":
      return '<i class="devicon-rust-plain colored"></i> ';
    case ".node":
      return '<i class="devicon-nodejs-plain colored"></i> ';
    case ".png":
    case ".jpg":
    case ".jpeg":
    case ".svg":
    case ".gif":
      return '<i class="fa-solid fa-image" style="color: #4CAF50;"></i> ';
    case ".zip":
    case ".tar":
    case ".gz":
      return '<i class="fa-solid fa-file-zipper" style="color: #ccc;"></i> ';
    case ".env":
      return '<i class="fa-solid fa-gear" style="color: #aaa;"></i> ';
    case ".md":
      return '<i class="devicon-markdown-original colored"></i> ';
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

    // --- NEW LOGIC: Sort Folders First, Then Files ---
    filteredItems.sort((a, b) => {
      try {
        const aIsDir = fs.statSync(path.join(dirPath, a)).isDirectory();
        const bIsDir = fs.statSync(path.join(dirPath, b)).isDirectory();

        if (aIsDir && !bIsDir) return -1; // 'a' is a folder, push to top
        if (!aIsDir && bIsDir) return 1; // 'b' is a folder, push to top

        // If both are folders or both are files, sort alphabetically
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
                transition: background 0.2s, border 0.2s;
            }
            .btn:hover {
                background-color: #005999;
                border-color: #005999;
            }
            .btn.active {
                background-color: #1e1e1e;
                border: 1px solid #007acc;
                color: #007acc;
            }
            .btn.active:hover {
                background-color: #2a2a2a;
            }
            
            .btn-save { 
                background-color: #218838; 
                border-color: #218838; 
                color: white; 
            }
            .btn-save:hover { 
                background-color: #19692c; 
                border-color: #19692c; 
            }
            
            .btn-heart {
                background-color: #e60000;
                border: none;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 7px 10px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .btn-heart:hover {
                background-color: #b30000; 
            }

            .tree-content {
                padding: 20px;
                white-space: pre;
                line-height: 1.6;
            }
            .project-name {
                font-weight: bold;
                font-size: 16px;
            }
            i {
                font-size: 14px;
                vertical-align: middle;
                margin-right: 5px;
            }
            .btn-heart i {
                margin-right: 0;
                font-size: 14px;
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
                    ${hideFolders ? "Show" : "Hide"} Dependencies/Hidden Folders
                </button>
                <button class="btn ${!hideFiles ? "active" : ""}" onclick="vscode.postMessage({command:'toggleFiles'})">
                    ${hideFiles ? "Show" : "Hide"} Files
                </button>
                <button class="btn ${showIcons ? "active" : ""}" onclick="vscode.postMessage({command:'toggleIcons'})">
                    Icons: ${showIcons ? "ON" : "OFF"}
                </button>
                <button class="btn btn-save" onclick="vscode.postMessage({command:'saveFile'})">
                    <i class="fa-solid fa-floppy-disk"></i> Save
                </button>
                
                <button class="btn-heart" onclick="vscode.postMessage({command:'openGitHub'})" title="Support the Creator">
                    <i class="fa-solid fa-heart"></i>
                </button>
            </div>
        </div>
        
        <div class="tree-content"><strong>${rootIcon}${projectName}</strong>\n${treeText}</div>
        
        <script>const vscode = acquireVsCodeApi();</script>
    </body>
    </html>`;
}
