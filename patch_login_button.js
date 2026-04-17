const fs = require('fs');

let doc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', 'utf8');

const target = `            <button type="submit" class="btn" style="width:100%; margin-top:10px;"><i class="fa-solid fa-right-to-bracket"></i> ログイン</button>
        </form><i class="fa-solid fa-right-to-bracket"></i> ログイン</button>`;

const replacement = `            <button type="submit" class="btn" style="width:100%; margin-top:10px;"><i class="fa-solid fa-right-to-bracket"></i> ログイン</button>
        </form>`;

if(doc.includes(target)) {
    doc = doc.replace(target, replacement);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', doc, 'utf8');
    console.log("Fixed duplicate login button.");
} else {
    console.log("Target string not found!");
}
