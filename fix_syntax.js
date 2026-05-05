const fs = require('fs');

const files = [
    'c:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html',
    'c:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html'
];

for (const fp of files) {
    let content = fs.readFileSync(fp, 'utf8');

    // The problematic block looks like:
    // if (file.type.startsWith('video/')) {
    //     try {
    //         // Duration validation removed
    // } catch (e) {

    // Let's replace it with a properly closed block.
    content = content.replace(
        /if \(file\.type\.startsWith\('video\/'\)\) \{\s*try \{\s*\/\/\s*Duration validation removed\s*\} catch \(e\) \{\s*console\.warn\([\s\S]*?\);\s*\/\/ Do not block upload, let server handle it\s*\}\s*\}/g,
        "if (file.type.startsWith('video/')) { /* validation removed */ }"
    );

    // Wait, let's just do a more forgiving regex
    content = content.replace(
        /if \(file\.type\.startsWith\('video\/'\)\) \{\s*try \{\s*\/\/\s*Duration validation removed\s*\} catch \(e\) \{[^\}]*\}\s*\}/g,
        "if (file.type.startsWith('video/')) { /* validation removed */ }"
    );

    content = content.replace(
        /if \(file\.type\.startsWith\('video\/'\)\) \{\s*try \{\s*\/\/\s*Duration validation removed\s*\} catch \(e\) \{\s*console\.error\("File Read Error:", e\);\s*\}\s*\}/g,
        "if (file.type.startsWith('video/')) { /* validation removed */ }"
    );

    // Some versions have Swal.fire catch
    content = content.replace(
        /if \(file\.type\.startsWith\('video\/'\)\) \{\s*try \{\s*\/\/\s*Duration validation removed\s*\} catch \(e\) \{\s*Swal\.fire[^\}]*\}\s*\}/g,
        "if (file.type.startsWith('video/')) { /* validation removed */ }"
    );

    fs.writeFileSync(fp, content);
    console.log("Patched", fp);
}
