# Superhero Analytics

Superhero Analytics is an interactive web tool for visualizing and analyzing superhero data. It provides a user-friendly interface with various visualization methods and interactions to explore the world of superheroes in depth. With this tool, users can examine superhero attributes, compare heroes, analyze relationships, and more, making it a powerful resource for fans and analysts alike.

---

## Table of Contents

1. [Setup and Installation](#setup-and-installation)
2. [Data Overview](#data-overview)
3. [Usage](#usage)
   1. [Attributes](#1-attributes)
   2. [Comparison](#2-comparison)
   3. [Relatives](#3-relatives)
   4. [Groups](#4-groups)
   5. [Bubble Chart](#5-bubble-chart)
   6. [Hero Map](#6-hero-map)
   7. [Timeline](#7-timeline)
4. [Participants](#participants)

---

## Setup and Installation

### Prerequisites
- A modern web browser (e.g., Chrome, Firefox, Edge, Safari).
- A locally hosted or online server for serving `HTML`, `CSS`, and `JavaScript` files.

### Installation Steps
1. Clone or download the repository:
   ```bash
   git clone https://github.com/21caog1bif/InfoVisVA-Superhero-Analytics.git
   ```

2. Place the `superheroes_data.csv` file in the same directory as `index.html`.

3. Start a simple HTTP server:
   ```bash
   python -m http.server
   ```

4. Open `http://localhost:8000` in your web browser.

---

## Data Overview

The `superheroes_data.csv` file should include the following columns:

| Column              | Description                                |
|---------------------|--------------------------------------------|
| id                  | Unique ID of the superhero                |
| name                | Name of the superhero                     |
| intelligence        | Intelligence value (numeric)              |
| strength            | Strength value (numeric)                  |
| speed               | Speed value (numeric)                     |
| durability          | Durability value (numeric)                |
| power               | Power value (numeric)                     |
| combat              | Combat skill value (numeric)              |
| ...                 | Additional attributes as per documentation|

---

## Usage

Superhero Analytics is designed for intuitive usage. Users can explore data through various tabs, each offering unique visualizations and filtering options. The interface includes a filter sidebar on the left, a toggle for switching between dark and light modes, and navigation tabs at the top. In the following, each tab is described in detail.

### 1. Attributes
- **Description**: Visualizes attributes (e.g., intelligence, strength) in a bar chart.
- **Interactions**:
  - Select an attribute from the dropdown menu.
  - Use filters to narrow down data by race, gender, alignment, height, or weight.

### 2. Comparison
- **Description**: Compares two superheroes using a radar chart.
- **Interactions**:
  - Select two heroes from the dropdown menus.
  - View additional details such as images, race, height, and more in a table.

### 3. Relatives
- **Description**: Visualizes the family connections of a superhero.
- **Interactions**:
  - Select a hero to view their relationships.
  - Use the timeline in the sidebar to revisit previously explored heroes.

### 4. Groups
- **Description**: Displays groups of superheroes and their members.
- **Interactions**:
  - Select a group or search for a hero to view specific details.
  - Use the timeline and network statistics (e.g., number of nodes and links).
  - Click on a hero to seamlessly navigate to the Relatives tab, displaying the selected hero’s connections.

### 5. Bubble Chart
- **Description**: Visualizes attributes in a bubble chart.
- **Interactions**:
  - Choose axes and attributes for the visualization.
  - Use filters to focus on specific heroes.

### 6. Hero Map
- **Description**: Displays the geographical distribution of heroes (birthplace or base location).
- **Interactions**:
  - Choose whether to display the birthplace or base location.
  - Filter by alignment (good, bad, neutral).
  - Group locations by country.

### 7. Timeline
- **Description**: Displays a chronological timeline highlighting the first appearances of superheroes.
- **Interactions**:
  - Zoom in and out to focus on specific time periods or view the entire timeline.
  - Hover over events to see detailed information, including the superhero's name, first appearance year, and associated comic volume.
  - Drag or scroll to navigate through different time periods seamlessly.

---

## Participants

This project was developed as the final assignment for the module **InfoVisVA** at the **Hochschule für Technik Stuttgart**. The following participants contributed to its creation:

- **Oguzhan Cantürk** (21caog1bif)
- **Sinan Percen** (21pesi1bif)
- **Thomas Gastens** (21gath1bif)
- **Levi Grausam** (11grle1bif)

We acknowledge and appreciate the efforts of all team members in making this project a success.

