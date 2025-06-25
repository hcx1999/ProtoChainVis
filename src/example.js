// 原型链示例程序

// 1. 构造函数和原型
function Person(name, age) {
    this.name = name;
    this.age = age;
}

// 在原型上添加方法
Person.prototype.sayHello = function() {
    console.log(`Hello, I'm ${this.name}, ${this.age} years old.`);
};

Person.prototype.getInfo = function() {
    return `Name: ${this.name}, Age: ${this.age}`;
};

// 2. 创建子类构造函数
function Student(name, age, school) {
    Person.call(this, name, age); // 调用父类构造函数
    this.school = school;
}

// 3. 设置原型链继承
Student.prototype = Object.create(Person.prototype);
Student.prototype.constructor = Student;

// 4. 在子类原型上添加方法
Student.prototype.study = function() {
    console.log(`${this.name} is studying at ${this.school}`);
};

// 重写父类方法
Student.prototype.getInfo = function() {
    return `Name: ${this.name}, Age: ${this.age}, School: ${this.school}`;
};

// 5. 测试代码
console.log('=== 原型链测试 ===');

// 创建实例
const person1 = new Person('张三', 25);
const student1 = new Student('李四', 20, '清华大学');

// 测试方法调用
person1.sayHello();
student1.sayHello(); // 继承自Person
student1.study();

console.log(person1.getInfo());
console.log(student1.getInfo()); // 重写的方法

// 6. 原型链验证
console.log('\n=== 原型链验证 ===');
console.log('student1 instanceof Student:', student1 instanceof Student);
console.log('student1 instanceof Person:', student1 instanceof Person);
console.log('student1 instanceof Object:', student1 instanceof Object);

// 查看原型链
console.log('\n=== 原型链结构 ===');
console.log('student1.__proto__ === Student.prototype:', student1.__proto__ === Student.prototype);
console.log('Student.prototype.__proto__ === Person.prototype:', Student.prototype.__proto__ === Person.prototype);
console.log('Person.prototype.__proto__ === Object.prototype:', Person.prototype.__proto__ === Object.prototype);

// 7. 属性查找过程演示
console.log('\n=== 属性查找过程 ===');
console.log('student1.name:', student1.name); // 自身属性
console.log('student1.sayHello:', typeof student1.sayHello); // 从Person.prototype继承
console.log('student1.toString:', typeof student1.toString); // 从Object.prototype继承