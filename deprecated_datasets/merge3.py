import pandas as pd

# Lade beide CSV-Dateien
df1 = pd.read_csv('superheroes_data.csv')  # Erster Datensatz
df2 = pd.read_csv('superheroes_nlp_dataset.csv')  # Zweiter Datensatz

# Identifiziere die Spalten, die in beiden Datensätzen vorhanden sind
common_columns = df1.columns.intersection(df2.columns)

# Filtere df2, um nur die Spalten zu behalten, die auch in df1 existieren
df2_filtered = df2[common_columns]

# Erstelle eine neue id für alle Helden aus df2, die noch nicht in df1 sind
# Maximalwert der id in df1 (um sicherzustellen, dass die neuen ids ab 732 beginnen)
max_id = df1['id'].max()
new_id_start = max_id + 1 if max_id >= 731 else 732  # Ab 732 oder der nächsten freien id

# Filtere die Helden aus df2, die noch nicht in df1 sind (basierend auf 'name')
new_heroes = df2_filtered[~df2_filtered['name'].isin(df1['name'])]

# Weisen Sie neuen Helden eine id zu
new_heroes['id'] = range(new_id_start, new_id_start + len(new_heroes))

# Füge die neuen Helden zu df1 hinzu
merged_df = pd.concat([df1, new_heroes], ignore_index=True)

# Speichere das Ergebnis in einer neuen CSV-Datei
merged_df.to_csv('merged_data_with_new_ids.csv', index=False)

# Zeige die ersten Zeilen des erweiterten Datensatzes
print("Erweiterter Datensatz:")
print(merged_df.head())
