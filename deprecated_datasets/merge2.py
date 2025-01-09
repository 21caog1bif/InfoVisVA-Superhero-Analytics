import pandas as pd

df1 = pd.read_csv('superheroes_data.csv')  
df2 = pd.read_csv('comic_characters.csv')

merged_df = df1.merge(df2[['name', 'First_appeared']], 
                      on='name', 
                      how='left')

merged_df.to_csv('merged_data2.csv', index=False)

print("Erweiterter Datensatz:")
print(merged_df.head())
