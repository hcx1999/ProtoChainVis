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
exports.getProtoChain = getProtoChain;
const ts = __importStar(require("typescript"));
function getFileContent(editor) {
    if (editor) {
        console.log("active editor!");
        return editor.document.getText();
    }
    return "";
}
function separateImportsAndCode(code) {
    const lines = code.split('\n');
    const imports = [];
    const codeLines = [];
    let inMultilineComment = false;
    for (const line of lines) {
        const trimmedLine = line.trim();
        // 处理多行注释
        if (trimmedLine.includes('/*')) {
            inMultilineComment = true;
        }
        if (trimmedLine.includes('*/')) {
            inMultilineComment = false;
            codeLines.push(line);
            continue;
        }
        if (inMultilineComment) {
            codeLines.push(line);
            continue;
        }
        // 跳过单行注释和空行
        if (trimmedLine.startsWith('//') || trimmedLine === '') {
            codeLines.push(line);
            continue;
        }
        // 检测 import 语句
        if (trimmedLine.startsWith('import ') ||
            trimmedLine.startsWith('export ') ||
            trimmedLine.startsWith('const ') && trimmedLine.includes('require(') ||
            trimmedLine.startsWith('let ') && trimmedLine.includes('require(') ||
            trimmedLine.startsWith('var ') && trimmedLine.includes('require(')) {
            imports.push(line);
        }
        else {
            codeLines.push(line);
        }
    }
    return {
        imports: imports.join('\n'),
        codeWithoutImports: codeLines.join('\n')
    };
}
function createModuleMockCode(imports) {
    if (!imports.trim()) {
        return '';
    }
    // 创建模块模拟代码
    const mockCode = `
        // 模拟模块系统
        const module = { exports: {} };
        const exports = module.exports;
        const require = (moduleName) => {
            // 模拟常用模块
            if (moduleName === 'fs' || moduleName === 'path' || moduleName === 'util') {
                return {};
            }
            // 对于其他模块，返回空对象
            console.warn('模拟模块:', moduleName);
            return {};
        };
        
        // 处理编译后的 imports
        ${imports}
    `;
    return mockCode;
}
function compileTypeScriptToJS(code, fileName) {
    try {
        console.log("开始编译代码，文件名:", fileName);
        // 分离 import 语句和其他代码
        const { imports, codeWithoutImports } = separateImportsAndCode(code);
        console.log("检测到的 imports:", imports);
        // TypeScript 编译选项
        const compilerOptions = {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            strict: false,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: false,
            moduleResolution: ts.ModuleResolutionKind.Node16,
            allowJs: true,
            declaration: false,
            outDir: undefined,
            rootDir: undefined,
            sourceMap: false,
            // 处理现代 JavaScript 特性
            downlevelIteration: true,
            experimentalDecorators: true,
            emitDecoratorMetadata: true
        };
        // 判断文件类型并设置相应的编译选项
        const isTypeScript = fileName.endsWith('.ts') || fileName.endsWith('.tsx');
        if (!isTypeScript) {
            compilerOptions.allowJs = true;
            compilerOptions.checkJs = false;
            console.log("检测到 JavaScript 文件，使用 JS 编译模式");
        }
        else {
            console.log("检测到 TypeScript 文件，使用 TS 编译模式");
        }
        // 只编译非 import 的代码部分
        const compiledCodeOnly = ts.transpile(codeWithoutImports, compilerOptions, fileName);
        // 编译 import 语句（如果有的话）
        let compiledImports = '';
        if (imports.trim()) {
            compiledImports = ts.transpile(imports, compilerOptions, fileName);
        }
        console.log("编译成功");
        console.log("编译后的 imports:", compiledImports);
        console.log("编译后的代码长度:", compiledCodeOnly.length);
        return {
            imports: compiledImports,
            compiledCode: compiledCodeOnly
        };
    }
    catch (error) {
        console.error("TypeScript 编译错误:", error);
        console.log("编译失败，返回原始代码");
        // 如果编译失败，仍然尝试分离 import
        const { imports, codeWithoutImports } = separateImportsAndCode(code);
        return {
            imports: imports,
            compiledCode: codeWithoutImports
        };
    }
}
function getProtoChain(varible, editor) {
    if (editor === undefined) {
        return "无活动编辑器";
    }
    // 获取原始代码和文件名
    const originalCode = getFileContent(editor);
    const fileName = editor.document.fileName;
    // 编译代码并分离 imports
    const { imports, compiledCode } = compileTypeScriptToJS(originalCode, fileName);
    const funName = "protoFun";
    const suffix = `

function ${funName}(obj) {
    let result = [];
    // 判断是不是原子类型
    if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
        return "变量为原子类型";
    }
    // 循环查找原型链，直到遇到null
    let current_obj = obj;
    while (current_obj !== null) {
        let stringProps = Object.getOwnPropertyNames(current_obj);
        let properties = [];
        let methods = [];
        // 区分属性和方法
        for (let p of stringProps) {
            if (p === 'caller' || p === 'callee' || p === 'arguments') {
                properties.push(p);
                continue;
            }
            if (typeof current_obj[p] === 'function') {
                methods.push(p);
            }
            else {
                properties.push(p);
            }
        }
        // 将原型链上对象的信息储存到数组中
        result.push(
            {
                properties,
                methods,
                constructor: current_obj.constructor ? current_obj.constructor.name : undefined
            }
        );
        current_obj = Object.getPrototypeOf(current_obj);
    }
    result.push(null);
    return result;
};
`;
    // 创建模块模拟代码
    const moduleMockCode = createModuleMockCode(imports);
    // 构建完整的执行代码：模块模拟 + 用户代码 + 分析函数
    const fullExecutionCode = `
        ${moduleMockCode}
        ${compiledCode}
        ${suffix}
        return ${funName}(${varible});
    `;
    try {
        console.log("执行代码结构:");
        console.log("1. 模块模拟代码长度:", moduleMockCode.length);
        console.log("2. 用户代码长度:", compiledCode.length);
        console.log("3. 分析函数长度:", suffix.length);
        const executeCode = new Function(fullExecutionCode);
        const result = executeCode();
        console.log("分析结果:", result);
        return result;
    }
    catch (e) {
        console.error("执行错误:", e);
        console.log("尝试使用原始代码（无 import 处理）...");
        // 如果编译后的代码执行失败，尝试使用原始代码但移除 import
        try {
            const { codeWithoutImports } = separateImportsAndCode(originalCode);
            const fallbackExecuteCode = new Function(`
                ${codeWithoutImports}
                ${suffix}
                return ${funName}(${varible});
            `);
            const fallbackResult = fallbackExecuteCode();
            console.log("原始代码（移除 import）执行成功:", fallbackResult);
            return fallbackResult;
        }
        catch (fallbackError) {
            console.error("原始代码执行也失败:", fallbackError);
            const errorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            const originalErrorMsg = e instanceof Error ? e.message : String(e);
            return `错误：代码编译或执行失败。
            原错误: ${originalErrorMsg}
            回退错误: ${errorMsg}
            请检查变量定义和语法，或者尝试移除不必要的 import 语句。`;
        }
    }
}
//# sourceMappingURL=getProtoChain.js.map