const fs = require('fs');
const path = require('path');

const targetDir = __dirname;
const mappingFile = path.join(targetDir, 'rename_map.json');

// 除外するファイル
const excludeFiles = ['rename_videos.js', 'restore_videos.js', 'rename_map.json', '動画一括圧縮_常時監視モード.bat'];

function renameFiles() {
  try {
    const files = fs.readdirSync(targetDir);
    const mp4Files = files.filter(file => {
      return file.toLowerCase().endsWith('.mp4') && !excludeFiles.includes(file);
    });

    const mapping = {};
    let counter = 1;

    mp4Files.forEach(oldName => {
      const ext = path.extname(oldName);
      const newName = `video_${String(counter).padStart(2, '0')}${ext}`;
      
      const oldPath = path.join(targetDir, oldName);
      const newPath = path.join(targetDir, newName);

      fs.renameSync(oldPath, newPath);
      mapping[newName] = oldName;
      console.log(`Renamed: "${oldName}" -> "${newName}"`);
      counter++;
    });

    fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2), 'utf-8');
    console.log(`\nSuccessfully renamed ${mp4Files.length} files.`);
    console.log(`Mapping saved to rename_map.json`);
  } catch (error) {
    console.error('Error during renaming:', error);
  }
}

renameFiles();
