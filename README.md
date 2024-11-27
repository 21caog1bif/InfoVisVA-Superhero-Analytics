
# Superhero Analytics

Superhero Analytics is a web-based visualization tool that allows users to explore and compare superhero attributes. This project provides interactive charts and detailed comparisons between superheroes, leveraging CSV data for insights.

---

## Features

- **Attribute Visualization**: 
  - View superhero attributes (e.g., Intelligence, Strength, Speed) in a bar chart format.
  - Apply various filters to refine the data, such as race, gender, alignment, height, and weight.
  
- **Superhero Comparison**:
  - Compare two superheroes side-by-side with a radar chart.
  - Display additional superhero details in a table beneath the radar chart.
  - View superhero images dynamically based on the selected hero.

- **Dynamic Filters**:
  - Dropdowns for race, gender, and alignment.
  - Sliders and input fields for height and weight ranges.
  - Checkboxes for custom filters like "Can Fly" or "Strength > 50".

---

## Setup and Installation

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, or Safari).
- A local or online server to serve the `HTML`, `CSS`, and `JavaScript` files.

### Steps

1. Clone or download the repository to your local machine.
   ```bash
   git clone https://github.com/21caog1bif/InfoVisVA-Superhero-Analytics.git
   ```

2. Place the `superheroes_data.csv` file in the same directory as the `index.html` file.

3. Open a terminal in the project directory and start a simple HTTP server. For example:
   ```bash
   python -m http.server
   ```

4. Navigate to `http://localhost:8000` (or the corresponding port) in your browser.

---

## File Structure

```
Superhero-Analytics/
│
├── index.html            # Main HTML file
├── style.css             # Stylesheet for layout and design
├── script.js             # JavaScript file for logic and interactivity
├── superheroes_data.csv  # CSV file containing superhero data
└── README.md             # Project documentation
```

---

## Usage

### Attribute Visualization
1. Navigate to the **Attribute Visualization** tab.
2. Select an attribute (e.g., Intelligence, Strength) from the dropdown menu.
3. Apply filters such as race, gender, alignment, or height/weight ranges.
4. View the updated bar chart displaying superhero data.

### Superhero Comparison
1. Navigate to the **Superhero Comparison** tab.
2. Select two superheroes from the dropdown menus.
3. Click the "Compare" button to display:
   - A radar chart comparing their attributes.
   - Additional information about each superhero (e.g., full name, alignment, first appearance) below their respective images.

---

## Data Format

The `superheroes_data.csv` file should be structured as follows:

| Column              | Description                                |
|---------------------|--------------------------------------------|
| id                  | Unique identifier for the superhero        |
| name                | Name of the superhero                     |
| intelligence        | Intelligence level (numeric)              |
| strength            | Strength level (numeric)                  |
| speed               | Speed level (numeric)                     |
| durability          | Durability level (numeric)                |
| power               | Power level (numeric)                     |
| combat              | Combat level (numeric)                    |
| full-name           | Full name of the superhero                |
| alter-egos          | List of alter egos                        |
| aliases             | List of aliases                           |
| place-of-birth      | Place of birth                             |
| first-appearance    | First appearance in comics or media       |
| publisher           | Publisher (e.g., Marvel Comics, DC Comics)|
| alignment           | Alignment (Good, Bad, Neutral)            |
| gender              | Gender (Male, Female, etc.)               |
| race                | Race (Human, Alien, etc.)                 |
| height              | Height in various formats                 |
| weight              | Weight in various formats                 |
| eye-color           | Eye color                                 |
| hair-color          | Hair color                                |
| occupation          | Occupation                                |
| base                | Base of operations                        |
| group-affiliation   | Affiliated groups                         |
| relatives           | Relatives                                 |
| url                 | URL of the superhero's image              |

---

## Known Issues

- **Missing or Incorrect Data**: Ensure the `superheroes_data.csv` file is correctly formatted, as invalid or inconsistent data may cause visualization errors.
- **Commas in the values of `superheroes_data.csv` file lead to problems with parsing

---

## Future Improvements

- Add more detailed filtering options (e.g., filter by publisher or affiliation).
- Support for multi-hero comparisons in the radar chart.
- Enhance styling with animations and hover effects.
- Add more attributes for deeper insights.

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Contributions

Contributions are welcome! Please fork the repository and create a pull request with your improvements or suggestions. For major changes, please open an issue to discuss your proposal.

---

## Credits

- Data Source: Custom `superheroes_data.csv` dataset.
- Libraries:
  - [Chart.js](https://www.chartjs.org/) for data visualization.
  - [PapaParse](https://www.papaparse.com/) for CSV parsing.

Happy visualizing!
