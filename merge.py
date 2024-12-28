import pandas as pd

# Lade beide CSV-Dateien
df1 = pd.read_csv('superheroes_data.csv')  # Erster Datensatz
df2 = pd.read_csv('comic_characters.csv')  # Zweiter Datensatz

# Führe einen Left Join aus, um nur vorhandene Helden aus df1 zu erweitern
# Angenommen, die gemeinsame Spalte heißt 'Superhelden-Name'
# Und 'Beliebtheit' ist die neue Spalte aus df2
merged_df = df1.merge(df2[['name', 'Appearances']], 
                      on='name', 
                      how='left')

# Speichere das Ergebnis in einer neuen CSV-Datei
merged_df.to_csv('merged_data.csv', index=False)

# Zeige die ersten Zeilen des erweiterten Datensatzes
print("Erweiterter Datensatz:")
print(merged_df.head())



# null setzen falls kein wert vorhanden