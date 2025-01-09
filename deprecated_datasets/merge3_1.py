import pandas as pd
import re

df1 = pd.read_csv('superheroes_data.csv') 
df2 = pd.read_csv('superheroes_nlp_dataset.csv')  

def format_height_weight(value):
    if pd.isna(value) or value == "-" or value.strip() == "":  
        return "-"
    if "•" in value:  
        parts = [part.strip() for part in value.split("•")]
        return f'["{parts[0]}", "{parts[1]}"]'
    return value  

if 'height' in df2.columns:
    df2['height'] = df2['height'].apply(format_height_weight)
if 'weight' in df2.columns:
    df2['weight'] = df2['weight'].apply(format_height_weight)

df1 = df1.fillna("-")
df2 = df2.fillna("-")

common_columns = df1.columns.intersection(df2.columns)

df2_filtered = df2[common_columns]

max_id = df1['id'].max()
new_id_start = max_id + 1 if max_id >= 731 else 732 
new_heroes = df2_filtered[~df2_filtered['name'].isin(df1['name'])]
new_heroes['id'] = range(new_id_start, new_id_start + len(new_heroes))
merged_df = pd.concat([df1, new_heroes], ignore_index=True)
merged_df = merged_df.fillna("-")
merged_df.to_csv('merged_data3_1.csv', index=False)

print("Erweiterter Datensatz:")
print(merged_df.head())
