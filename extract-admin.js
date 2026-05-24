const fs = require('fs');
let content = fs.readFileSync('stitch_bookleaf_author_admin_portal/code.html', 'utf8');
content = content.replace(/data:image\/png;base64,[^\"]+/g, 'LOGO_PLACEHOLDER');
fs.writeFileSync('admin_body.html', content);
