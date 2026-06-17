const fs = require('fs');
const path = require('path');

const targetDir = __dirname;
const mappingFile = path.join(targetDir, 'rename_map.json');

function restoreFiles() {
  try {
    if (!fs.existsSync(mappingFile)) {
      console.error('Error: rename_map.json not found!');
      return;
    }

    const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
    let counter = 0;

    for (const [newName, oldName] of Object.entries(mapping)) {
      const newPath = path.join(targetDir, newName);
      const oldPath = path.join(targetDir, oldName);

      if (fs.existsSync(newPath)) {
        fs.renameSync(newPath, oldPath);
        console.log(`Restored: "${newName}" -> "${oldName}"`);
        counter++;
      } else {
        console.warn(`Warning: file ${newName} not found, skipping.`);
      }
    }

    // 復元が完了したらマッピングファイルを削除する（または残すか選択）
    fs.unlinkSync(mappingFile);
    console.log(`\nSuccessfully restored ${counter} files and deleted rename_map.json.`);
  } catch (error) {
    console.error('Error during restoration:', error);
  }
}

restoreFiles();
