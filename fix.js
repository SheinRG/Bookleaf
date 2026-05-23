const fs = require('fs');

const files = ['client/src/app/admin/page.tsx', 'client/src/app/author/page.tsx'];

files.forEach(f => {
  let txt = fs.readFileSync(f, 'utf8');
  // replace \` with `
  txt = txt.replace(/\\`/g, '`');
  // replace \$ with $
  txt = txt.replace(/\\\$/g, '$');
  fs.writeFileSync(f, txt);
});
console.log('Fixed JSX escapes');
