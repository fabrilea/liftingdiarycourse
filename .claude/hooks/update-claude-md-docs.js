#!/usr/bin/env node
// Hook: PostToolUse on Write/Edit
// When a new .md file is written inside docs/, add it to CLAUDE.md's docs list.

const fs = require('fs');
const path = require('path');

let data = '';
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input && input.tool_input.file_path) || '';

    // Normalize to forward slashes
    const normalized = filePath.replace(/\\/g, '/');

    // Match files directly inside docs/ (not nested)
    const match = normalized.match(/(?:^|.*\/)docs\/([^/]+\.md)$/);
    if (!match) process.exit(0);

    const docEntry = '/docs/' + match[1];

    const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');
    const content = fs.readFileSync(claudeMdPath, 'utf8');

    // Already referenced — nothing to do
    if (content.includes(docEntry)) process.exit(0);

    // Find the last "- /docs/..." line and insert after it
    const lines = content.split('\n');
    let lastDocLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^- \/docs\//.test(lines[i])) lastDocLineIdx = i;
    }

    if (lastDocLineIdx === -1) process.exit(0); // can't find insertion point

    lines.splice(lastDocLineIdx + 1, 0, '- ' + docEntry);
    fs.writeFileSync(claudeMdPath, lines.join('\n'));

    process.stdout.write(JSON.stringify({
      systemMessage: `CLAUDE.md updated: added ${docEntry} to docs reference list.`
    }));
  } catch (e) {
    // Silent failure — don't block the tool
    process.exit(0);
  }
});
