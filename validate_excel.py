import pandas as pd
import sys

def main():
    try:
        excel_path = 'i:/RLLT/Webapp/sampledata/masterchartdata.xlsx'
        df1 = pd.read_excel(excel_path, sheet_name=0)
        df2 = pd.read_excel(excel_path, sheet_name=1)
        
        df1.columns = df1.columns.str.strip()
        df2.columns = df2.columns.str.strip()

        df1['BookName'] = df1['BookName'].astype(str).str.strip()
        df2['Book Name'] = df2['Book Name'].astype(str).str.strip()

        book_verses_sheet1 = df1.set_index('BookName')['Total Vers'].to_dict()
        book_verses_sheet2 = df2.groupby('Book Name')['Verse Count'].sum().to_dict()

        discrepancies = []
        for book, verses_1 in book_verses_sheet1.items():
            verses_2 = book_verses_sheet2.get(book, 0)
            if float(verses_1) != float(verses_2):
                discrepancies.append(f"Book: {book} | Sheet1 Total: {verses_1} | Sheet2 Sum: {verses_2}")

        print(f"Sheet 1 Rows: {len(df1)}")
        print(f"Sheet 2 Rows: {len(df2)}")
        
        if discrepancies:
            print("DISCREPANCIES_FOUND")
            for d in discrepancies:
                print(d)
        else:
            print("VALIDATION_SUCCESSFUL")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
