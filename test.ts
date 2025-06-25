import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function readExampleFile(context?: vscode.ExtensionContext) {
    console.log("TEST");
    try {
        let filePath: string;
        filePath = path.join(__dirname + "/out", 'example.js');
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error('读取文件失败:', error);
        return "Err";
    }
}

function getFileContent() {
    return readExampleFile();
}

function getVariable() {
    return `Student`;
}

function getProtoChain() {
    const file = getFileContent();
    const varible = getVariable();
    const funName = "protoFun";
    const suffix = `
try{
function ${funName}(obj) {

    if (obj == null) return JSON.stringify({ ownProperties: {}, prototypeProperties: {} });
    
    // 获取对象自身的所有属性（包括Symbol属性）
    function getAllProperties(target) {
        const result = {};
        
        // 获取字符串属性名（包括不可枚举的）
        const stringProps = Object.getOwnPropertyNames(target);
        // 获取Symbol属性
        const symbolProps = Object.getOwnPropertySymbols(target);
        // 合并所有属性键（等同于 Reflect.ownKeys(target)）
        const allKeys = [...stringProps, ...symbolProps];
        
        allKeys.forEach(key => {
            try {
                // 获取属性描述符
                const descriptor = Object.getOwnPropertyDescriptor(target, key);
                const keyName = typeof key === 'symbol' ? key.toString() : key;
                
                if (descriptor) {
                    result[keyName] = {
                        // 属性值
                        value: descriptor.value,
                        // 如果是getter/setter
                        get: descriptor.get ? '[Getter]' : undefined,
                        set: descriptor.set ? '[Setter]' : undefined,
                        // 属性特性
                        writable: descriptor.writable,
                        enumerable: descriptor.enumerable,
                        configurable: descriptor.configurable,
                        // 属性类型
                        type: typeof (descriptor.value || (descriptor.get && descriptor.get())),
                        // 是否为Symbol属性
                        isSymbol: typeof key === 'symbol'
                    };
                    
                    // 清理undefined值
                    Object.keys(result[keyName]).forEach(k => {
                        if (result[keyName][k] === undefined) {
                            delete result[keyName][k];
                        }
                    });
                }
            } catch (e) {
                const keyName = typeof key === 'symbol' ? key.toString() : key;
                result[keyName] = { 
                    value: 'undefined', 
                    error: e.message,
                    isSymbol: typeof key === 'symbol'
                };
            }
        });
        
        return result;
    }
    
    const ownProps = getAllProperties(obj);
    
    // 获取原型的属性
    const prototypeProps = {};
    const proto = Object.getPrototypeOf(obj);
    if (proto && proto !== Object.prototype) {
        Object.assign(prototypeProps, getAllProperties(proto));
    }
    
    const result = {
        ownProperties: ownProps,
        prototypeProperties: prototypeProps,
        // 额外信息
        objectInfo: {
            constructor: obj.constructor ? obj.constructor.name : 'Unknown',
            prototype: proto ? proto.constructor.name : 'None',
            isExtensible: Object.isExtensible(obj),
            isSealed: Object.isSealed(obj),
            isFrozen: Object.isFrozen(obj)
        }
    };
    
    // 如果对象有constructor属性，则添加constructor到结果中
    if (obj.hasOwnProperty('constructor') || obj.constructor) {
        result.constructor = obj.constructor || undefined;
    } else {
        result.constructor = undefined;
    }
    
    // 对原型进行同样的constructor操作
    if (proto) {
        if (proto.hasOwnProperty('constructor') || proto.constructor) {
            result.prototypeConstructor = proto.constructor || undefined;
        } else {
            result.prototypeConstructor = undefined;
        }
    } else {
        result.prototypeConstructor = undefined;
    }
    
    return JSON.stringify(result, null, 2);
}
} catch(e) {
    console.log("Err");
}`;

    const executeCode = new Function(`
        ${file}
        ${suffix}
        return ${funName}(${varible});
    `);
    
    try {
        const result = executeCode();
        console.log("RESULT: ", result);
        return result;
    } catch (e) {
        console.error("执行错误:", e);
        return "Run Failure";
    }
}

console.log("TEST: ", getProtoChain());