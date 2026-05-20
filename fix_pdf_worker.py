import codecs
with codecs.open('manualhelp.html', 'r', 'utf-8') as f:
    text = f.read()

old_code = "pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';"
new_code = "pdfjsLib.GlobalWorkerOptions.disableWorker = true; // Use main thread to avoid CORS on S3 static hosting"

if old_code in text:
    text = text.replace(old_code, new_code)
    with codecs.open('manualhelp.html', 'w', 'utf-8') as f:
        f.write(text)
    print('Fixed manualhelp.html pdf worker')
else:
    print('Code not found')
