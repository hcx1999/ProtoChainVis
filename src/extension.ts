// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// function readExampleFile() {
//     try {
//         const filePath = path.join(__dirname, 'example.js');
//         return fs.readFileSync(filePath, 'utf8');
//     } catch (error) {
//         console.error('读取文件失败:', error);
//         return null;
//     }
// }
// function getFileContent() {
// 	return readExampleFile();
// }

// function getVariable() {
// 	return `Student`;
// }

// function getProtoChain() {
// 	const file = getFileContent();
// 	const varible = getVariable();
// 	const funName = "protoFun";
// 	const suffix = `
// try{
// function ${funName}(obj) {

//     if (obj == null) return JSON.stringify({ ownProperties: {}, prototypeProperties: {} });
    
//     // 获取对象自身的所有属性（包括Symbol属性）
//     function getAllProperties(target) {
//         const result = {};
        
//         // 获取字符串属性名（包括不可枚举的）
//         const stringProps = Object.getOwnPropertyNames(target);
//         // 获取Symbol属性
//         const symbolProps = Object.getOwnPropertySymbols(target);
//         // 合并所有属性键（等同于 Reflect.ownKeys(target)）
//         const allKeys = [...stringProps, ...symbolProps];
        
//         allKeys.forEach(key => {
//             try {
//                 // 获取属性描述符
//                 const descriptor = Object.getOwnPropertyDescriptor(target, key);
//                 const keyName = typeof key === 'symbol' ? key.toString() : key;
                
//                 if (descriptor) {
//                     result[keyName] = {
//                         // 属性值
//                         value: descriptor.value,
//                         // 如果是getter/setter
//                         get: descriptor.get ? '[Getter]' : undefined,
//                         set: descriptor.set ? '[Setter]' : undefined,
//                         // 属性特性
//                         writable: descriptor.writable,
//                         enumerable: descriptor.enumerable,
//                         configurable: descriptor.configurable,
//                         // 属性类型
//                         type: typeof (descriptor.value || (descriptor.get && descriptor.get())),
//                         // 是否为Symbol属性
//                         isSymbol: typeof key === 'symbol'
//                     };
                    
//                     // 清理undefined值
//                     Object.keys(result[keyName]).forEach(k => {
//                         if (result[keyName][k] === undefined) {
//                             delete result[keyName][k];
//                         }
//                     });
//                 }
//             } catch (e) {
//                 const keyName = typeof key === 'symbol' ? key.toString() : key;
//                 result[keyName] = { 
//                     value: 'undefined', 
//                     error: e.message,
//                     isSymbol: typeof key === 'symbol'
//                 };
//             }
//         });
        
//         return result;
//     }
    
//     const ownProps = getAllProperties(obj);
    
//     // 获取原型的属性
//     const prototypeProps = {};
//     const proto = Object.getPrototypeOf(obj);
//     if (proto && proto !== Object.prototype) {
//         Object.assign(prototypeProps, getAllProperties(proto));
//     }
    
//     const result = {
//         ownProperties: ownProps,
//         prototypeProperties: prototypeProps,
//         // 额外信息
//         objectInfo: {
//             constructor: obj.constructor ? obj.constructor.name : 'Unknown',
//             prototype: proto ? proto.constructor.name : 'None',
//             isExtensible: Object.isExtensible(obj),
//             isSealed: Object.isSealed(obj),
//             isFrozen: Object.isFrozen(obj)
//         }
//     };
    
//     // 如果对象有constructor属性，则添加constructor到结果中
//     if (obj.hasOwnProperty('constructor') || obj.constructor) {
//         result.constructor = obj.constructor || undefined;
//     } else {
//         result.constructor = undefined;
//     }
    
//     // 对原型进行同样的constructor操作
//     if (proto) {
//         if (proto.hasOwnProperty('constructor') || proto.constructor) {
//             result.prototypeConstructor = proto.constructor || undefined;
//         } else {
//             result.prototypeConstructor = undefined;
//         }
//     } else {
//         result.prototypeConstructor = undefined;
//     }
    
//     return JSON.stringify(result, null, 2);
// }
// } catch(e) {
// 	console.log("Err");
// }
// 	`
// 	const result = eval(`(function() {
// 		${file}
// 		${suffix}
// 		return ${funName}(${varible});
// 	})()`);
// 	return result;
// }

// console.log("FINAL: ", getProtoChain());
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "protochainvis" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('protochainvis.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from ProtoChainVis!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
