"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const getProtoChain_1 = require("./getProtoChain");
function activate(context) {
    // 调试信息
    console.log('Congratulations, your extension "protochainvis" is now active!');
    // 测试命令
    const disposable = vscode.commands.registerCommand('protoChainVis.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from ProtoChainVis!');
    });
    context.subscriptions.push(disposable);
    // 错误命令
    const errorMessage = vscode.commands.registerCommand('protoChainVis.error', () => {
        vscode.window.showInformationMessage('错误：请输入用户定义的对象变量');
    });
    context.subscriptions.push(errorMessage);
    // Webview视图注册
    let currentPanel = undefined;
    context.subscriptions.push(vscode.commands.registerCommand('protoChainVis.start', () => {
        // 初始化窗口
        currentPanel = vscode.window.createWebviewPanel('protoChainVis', 'ProtoChain Visualize', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'out', 'mermaid.min.js');
        const mermaidSrc = currentPanel.webview.asWebviewUri(onDiskPath);
        currentPanel.webview.html = getWebviewContent(mermaidSrc);
        // 关闭窗口
        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        }, undefined, context.subscriptions);
        // 查找信号监听
        const editor = vscode.window.activeTextEditor;
        currentPanel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'fetch':
                    console.log("Received");
                    console.log(typeof message.target);
                    console.log(message.target);
                    const result = (0, getProtoChain_1.getProtoChain)(message.target, editor);
                    console.log("check 1");
                    const update = updateMermaid(result);
                    console.log(update);
                    if (update === false) {
                        vscode.commands.executeCommand('protoChainVis.error');
                    }
                    else {
                        currentPanel?.webview.postMessage({
                            command: 'show',
                            content: update
                        });
                    }
                    return;
            }
        }, undefined, context.subscriptions);
    }));
}
// mermaid图表内容
function updateMermaid(result) {
    if (typeof result === 'string') {
        return false;
    }
    console.log('check 2');
    let content = `classDiagram`;
    let cnt = 0;
    for (let obj of result) {
        console.log('element ' + cnt);
        if (obj === null) {
            let addContent = `
	class null
	Object-${cnt} o-- null`;
            content += addContent;
        }
        else {
            let addContent = `
	class Object-${cnt + 1}`;
            for (let p of obj.properties) {
                console.log('prop');
                addContent += `
	Object-${cnt + 1} : ${p}`;
            }
            for (let m of obj.methods) {
                console.log('method');
                addContent += `
	Object-${cnt + 1} : ${m}()`;
                if (`${m}` === 'constructor') {
                    addContent += ` ${obj.constructor}`;
                }
            }
            if (cnt !== 0) {
                addContent += `
	Object-${cnt} o-- Object-${cnt + 1}`;
            }
            content += addContent;
            cnt += 1;
        }
    }
    return content;
}
// HTML文件内容
function getWebviewContent(mermaidSrc) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProtoChain Visualize</title>
    <style>
        body{
            margin: 50px;
        }
        div{
            margin: 20px;
        }
		p{
			font-size: 16px
		}
    </style>
</head>
<body>
    <div id="inputBox">
        <input type="text" id="target" name="target" placeholder="请输入变量名">
		<button id="checkButton">查找</button>
    </div>
	<hr>
    <div id="showBox">
		<p>当前原型链：</p>
        <pre class="mermaid" id="showContent">
			classDiagram
				class null
		</pre>
    </div>
	<script src="${mermaidSrc}"></script>
    <script>
        const vscode = acquireVsCodeApi();
        const content = document.getElementById('showContent');
        const button = document.getElementById('checkButton');

		function showMermaid() {
            // 初始化
            mermaid.initialize({ 
                startOnLoad: true,
                theme: 'default',
                securityLevel: 'loose',
                flowchart: { useMaxWidth: false }
            });
            
            // 渲染图表
            try {
                mermaid.init(undefined, '.mermaid');
            } catch (error) {
                const errorElem = document.createElement('p');
                errorElem.className = 'error';
                errorElem.innerText = '渲染错误: ' + error.message;
                document.body.appendChild(errorElem);
            }
            
            // 窗口大小变化监听
            window.addEventListener('resize', () => {
                mermaid.init(undefined, '.mermaid');
            });
        };
		showMermaid();

		// 监听器
        window.addEventListener('message', event => {
            const message = event.data;
            switch(message.command) {
                case 'show':
                    content.innerHTML = message.content;
					content.removeAttribute('data-processed');
					showMermaid();
                    break;
            }
        });
        button.addEventListener('click', event => {
            const input = document.getElementById('target').value;
            vscode.postMessage({
                command: 'fetch',
                target: input
            });
        })
    </script>
</body>
</html>`;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map