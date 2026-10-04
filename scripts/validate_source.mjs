import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root = process.cwd();
const files = [];
function walk(d) {
  for (const name of fs.readdirSync(d)) {
    const p = path.join(d, name);
    if (['node_modules', 'dist', '.git'].includes(name)) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(name)) files.push(p);
  }
}
walk(path.join(root, 'src'));
let errors = 0;
for (const file of files) {
  const r = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    fileName: file,
    reportDiagnostics: true,
  });
  for (const d of r.diagnostics ?? []) {
    errors++;
    console.error(`${file}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
  }
}
console.log(`Scanned ${files.length} TypeScript/TSX files; syntax diagnostics: ${errors}`);
process.exitCode = errors ? 1 : 0;
