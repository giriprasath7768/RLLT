import pandas as pd
import sys

def main():
    file_path = "sampledata/Bookmaster.xlsx"
    try:
        df = pd.read_excel(file_path, nrows=5)
        print("--- Bookmaster.xlsx Headers ---")
        print(df.columns.tolist())
        print("\n--- First 5 rows ---")
        for index, row in df.iterrows():
            print(row.to_dict())
    except Exception as e:
        print(f"Error reading Excel file: {e}")

if __name__ == "__main__":
    main()
