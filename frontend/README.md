# Dynamic A/B Test Simulator

This is the front-end application for the Dynamic A/B Test Simulation Engine. It provides a real-time, dark-mode analytical dashboard to monitor campaign performances, visualize statistical data, and declare winning variations dynamically.

## Tech Stack
* **Framework:** React.js (Bootstrapped with Vite)
* **Data Visualization:** Recharts
* **HTTP Client:** Axios
* **Styling:** CSS (Custom Dark Mode UI)

## Key Features
* **Real-Time Polling:** Automatically fetches new simulation data and statistical results from the FastAPI backend every 1.5 seconds.
* **Interactive Control Panel:** Allows users to Start and Pause the backend simulation engine directly from the UI.
* **KPI Scorecards:** Displays raw metrics such as Total Visitors, Total Conversions, and Average Conversion Rate at a glance.
* **Dynamic Winner Badge:** Automatically evaluates Chi-Square and Bayesian probabilities. If a variant reaches a >90% probability of outperforming the other, a visual badge announces the winner.
* **Bayesian Projections:** Shows the projected probability of winning and the expected uplift in sales for the winning variant.
* **Trend & Bar Charts:** Visualizes Conversion Rates (CR) and Average Order Value (AOV) using responsive bar charts, alongside a time-series line chart tracking the conversion trend over time.

## Setup and Running Locally
1. Make sure you have Node.js installed.
2. Open your terminal and navigate to the `frontend` directory.
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to the URL provided in the terminal (usually http://localhost:5173).

**Note:** Ensure that your FastAPI backend and PostgreSQL database are running simultaneously for the dashboard to fetch and display data.

![Dashboard Screenshot](frontend/img/dashboard.png)
