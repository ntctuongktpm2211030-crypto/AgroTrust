import fs from 'fs';
const content = fs.readFileSync('src/index.css', 'utf8');
let stack = [];
let errors = [];
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{') {
      stack.push({ line: i + 1, char: j + 1 });
    } else if (char === '}') {
      if (stack.length === 0) {
        errors.push(`Extra closing brace at line ${i + 1}, col ${j + 1}`);
      } else {
        stack.pop();
      }
    }
  }
}

while (stack.length > 0) {
  const top = stack.pop();
  errors.push(`Unclosed brace starting at line ${top.line}, col ${top.line}`);
}

if (errors.length === 0) {
  console.log('Braces are balanced.');
} else {
  console.log('Brace errors found:');
  errors.forEach(e => console.log(e));
}
