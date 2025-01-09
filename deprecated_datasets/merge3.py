import pandas as pd


df1 = pd.read_csv('superheroes_data.csv') 
df2 = pd.read_csv('superheroes_nlp_dataset.csv')  

common_columns = df1.columns.intersection(df2.columns)

df2_filtered = df2[common_columns]

max_id = df1['id'].max()
new_id_start = max_id + 1 if max_id >= 731 else 732  

new_heroes = df2_filtered[~df2_filtered['name'].isin(df1['name'])]

new_heroes['id'] = range(new_id_start, new_id_start + len(new_heroes))

merged_df = pd.concat([df1, new_heroes], ignore_index=True)

merged_df.to_csv('merged_data_with_new_ids.csv', index=False)

print("Erweiterter Datensatz:")
print(merged_df.head())
