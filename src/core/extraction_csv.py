import pandas as pd
import sqlite3
import os

#paths files
print("start extraction_csv.py")
PATH_csv = 'data/raw/fluxodecaixa.xlsx'
PATH_db = 'data/financas.db'

#reading and cleaning file
df = pd.read_excel(PATH_csv, engine='openpyxl', sheet_name=0, header=0)
print("Colunas que o Python achou no arquivo:", df.columns.tolist())

df = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

#name columns
columns = ['date', 'description', 'category', 'type', 'value', 'investments', 'bank', 'account']

#format and rename columns
df.columns = [str(c).strip().lower() for c in df.columns]
df = df.rename(columns={
    'data': 'date',
    'subcategoria': 'description',
    'categoria': 'category',
    'tipo': 'type',
    'valor': 'value'
})

#fill missing columns
for col in columns:
    if col not in df.columns:
        df[col] = None
df_final = df[columns].copy()

#format date
df_final['date'] = pd.to_datetime(df_final['date'], dayfirst=True, errors='coerce').dt.strftime('%Y-%m-%d')

#format numbers
if df_final['value'].dtype == 'object':
    df_final['value'] = df_final['value'].astype(str).str.replace('.', '', regex=False).str.replace(',', '.', regex=False)
df_final['value'] = pd.to_numeric(df_final['value'], errors='coerce')

#logs
print("Preview:")
print(df_final.head())
print("\nNulls:")
print(df_final.isnull().sum())

#save to db
os.makedirs('data', exist_ok=True)

with sqlite3.connect(PATH_db) as conn:
    df_final.to_sql('fluxo', conn, if_exists='replace', index=False)

print(f"{len(df_final)} lines saved in financas.db.")