import pandas as pd
import re

# Lade CSV-Dateien
df1 = pd.read_csv('superheroes_data.csv')  
df2 = pd.read_csv('superheroes_nlp_dataset.csv') 

# formatier Größe und Gewicht
def format_height_weight(value):
    if pd.isna(value) or value == "-" or value.strip() == "":  # leere Zellen ignorieren
        return "-"
    if "•" in value:  # Splitte bei "•" (z. B. '6\'0" • 183 cm')
        parts = [part.strip() for part in value.split("•")]
        return f'["{parts[0]}", "{parts[1]}"]'
    return value  

# formatiere relatives-Spalte
def format_relatives(value):
    if pd.isna(value) or value == "-" or value.strip() == "":  # leere Zellen ignorieren
        return "-"
    # füge , nach ) ein, da zweiter Datensatz anders formatiert ist
    formatted_value = re.sub(r'\)\s*(?=\w)', r'), ', value)
    return formatted_value

# führe Formatierung aus, wenn Spalte existiert
if 'height' in df2.columns:
    df2['height'] = df2['height'].apply(format_height_weight)
if 'weight' in df2.columns:
    df2['weight'] = df2['weight'].apply(format_height_weight)
if 'relatives' in df2.columns:
    df2['relatives'] = df2['relatives'].apply(format_relatives)

# leeren Zellen mit - füllen
df1 = df1.fillna("-")
df2 = df2.fillna("-")

# gleiche spalten identifizieren und entferne alle unterschiedlichen aus df2
common_columns = df1.columns.intersection(df2.columns)
df2_filtered = df2[common_columns]

# df2 hat keine IDs uns soll beginnend ab der letzten ID von df1 (731) beginnen
max_id = df1['id'].max()
new_id_start = max_id + 1 if max_id >= 731 else 732  

# neue Helden, die nicht in df1 sind hinzufügen
new_heroes = df2_filtered[~df2_filtered['name'].isin(df1['name'])]

# ID zuweisen
new_heroes['id'] = range(new_id_start, new_id_start + len(new_heroes))

# neue Helden in df1 hinzufügen
merged_df = pd.concat([df1, new_heroes], ignore_index=True)

# fehlende Werte auf default leer setzen
merged_df = merged_df.fillna("-")

# neue csv Datei erstellen
merged_df.to_csv('merged_data3_2.csv', index=False)

print("Erweiterter Datensatz:")
print(merged_df.head())
