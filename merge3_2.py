import pandas as pd
import re

# Lade beide CSV-Dateien
df1 = pd.read_csv('superheroes_data.csv')  # Erster Datensatz
df2 = pd.read_csv('superheroes_nlp_dataset.csv')  # Zweiter Datensatz

# Funktion zur Formatierung von Größe und Gewicht
def format_height_weight(value):
    if pd.isna(value) or value == "-" or value.strip() == "":  # Ignoriere leere oder "-" Werte
        return "-"
    if "•" in value:  # Splitte bei "•" (z. B. '6\'0" • 183 cm')
        parts = [part.strip() for part in value.split("•")]
        return f'["{parts[0]}", "{parts[1]}"]'
    return value  # Rückgabe unveränderter Werte, falls keine Bereinigung nötig ist

# Funktion zur Formatierung der relatives-Spalte
def format_relatives(value):
    if pd.isna(value) or value == "-" or value.strip() == "":  # Ignoriere leere oder "-" Werte
        return "-"
    # Prüfen und Komma nach ")" einfügen, falls nötig
    formatted_value = re.sub(r'\)\s*(?=\w)', r'), ', value)
    return formatted_value

# Wende die Bereinigungsfunktion auf die entsprechenden Spalten an
if 'height' in df2.columns:
    df2['height'] = df2['height'].apply(format_height_weight)
if 'weight' in df2.columns:
    df2['weight'] = df2['weight'].apply(format_height_weight)
if 'relatives' in df2.columns:
    df2['relatives'] = df2['relatives'].apply(format_relatives)

# Setze fehlende Werte in allen Spalten auf "-"
df1 = df1.fillna("-")
df2 = df2.fillna("-")

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

# Setze fehlende Werte im zusammengeführten Datensatz auf "-"
merged_df = merged_df.fillna("-")

# Speichere das Ergebnis in einer neuen CSV-Datei
merged_df.to_csv('merged_data3_2.csv', index=False)

# Zeige die ersten Zeilen des erweiterten Datensatzes
print("Erweiterter Datensatz:")
print(merged_df.head())
