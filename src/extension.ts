import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getProtoChain } from './getProtoChain';

export function activate(context: vscode.ExtensionContext) {
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
	let currentPanel: vscode.WebviewPanel | undefined = undefined;
	context.subscriptions.push(
		vscode.commands.registerCommand('protoChainVis.start', () => {
			// 初始化窗口
			currentPanel = vscode.window.createWebviewPanel(
          		'protoChainVis',
          		'ProtoChain Visualize',
          		vscode.ViewColumn.Beside,
          		{
            		enableScripts: true,
					retainContextWhenHidden: true
          		}
        	);
			const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'out', 'mermaid.min.js');
      		const mermaidSrc = currentPanel.webview.asWebviewUri(onDiskPath);
      		currentPanel.webview.html = getWebviewContent(mermaidSrc);

			// 关闭窗口
        	currentPanel.onDidDispose(
				() => {
            		currentPanel = undefined;
          		},
          		undefined,
          		context.subscriptions
        	);

			// 查找信号监听
			const editor = vscode.window.activeTextEditor;
			currentPanel.webview.onDidReceiveMessage(
        		message => {
          			switch (message.command) {
            			case 'fetch':
							console.log("Received analysis request for:", message.target);
							const result = getProtoChain(message.target, editor);
							console.log("Analysis result:", result);
							const update = updateMermaid(result);
							
							if (update === false) {
								// 发送错误信息到前端
								currentPanel?.webview.postMessage({
									command: 'error',
									message: typeof result === 'string' ? result : '分析失败，请检查变量名'
								});
								vscode.commands.executeCommand('protoChainVis.error');
							} else {
								// 发送成功结果到前端
								currentPanel?.webview.postMessage({
									command: 'show',
									content: update 
								});
							}
							return;
          			}
        		},
        		undefined,
        		context.subscriptions
      		);
		})
	);
}

// mermaid图表内容
function updateMermaid(result: any) {
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
function getWebviewContent(mermaidSrc: vscode.Uri) {
	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProtoChain Visualize</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
        }

        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
        }

        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }

        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }

        .input-section {
            padding: 40px;
            background: #ffffff;
            color: #1f2937;
        }

        .input-group {
            display: flex;
            gap: 15px;
            align-items: center;
            max-width: 600px;
            margin: 0 auto;
        }

        .input-wrapper {
            flex: 1;
            position: relative;
        }

        #target {
            width: 100%;
            padding: 15px 20px;
            border: 2px solid #d1d5db;
            border-radius: 12px;
            font-size: 16px;
            transition: all 0.3s ease;
            background: #f9fafb;
            color: #111827;
        }

        #target:focus {
            outline: none;
            border-color: #667eea;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            color: #111827;
        }

        #target::placeholder {
            color: #6b7280;
        }

        #checkButton {
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        #checkButton:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        #checkButton:active {
            transform: translateY(0);
        }

        #checkButton::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }

        #checkButton:hover::before {
            left: 100%;
        }

        .divider {
            height: 2px;
            background: linear-gradient(90deg, transparent, #667eea, transparent);
            margin: 0 40px;
        }

        .result-section {
            padding: 40px;
            background: #f8fafc;
            color: #1e293b;
        }

        .result-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 25px;
        }

        .result-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
        }

        .result-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
        }

        .chart-container {
            background: #ffffff;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
            min-height: 400px;
            position: relative;
            border: 1px solid #e2e8f0;
        }

        .mermaid {
            font-family: inherit !important;
            color: #1e293b;
        }

        .error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            color: #991b1b;
            margin-top: 20px;
            font-weight: 500;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 40px;
            color: #475569;
        }

        .loading.show {
            display: block;
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
            padding: 0 40px 40px;
            background: #f8fafc;
        }

        .feature-item {
            background: #ffffff;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            text-align: center;
            transition: transform 0.3s ease;
            border: 1px solid #e2e8f0;
        }

        .feature-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
        }

        .feature-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            margin: 0 auto 15px;
        }

        .feature-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 10px;
        }

        .feature-desc {
            color: #64748b;
            font-size: 0.9rem;
            line-height: 1.5;
        }

        @media (max-width: 768px) {
            body {
                padding: 10px;
            }

            .header h1 {
                font-size: 2rem;
            }

            .input-group {
                flex-direction: column;
                gap: 15px;
            }

            #checkButton {
                width: 100%;
            }

            .input-section,
            .result-section {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 ProtoChain Visualizer</h1>
            <p>探索 JavaScript 对象原型链的可视化工具</p>
        </div>

        <div class="input-section">
            <div class="input-group">
                <div class="input-wrapper">
                    <input type="text" id="target" name="target" placeholder="请输入要分析的变量名 (例如: myObject, arr, user)">
                </div>
                <button id="checkButton">
                    <span>🔍 分析原型链</span>
                </button>
            </div>
        </div>

        <div class="divider"></div>

        <div class="result-section">
            <div class="result-header">
                <div class="result-icon">📊</div>
                <h2 class="result-title">原型链可视化结果</h2>
            </div>
            
            <div class="loading" id="loading">
                <div class="loading-spinner"></div>
                <p>正在分析原型链...</p>
            </div>

            <div class="chart-container">
                <pre class="mermaid" id="showContent">
                    classDiagram
                        class Welcome {
                            +欢迎使用 ProtoChain Visualizer
                            +请在上方输入要分析的变量名
                            +点击"分析原型链"按钮开始
                        }
                </pre>
            </div>
        </div>

        <div class="feature-list">
            <div class="feature-item">
                <div class="feature-icon">⚡</div>
                <h3 class="feature-title">实时分析</h3>
                <p class="feature-desc">即时分析当前编辑器中的对象原型链结构</p>
            </div>
            <div class="feature-item">
                <div class="feature-icon">🎨</div>
                <h3 class="feature-title">可视化图表</h3>
                <p class="feature-desc">使用 Mermaid 生成清晰的原型链关系图</p>
            </div>
            <div class="feature-item">
                <div class="feature-icon">🔧</div>
                <h3 class="feature-title">现代语法支持</h3>
                <p class="feature-desc">支持 ES6+、TypeScript 等现代 JavaScript 特性</p>
            </div>
            <div class="feature-item">
                <div class="feature-icon">📱</div>
                <h3 class="feature-title">响应式设计</h3>
                <p class="feature-desc">适配不同屏幕尺寸，提供最佳用户体验</p>
            </div>
        </div>
    </div>

	<script src="${mermaidSrc}"></script>
    <script>
        const vscode = acquireVsCodeApi();
        const content = document.getElementById('showContent');
        const button = document.getElementById('checkButton');
        const loading = document.getElementById('loading');
        const targetInput = document.getElementById('target');

        function showLoading() {
            loading.classList.add('show');
        }

        function hideLoading() {
            loading.classList.remove('show');
        }

		function showMermaid() {
            // 初始化
            mermaid.initialize({ 
                startOnLoad: true,
                theme: 'default',
                securityLevel: 'loose',
                flowchart: { useMaxWidth: false },
                themeVariables: {
                    primaryColor: '#667eea',
                    primaryTextColor: '#1e293b',
                    primaryBorderColor: '#667eea',
                    lineColor: '#667eea',
                    secondaryColor: '#764ba2',
                    tertiaryColor: '#f1f5f9',
                    background: '#ffffff',
                    mainBkg: '#ffffff',
                    secondBkg: '#f8fafc',
                    tertiaryBkg: '#f1f5f9'
                }
            });
            
            // 渲染图表
            try {
                mermaid.init(undefined, '.mermaid');
            } catch (error) {
                const errorElem = document.createElement('div');
                errorElem.className = 'error';
                errorElem.innerHTML = '<strong>渲染错误:</strong> ' + error.message;
                content.parentNode.insertBefore(errorElem, content.nextSibling);
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
                    hideLoading();
                    content.innerHTML = message.content;
					content.removeAttribute('data-processed');
					showMermaid();
                    break;
                case 'error':
                    hideLoading();
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error';
                    errorDiv.innerHTML = '<strong>分析失败:</strong> ' + (message.message || '请检查变量名是否正确定义');
                    content.parentNode.insertBefore(errorDiv, content.nextSibling);
                    // 3秒后自动隐藏错误信息
                    setTimeout(() => {
                        if (errorDiv.parentNode) {
                            errorDiv.parentNode.removeChild(errorDiv);
                        }
                    }, 5000);
                    break;
            }
        });

        function handleAnalysis() {
            const input = targetInput.value.trim();
            if (!input) {
                targetInput.focus();
                return;
            }
            
            showLoading();
            vscode.postMessage({
                command: 'fetch',
                target: input
            });
        }

        button.addEventListener('click', handleAnalysis);
        
        targetInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAnalysis();
            }
        });

        // 添加输入焦点效果
        targetInput.addEventListener('focus', () => {
            targetInput.parentElement.style.transform = 'scale(1.02)';
        });

        targetInput.addEventListener('blur', () => {
            targetInput.parentElement.style.transform = 'scale(1)';
        });
    </script>
</body>
</html>`;
}

export function deactivate() {}