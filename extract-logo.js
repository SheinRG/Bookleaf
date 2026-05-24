const fs = require('fs');
const content = fs.readFileSync('stitch_bookleaf_author_admin_portal (2)/code.html', 'utf8');
const match = content.match(/data:image\/png;base64,([^"]+)/);
if(match) {
  fs.writeFileSync('client/public/logo.png', Buffer.from(match[1], 'base64'));
  console.log('Saved logo.png');
} else {
  console.log('No base64 found');
}
