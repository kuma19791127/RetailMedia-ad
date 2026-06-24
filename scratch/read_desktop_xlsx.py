import openpyxl
import os
import glob

def list_desktop_excel():
    desktop_path = r"C:\Users\one\Desktop"
    xlsx_files = glob.glob(os.path.join(desktop_path, "*.xlsx"))
    
    print("--- Desktop Excel Files ---")
    for f in xlsx_files:
        basename = os.path.basename(f)
        size = os.path.getsize(f)
        print(f"File: {basename} ({size} bytes)")
        try:
            wb = openpyxl.load_workbook(f, read_only=True)
            print(f"  Sheets: {wb.sheetnames}")
        except Exception as e:
            print(f"  Error reading sheets: {e}")

if __name__ == "__main__":
    list_desktop_excel()
