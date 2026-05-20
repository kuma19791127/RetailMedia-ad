import codecs

def convert_to_sjis(filepath):
    try:
        # Read the file as UTF-8
        with codecs.open(filepath, 'r', 'utf-8') as f:
            text = f.read()
            
        # Write the file as Shift-JIS (cp932)
        with codecs.open(filepath, 'w', 'cp932', errors='replace') as f:
            f.write(text)
        print(f"Successfully converted {filepath} to Shift-JIS")
    except Exception as e:
        print(f"Failed to convert {filepath}: {e}")

convert_to_sjis('setup_retail_signage.bat')
convert_to_sjis('remove_retail_signage.bat')
