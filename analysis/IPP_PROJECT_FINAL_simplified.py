# %%
# ============================================================
# CELL 1: Upload and load the dataset
# ============================================================
from google.colab import files                      # Colab's tool for uploading/downloading files
import pandas as pd                                 # pandas = tables (DataFrames); "pd" is the short nickname
import numpy as np                                  # NumPy = fast maths on arrays of numbers; nickname "np"
import matplotlib.pyplot as plt                     # Matplotlib = static charts; nickname "plt"

REQUIRED_COLUMNS = {"Country", "EDGAR Country Code", "Sector", "Year", "Emissions_Mt_CO2eq"}  # a SET of column names our code needs

uploaded = files.upload()                           # opens a "Choose file" button; returns {file name: file contents}

try:                                                # try = attempt the risky steps below; jump to "except" if one fails
    file_name = list(uploaded.keys())[0]            # take the name of the first (only) uploaded file
    df = pd.read_csv(file_name)                     # read the CSV file into a DataFrame called df
except IndexError:                                  # IndexError happens if no file was uploaded (empty list)
    raise SystemExit("No file was uploaded – please run the cell again and choose the CSV.")  # stop with a clear message
except (pd.errors.ParserError, UnicodeDecodeError) as error:  # the file exists but is not a readable CSV
    raise SystemExit(f"The file could not be read as a CSV: {error}")  # stop and show what went wrong

# Check that every column we rely on is present (set difference)
missing_columns = REQUIRED_COLUMNS - set(df.columns)  # set difference = required columns NOT found in the file
if missing_columns:                                 # an empty set counts as False, so this runs only if something is missing
    raise SystemExit(f"Missing required columns: {missing_columns}")  # stop and list the missing columns

print("Dataset loaded successfully!")               # confirmation message
print("Number of rows and columns:", df.shape)      # df.shape = (rows, columns), e.g. (1188, 8)
print(df.head())                                    # show the first 5 rows to inspect the structure

# %%
# ============================================================
# CELL 2: Install and import the visualisation libraries
# ============================================================
# The next line starts with "!" so it runs on Colab's command line, not in Python: pip downloads Seaborn & Plotly, -q = quiet
!pip -q install seaborn plotly

import seaborn as sns                               # Seaborn = nicer statistical charts (we use its heatmap and themes)
import plotly.express as px                         # Plotly Express = interactive charts with hover tooltips
import plotly.graph_objects as go                   # lower-level Plotly building blocks (imported for completeness)

from IPython.display import display, HTML           # display() shows tables neatly; HTML() renders our KPI cards

# Set a consistent visual style
sns.set_theme(style="whitegrid", context="notebook")  # white background + light grid for every chart



# A small reusable function that draws coloured "KPI cards" (used in Cells 4, 16 and 21)
def show_kpi_cards(cards):                          # input: a list of (label, value, colour) tuples
    html = '<div style="display:flex;gap:14px;flex-wrap:wrap;font-family:Arial;">'  # outer box: cards sit side by side
    for label, value, colour in cards:              # LOOP over the cards; unpack each tuple into 3 variables
        html += f'<div style="background:{colour};color:white;padding:18px;border-radius:14px;flex:1;min-width:170px;">'  # open one coloured card
        html += f'<div style="font-size:13px;">{label}</div>'  # small text: the label
        html += f'<div style="font-size:24px;font-weight:bold;">{value}</div></div>'  # big bold text: the value; close the card
    html += '</div>'                                # close the outer box
    display(HTML(html))                             # show the finished HTML in the notebook


print("All libraries are ready!")                   # confirmation message

# %%
# ============================================================
# CELL 3: Data cleaning and quality checks
# ============================================================
# Make a copy of the original data
df_clean = df.copy()                                # work on a copy so the raw upload stays untouched

# Make sure numerical columns have the correct data types
df_clean["Year"] = pd.to_numeric(df_clean["Year"], errors="coerce")  # turn Year into numbers; bad values become NaN (missing)
df_clean["Emissions_Mt_CO2eq"] = pd.to_numeric(df_clean["Emissions_Mt_CO2eq"], errors="coerce")  # same for emissions

# Remove rows missing essential information
df_clean = df_clean.dropna(subset=["Country", "Sector", "Year", "Emissions_Mt_CO2eq"])  # drop rows with a blank in any key column

# Convert Year to an integer
df_clean["Year"] = df_clean["Year"].astype(int)     # 2025.0 -> 2025 (whole number)

# Remove repeated country-sector-year observations
df_clean = df_clean.drop_duplicates(subset=["Country", "Sector", "Year"])  # keep only one row per country-sector-year

# Arrange the data in order
df_clean = df_clean.sort_values(["Country", "Sector", "Year"]).reset_index(drop=True)  # sort, then renumber rows 0,1,2…

# Display a visual data-quality summary
quality = pd.DataFrame({                            # build a small 2-column table from a dictionary
    "Measure": [                                    # first column: what we are checking (a list of labels)
        "Number of observations",                   # how many rows
        "Number of countries",                      # how many different countries
        "Number of sectors",                        # how many different sectors
        "First year",                               # earliest year
        "Last year",                                # latest year
        "Duplicate observations",                   # repeated rows still present
        "Missing emissions values"                  # blanks still present
    ],                                              # end of the "Measure" list
    "Result": [                                     # second column: the matching results, in the same order
        len(df_clean),                              # number of rows
        df_clean["Country"].nunique(),              # nunique = count of distinct values
        df_clean["Sector"].nunique(),               # distinct sectors
        df_clean["Year"].min(),                     # smallest year
        df_clean["Year"].max(),                     # largest year
        df_clean.duplicated(["Country", "Sector", "Year"]).sum(),  # True/False per row; sum counts the Trues
        df_clean["Emissions_Mt_CO2eq"].isna().sum()  # count missing emissions values
    ]                                               # end of the "Result" list
})                                                  # end of the dictionary and the DataFrame

display(quality)                                    # show the quality table

# %%
# ============================================================
# CELL 4: Sector Performance Dashboard
# ============================================================
# Select the latest year
latest_year = int(df_clean["Year"].max())           # the most recent year in the data (2025)

latest_data = df_clean[df_clean["Year"] == latest_year].copy()  # boolean filter: keep only rows from that year

# Calculate emissions by sector
sector_summary = (                                  # brackets let one statement continue over several lines
    latest_data.groupby("Sector")["Emissions_Mt_CO2eq"]  # group the rows by sector and pick the emissions column
    .sum()                                          # add up emissions within each sector
    .sort_values(ascending=False)                   # largest sector first
)                                                   # end of the multi-line statement

# Calculate sector contribution percentages using NumPy
sector_values = sector_summary.values               # the three totals as a NumPy array
sector_shares = np.divide(sector_values, sector_values.sum()) * 100  # each sector ÷ grand total × 100 = % share

# Find the leading sector
leading_sector = sector_summary.index[0]            # name of the biggest sector (first after sorting)
leading_value = sector_summary.iloc[0]              # its emissions (iloc = position-based lookup)
leading_share = sector_shares[0]                    # its % share

# Display KPI cards using our helper function from Cell 2
show_kpi_cards([                                    # a LIST of three (label, value, colour) TUPLES
    ("Leading sector", leading_sector, "#172554"),  # card 1: name of the biggest sector (navy)
    ("Leading sector emissions", f"{leading_value:,.1f} Mt CO₂e", "#164e63"),  # card 2: its emissions (teal)
    ("Share of sample emissions", f"{leading_share:.1f}%", "#365314"),  # card 3: its % share (green)
])                                                  # end of the list and the function call

# Prepare a table for display
sector_table = pd.DataFrame({                       # table with one row per sector
    "Sector": sector_summary.index,                 # sector names
    "Emissions (Mt CO2e)": sector_values,           # their emissions
    "Share (%)": sector_shares                      # their % shares
})                                                  # end of the DataFrame

display(sector_table.round(2))                      # show it, rounded to 2 decimals

# Create two charts side by side
fig, axes = plt.subplots(1, 2, figsize=(15, 6))     # 1 row × 2 charts; figsize = width, height in inches

# Donut chart
axes[0].pie(                                        # draw a pie chart on the left-hand axes
    sector_values,                                  # slice sizes
    labels=sector_summary.index,                    # slice labels
    autopct="%1.1f%%",                              # print each slice's % with 1 decimal
    startangle=90,                                  # start the first slice at 12 o'clock
    pctdistance=0.78,                               # where the % labels sit (fraction of the radius)
    wedgeprops={"width": 0.42, "edgecolor": "white"}  # ring width 0.42 turns the pie into a donut; white borders
)                                                   # end of pie()
axes[0].set_title(f"Sector Share of Sample Emissions ({latest_year})", fontsize=13, weight="bold")  # chart title

# Ranked horizontal bar chart
bars = axes[1].barh(                                # horizontal bars on the right-hand axes
    sector_summary.index[::-1],                     # [::-1] reverses the order so the biggest bar is on top
    sector_values[::-1],                            # bar lengths in the same reversed order
    color=sns.color_palette("viridis", len(sector_values))  # one colour per bar from the "viridis" palette
)                                                   # end of barh()
axes[1].bar_label(bars, fmt="%.1f", padding=5)      # write each bar's value at its end
axes[1].set_title("Annual Emissions by Sector", fontsize=13, weight="bold")  # chart title
axes[1].set_xlabel("Emissions (Mt CO₂e per year)")  # x-axis label with units
axes[1].set_ylabel("")                              # no y-axis label needed (sector names are enough)
axes[1].margins(x=0.15)                             # extra space on the right so labels are not cut off

plt.tight_layout()                                  # stop titles and labels from overlapping
plt.show()                                          # draw the figure

# %%
# ============================================================
# CELL 5: Interactive Country Comparison
# ============================================================
# One panel per sector (facets), each with its own y-axis scale
fig = px.bar(                                       # interactive bar chart with Plotly Express
    latest_data,                                    # data: the 2025 rows
    x="Country",                                    # countries along the x-axis
    y="Emissions_Mt_CO2eq",                         # bar height = emissions
    color="Sector",                                 # a different colour per sector
    facet_col="Sector",                             # separate panel for each sector
    facet_col_wrap=1,                               # stack the panels in one column (one above another)
    title=f"Country Emissions Comparison — {latest_year}",  # chart title
    labels={                                        # nicer axis names (dictionary: column -> label)
        "Country": "Country",                       # x-axis label
        "Emissions_Mt_CO2eq": "Mt CO₂e",            # y-axis label with units
        "Sector": "Sector"                          # legend label
    },                                              # end of labels
    hover_data={"Emissions_Mt_CO2eq": ":,.2f"},     # tooltip shows the value with commas and 2 decimals
    template="plotly_white"                         # clean white style
)                                                   # end of px.bar()

fig.update_layout(title_x=0.5, height=950, showlegend=False)  # centre the title, set height, hide legend (panels are labelled)
fig.update_xaxes(tickangle=-40)                     # tilt country names so they don't overlap
fig.update_yaxes(matches=None)                      # let each panel have its own y-scale (sectors differ a lot in size)

fig.show()                                          # display the interactive chart

# %%
# ============================================================
# CELL 6: Interactive Emissions Treemap
# ============================================================
# Select emissions for the latest year
treemap_data = df_clean[df_clean["Year"] == latest_year].copy()  # keep only 2025 rows

fig = px.treemap(                                   # treemap = nested rectangles sized by value
    treemap_data,                                   # data to draw
    path=["Sector", "Country"],                     # hierarchy: sector boxes containing country boxes
    values="Emissions_Mt_CO2eq",                    # rectangle area = emissions
    color="Emissions_Mt_CO2eq",                     # colour also shows emissions (darker = more)
    color_continuous_scale="YlOrRd",                # yellow → orange → red colour scale
    hover_data={"Emissions_Mt_CO2eq": ":,.2f"},     # tooltip format
    labels={"Emissions_Mt_CO2eq": "Mt CO₂e"},       # colour-bar label
    title=f"Where Do Sample Emissions Come From? ({latest_year})"  # chart title
)                                                   # end of px.treemap()

fig.update_layout(                                  # adjust the overall look
    template="plotly_white",                        # white style
    title_x=0.5,                                    # centre the title
    title_font_size=21,                             # bigger title
    height=700,                                     # chart height in pixels
    margin=dict(t=80, l=20, r=20, b=20)             # space around the chart: top, left, right, bottom
)                                                   # end of update_layout()
fig.update_traces(textinfo="label+percent parent", textfont_size=13)  # show name + % of its parent sector in each box

fig.show()                                          # display the treemap

# %%
# ============================================================
# CELL 7: Country Ranking Changes
# ============================================================
# Select three years (a list)
selected_years = [1990, 2010, 2025]                 # a LIST of the three snapshot years

rank_data = df_clean[df_clean["Year"].isin(selected_years)].copy()  # keep only rows whose year is in that list

# Rank countries within each sector and year
rank_data["Rank"] = rank_data.groupby(["Sector", "Year"])["Emissions_Mt_CO2eq"].rank(  # rank inside each sector-year group
    ascending=False, method="min"                   # biggest emitter = rank 1; ties share the lower rank
)                                                   # end of rank()

# Create one panel per sector
sectors = rank_data["Sector"].unique()              # array of the 3 sector names

fig, axes = plt.subplots(1, len(sectors), figsize=(16, 6))  # one chart per sector, side by side

for i, sector in enumerate(sectors):                # LOOP over sectors; enumerate also gives the position i (0, 1, 2)
    ax = axes[i]                                    # the chart panel for this sector
    sector_data = rank_data[rank_data["Sector"] == sector]  # rows for this sector only

    for country in sector_data["Country"].unique():  # inner LOOP: one line per country
        country_data = sector_data[sector_data["Country"] == country].sort_values("Year")  # this country's 3 points in year order
        ax.plot(country_data["Year"], country_data["Rank"], marker="o", linewidth=2, alpha=0.8)  # draw its rank line with dots

        # Label each country at the final year
        final_point = country_data[country_data["Year"] == 2025]  # the 2025 row for this country
        if not final_point.empty:                   # only label if a 2025 value exists
            ax.annotate(country, (2025, final_point["Rank"].iloc[0]),  # write the country name at (2025, its rank)
                        xytext=(5, 0), textcoords="offset points", fontsize=7, va="center")  # shift 5 points right, small font

    ax.set_title(sector, fontsize=12, fontweight="bold")  # panel title = sector name
    ax.set_xticks(selected_years)                   # show only 1990, 2010, 2025 on the x-axis
    ax.set_ylabel("Rank (1 = highest emissions)")   # y-axis label
    ax.invert_yaxis()                               # put rank 1 at the top
    ax.grid(alpha=0.25)                             # faint grid lines

fig.suptitle("How Country Emissions Rankings Changed", fontsize=17, fontweight="bold")  # title over all panels
plt.tight_layout()                                  # avoid overlaps
plt.show()                                          # draw the figure

# %%
# ============================================================
# CELL 8: Diverging Bar Chart
# ============================================================
# Select the sector to analyse
selected_sector = "Power Industry"                  # we study the biggest sector

# Get emissions in 1990 and 2025
start = df_clean[                                   # filter rows…
    (df_clean["Year"] == 1990) & (df_clean["Sector"] == selected_sector)  # …from 1990 AND the power sector
][["Country", "Emissions_Mt_CO2eq"]].rename(columns={"Emissions_Mt_CO2eq": "Emissions_1990"})  # keep 2 columns, rename the value

end = df_clean[                                     # same filter…
    (df_clean["Year"] == 2025) & (df_clean["Sector"] == selected_sector)  # …for 2025
][["Country", "Emissions_Mt_CO2eq"]].rename(columns={"Emissions_Mt_CO2eq": "Emissions_2025"})  # renamed 2025 value

# Match each country's starting and ending values
change_data = pd.merge(start, end, on="Country")    # join the two tables side by side using Country as the key

# Calculate absolute change
change_data["Change"] = change_data["Emissions_2025"] - change_data["Emissions_1990"]  # 2025 minus 1990, per country

# Sort countries by change
change_data = change_data.sort_values("Change")     # smallest (biggest fall) first

# Assign a different colour to increases and decreases
colors = ["#D9534F" if value > 0 else "#2A9D8F" for value in change_data["Change"]]  # list comprehension: red if up, teal if down

# Draw the diverging chart
fig, ax = plt.subplots(figsize=(11, 7))             # one chart

bars = ax.barh(change_data["Country"], change_data["Change"], color=colors, height=0.7)  # horizontal bars left/right of zero
ax.axvline(0, color="black", linewidth=1)           # vertical line at zero
ax.bar_label(bars, labels=[f"{value:+,.1f}" for value in change_data["Change"]],  # label every bar with a +/- sign
             padding=5, fontsize=9)                 # small gap and small font

ax.set_title("Change in Power Industry Emissions (1990–2025)", fontsize=16, fontweight="bold", pad=15)  # title
ax.set_xlabel("Change in annual emissions (Mt CO₂e)")  # x-axis label
ax.set_ylabel("Country")                            # y-axis label
ax.grid(axis="x", linestyle="--", alpha=0.25)       # dashed vertical grid lines
ax.set_axisbelow(True)                              # draw the grid behind the bars
ax.spines["top"].set_visible(False)                 # remove the top border line
ax.spines["right"].set_visible(False)               # remove the right border line
ax.margins(x=0.12)                                  # room for the labels

plt.tight_layout()                                  # avoid overlaps
plt.show()                                          # draw the figure

# %%
# ============================================================
# CELL 9: Small-Multiples Sector Trend Dashboard
# ============================================================
sectors = df_clean["Sector"].unique()               # the 3 sector names

fig, axes = plt.subplots(1, len(sectors), figsize=(17, 5), sharex=True)  # 3 panels sharing the same year axis

if len(sectors) == 1:                               # safety check: with a single panel, axes is not a list…
    axes = [axes]                                   # …so wrap it in a list to make the loop below still work

for ax, sector in zip(axes, sectors):               # zip pairs each panel with a sector
    # Calculate total emissions across the selected countries
    sector_data = df_clean[df_clean["Sector"] == sector].groupby("Year")["Emissions_Mt_CO2eq"].sum()  # yearly total of 11 countries

    ax.plot(sector_data.index, sector_data.values, linewidth=2.5, color="#247BA0")  # trend line
    ax.fill_between(sector_data.index, sector_data.values, alpha=0.12, color="#247BA0")  # light shading under the line

    ax.set_title(sector, fontsize=12, fontweight="bold")  # panel title
    ax.set_xlabel("Year")                           # x-axis label
    ax.grid(True, linestyle="--", alpha=0.25)       # dashed grid
    ax.spines["top"].set_visible(False)             # remove top border
    ax.spines["right"].set_visible(False)           # remove right border

axes[0].set_ylabel("Annual emissions (Mt CO₂e)")    # y-axis label only on the first panel

fig.suptitle("Long-Term Emissions Trends Across Sectors (1990–2025)", fontsize=16, fontweight="bold", y=1.04)  # overall title
plt.tight_layout()                                  # avoid overlaps
plt.show()                                          # draw the figure

# %%
# ============================================================
# CELL 10: Animated Bar Chart Race
# ============================================================
selected_sector = "Power Industry"                  # sector to animate

# Prepare emissions data across years
race_data = df_clean[df_clean["Sector"] == selected_sector].groupby(  # power rows, grouped by…
    ["Year", "Country"], as_index=False             # …year and country, kept as normal columns
)["Emissions_Mt_CO2eq"].sum()                       # total emissions per year-country

# Keep country colours and rankings consistent
fig = px.bar(                                       # animated bar chart
    race_data,                                      # data
    x="Emissions_Mt_CO2eq",                         # bar length = emissions
    y="Country",                                    # one bar per country
    color="Country",                                # fixed colour per country
    animation_frame="Year",                         # one animation frame per year
    animation_group="Country",                      # the same country's bar moves smoothly between frames
    orientation="h",                                # horizontal bars
    range_x=[0, race_data["Emissions_Mt_CO2eq"].max() * 1.15],  # fixed x-axis (0 to 115% of the maximum) so bars don't jump
    title="Power Industry Emissions Race (1990–2025)",  # title
    labels={"Emissions_Mt_CO2eq": "Annual emissions (Mt CO₂e)", "Country": "Country", "Year": "Year"},  # axis labels
    template="plotly_white"                         # white style
)                                                   # end of px.bar()

fig.update_layout(                                  # adjust layout
    height=650,                                     # height in pixels
    title_x=0.5,                                    # centre title
    title_font_size=20,                             # title size
    showlegend=False,                               # hide legend (names are on the axis)
    yaxis={"categoryorder": "total ascending"},     # biggest emitter at the top of each frame
    margin=dict(l=30, r=30, t=80, b=40)             # margins
)                                                   # end of update_layout()
fig.update_traces(texttemplate="%{x:,.0f}", textposition="outside", cliponaxis=False)  # value label at the end of each bar

fig.layout.updatemenus[0].buttons[0].args[1]["frame"]["duration"] = 700  # each year stays on screen for 700 milliseconds
fig.layout.updatemenus[0].buttons[0].args[1]["transition"]["duration"] = 350  # bars glide for 350 ms between years

fig.show()                                          # display the animation (press ▶ to play)


# %% [markdown]
# ---
# # PART B — Carbon Strategy & Investment Optimizer
# ### From *"what happened to emissions?"* to *"where should we put the money?"*
#
# **Approved problem statement (unchanged):** *How have emissions changed across Agriculture, Industrial Combustion and Power Industry in a selected sample of countries from 1990 to 2025, and which sectors and countries should be prioritised for decarbonisation?*
#
# Part A answered the first half of that question (the trends). **Part B answers the second half — prioritisation — as a business decision.**
#
# **Decision-maker:** an illustrative **climate investment fund** with a decarbonisation budget (default US$10 billion).
#
# **Business question:** *Across the 33 country–sector "markets" in our data, which decarbonisation projects should the fund finance, and how much in each, to avoid the most emissions (or earn the best return), given its budget, a reduction target, and uncertainty about future carbon prices?*
#
# **How the system works**
# 1. **Market scorecard** – size, growth, peak and volatility of every market (OOP class)
# 2. **Live economic context** – GDP & population from the World Bank API (extra credit)
# 3. **2030 outlook** – trend forecast vs a 1.5 °C-aligned pathway
# 4. **Carbon exposure calculator** – what each market's emissions would cost under different carbon prices
# 5. **Project catalogue** – 8 real decarbonisation options with costs and a marginal abatement cost curve (MACC)
# 6. **Optimization engine** – linear programming chooses the best mix of projects
# 7. **Strategy comparison & stress tests** – is the optimised plan really better? what if carbon prices disappoint?
# 8. **Recommended business action** – dashboard, company lens, exported Excel + executive summary
#
# > ⚠️ **Important distinction:** our data measures **national sector emissions** (e.g. *all* power plants in India), **not any single company's emissions**. We therefore use it to size *markets* and *opportunities* — never as a company's own carbon footprint. Cell 22 shows how a company should use these results correctly.

# %%
# ============================================================
# CELL 11: CONTROL PANEL — the fund manager's decision settings
# ============================================================
# In Google Colab the "# @param" text turns each line into a form box,
# dropdown or slider, so anyone can change a value and press Run all.
# (Lines ending in "# @param" must keep that text exactly, so their
#  explanation is written on the line ABOVE.)

# Budget the fund can invest, in US$ million (10,000 = US$10 billion)
BUDGET_USD_M = 10000  # @param {type:"number"}

# Emissions the fund's projects must avoid EVERY YEAR, in million tonnes CO2e
TARGET_MT_PER_YEAR = 25  # @param {type:"number"}

# Which carbon-price future we plan for (dropdown menu)
SCENARIO = "Announced pledges (IEA APS)"  # @param ["Current policies", "Announced pledges (IEA APS)", "Net zero (IEA NZE)"]

# Goal: highest NPV (while still hitting the target) or the most tonnes avoided (dropdown menu)
OBJECTIVE = "Maximise financial return (NPV)"  # @param ["Maximise financial return (NPV)", "Maximise CO2e avoided"]

# Maximum share of the budget any ONE country can receive (0.30 = 30%)
MAX_COUNTRY_SHARE = 0.30  # @param {type:"slider", min:0.1, max:1.0, step:0.05}

# Minimum share of the budget EACH of the 3 sectors must receive (0.20 = 20%)
MIN_SECTOR_SHARE = 0.20  # @param {type:"slider", min:0.0, max:0.33, step:0.01}

# Maximum share of the budget any ONE technology (project type) can receive
MAX_PROJECT_SHARE = 0.30  # @param {type:"slider", min:0.1, max:1.0, step:0.05}

BASE_YEAR = 2025                                    # latest year in our data
FORECAST_YEAR = 2030                                # planning horizon
TREND_WINDOW = 10                                   # number of recent years used to measure trends

# The four emerging economies we test "what-if" policy levers on in Cell 20
# (China is left out because its finance is already cheap)
EMERGING_FOCUS = ["Brazil", "India", "Indonesia", "South Africa"]  # a LIST of country names

# ------------------------------------------------------------
# Country assumptions (a DICTIONARY of DICTIONARIES)
#   group     = IEA economy group (decides the scenario carbon price)
#   price_now = carbon price in force today, US$ per tonne (power & industry)
#   discount  = cost of borrowing for clean-energy projects
#   grid      = tonnes of CO2 per MWh of electricity (how dirty the grid is)
# ------------------------------------------------------------
COUNTRY_INFO = {                                    # country name -> its assumptions
    "Australia":      {"group": "Advanced", "price_now": 25, "discount": 0.05, "grid": 0.525},  # ACCU ≈ A$38/t
    "Brazil":         {"group": "Emerging", "price_now": 0,  "discount": 0.10, "grid": 0.110},  # no carbon price yet; hydro grid
    "Canada":         {"group": "Advanced", "price_now": 70, "discount": 0.05, "grid": 0.191},  # industrial carbon pricing
    "China":          {"group": "Emerging", "price_now": 14, "discount": 0.06, "grid": 0.525},  # national ETS; cheap state finance
    "Germany":        {"group": "Advanced", "price_now": 87, "discount": 0.05, "grid": 0.330},  # EU ETS
    "India":          {"group": "Emerging", "price_now": 0,  "discount": 0.10, "grid": 0.670},  # no price yet; coal-heavy grid
    "Indonesia":      {"group": "Emerging", "price_now": 2,  "discount": 0.10, "grid": 0.680},  # symbolic carbon tax
    "Japan":          {"group": "Advanced", "price_now": 2,  "discount": 0.05, "grid": 0.477},  # small climate tax
    "South Africa":   {"group": "Emerging", "price_now": 17, "discount": 0.10, "grid": 0.699},  # carbon tax ZAR 308/t
    "United Kingdom": {"group": "Advanced", "price_now": 63, "discount": 0.05, "grid": 0.217},  # UK ETS ≈ £47.5/t
    "United States":  {"group": "Advanced", "price_now": 0,  "discount": 0.05, "grid": 0.384},  # no federal carbon price
}                                                   # end of COUNTRY_INFO

# Future carbon prices (US$/t) from the IEA, as TUPLES (advanced price, emerging price)
SCENARIO_PRICES = {                                 # scenario name -> prices
    "Current policies": None,                       # None = use today's price_now instead
    "Announced pledges (IEA APS)": (160, 65),       # what governments have promised
    "Net zero (IEA NZE)": (180, 125),               # what net zero by 2050 would need
}                                                   # end of SCENARIO_PRICES

AGRI_PRICE_SHARE = 0.25                             # farms aren't carbon-priced; their credits earn 25% of the scenario price
VOLUNTARY_CREDIT_PRICE = 5                          # today's voluntary carbon-credit price, US$/t
POWER_PRICE_USD_MWH = 50                            # price at which new solar/wind sells electricity, US$/MWh

# ------------------------------------------------------------
# The 8 decarbonisation project types
#   capex_per_tpa = upfront cost to avoid 1 tonne per year (US$)
#   benefit_per_t = yearly saving per tonne avoided, before carbon money (negative = extra cost)
#   life          = years the project lasts
#   reach         = share of a market's 2030 emissions this fund can realistically finance
# Solar and wind are worked out from IRENA's cost per kW instead.
# ------------------------------------------------------------
INTERVENTIONS = {                                   # project name -> its assumptions
    "Utility-scale solar PV": {                     # large solar farms
        "sector": "Power Industry", "type": "power", "capex_per_kw": 691,  # IRENA: US$691 per kW
        "capacity_factor": 0.17, "om_share": 0.015, "life": 25, "reach": 0.03},  # produces 17% of the time; upkeep 1.5%/yr
    "Onshore wind": {                               # land-based wind farms
        "sector": "Power Industry", "type": "power", "capex_per_kw": 1041,  # IRENA: US$1,041 per kW
        "capacity_factor": 0.34, "om_share": 0.025, "life": 25, "reach": 0.02},  # produces 34% of the time; upkeep 2.5%/yr
    "Industrial energy efficiency": {               # heat recovery, efficient motors and boilers
        "sector": "Industrial Combustion", "type": "fixed", "capex_per_tpa": 450,  # US$450 per tonne/yr
        "benefit_per_t": 45, "life": 15, "reach": 0.02},  # saves US$45 of fuel per tonne
    "Electrified process heat (heat pumps)": {      # electric heat pumps instead of burning fuel
        "sector": "Industrial Combustion", "type": "fixed", "capex_per_tpa": 900,  # US$900 per tonne/yr
        "benefit_per_t": 10, "life": 20, "reach": 0.015},  # small running saving
    "Clean fuel switch (biomass / hydrogen)": {     # clean fuels for very hot industrial heat
        "sector": "Industrial Combustion", "type": "fixed", "capex_per_tpa": 1200,  # most expensive option
        "benefit_per_t": -60, "life": 20, "reach": 0.01},  # clean fuel costs US$60/t MORE to run
    "Precision fertiliser management": {            # use only the fertiliser crops need
        "sector": "Agriculture", "type": "fixed", "capex_per_tpa": 400,  # equipment, soil tests, training
        "benefit_per_t": 30, "life": 10, "reach": 0.01},  # fertiliser saved = US$30 per tonne
    "Livestock methane feed additives": {           # feed supplements that cut cattle methane
        "sector": "Agriculture", "type": "fixed", "capex_per_tpa": 400,  # programme set-up cost
        "benefit_per_t": -20, "life": 10, "reach": 0.01},  # additives cost US$20 per tonne to keep buying
    "Rice paddy water management (AWD)": {          # drain rice fields now and then to cut methane
        "sector": "Agriculture", "type": "fixed", "capex_per_tpa": 300,  # irrigation control + training
        "benefit_per_t": 5, "life": 10, "reach": 0.01,  # small water/pumping saving
        "countries": {"China", "India", "Indonesia"}},  # a SET: only rice-growing countries
}                                                   # end of INTERVENTIONS

# Where every number comes from (a LIST of TUPLES; exported to Excel in Cell 23)
DATA_SOURCES = [  # a LIST of (item, source) TUPLES
    ("Emissions by country & sector", "EDGAR Community GHG Database (EDGAR_2026_GHG), European Commission JRC; report 'GHG emissions of all world countries – 2026'"),  # main data
    ("Current carbon prices", "World Bank, State and Trends of Carbon Pricing 2026; IEA GEC Model documentation 2025 (current-policy prices for Canada, China, EU, Japan); UK ETS & ACCU market reports 2026"),  # price_now
    ("Scenario carbon prices", "IEA, Global Energy and Climate Model Documentation 2025, Table 2.4 (2035 values, US$2024)"),  # SCENARIO_PRICES
    ("Solar & wind costs", "IRENA, Renewable Power Generation Costs in 2024 (2025): solar US$691/kW, CF 17%; onshore wind US$1,041/kW, CF 34%"),  # power costs
    ("Grid carbon intensity", "Ember electricity data via Our World in Data energy dataset (2025; Indonesia 2024)"),  # grid values
    ("Cost of capital", "IEA Cost of Capital Observatory: financing costs in emerging economies at least 2x advanced economies"),  # discount rates
    ("Abatement cost bands", "IPCC AR6 Working Group III, Summary for Policymakers, Figure SPM.7"),  # other project costs
    ("1.5 C pathway", "IPCC AR6 Synthesis Report: global GHG -43% by 2030 vs 2019"),  # Cell 15
    ("GDP & population", "World Bank Open Data API (NY.GDP.MKTP.CD, SP.POP.TOTL); offline fallback: World Bank 2023 GDP, UN WPP 2024 population via Our World in Data"),  # Cell 13
]                                                   # end of DATA_SOURCES

print("Control panel loaded")                       # confirmation
print("  Budget (US$ m):", BUDGET_USD_M)            # show the budget
print("  Target (Mt/yr):", TARGET_MT_PER_YEAR)      # show the target
print("  Scenario      :", SCENARIO)                # show the scenario
print("  Objective     :", OBJECTIVE)               # show the objective
print("  Projects in catalogue:", len(INTERVENTIONS))  # len() counts the 8 project types

# %%
# ============================================================
# CELL 12: Helper functions and the MarketProfile class
# ============================================================
# A FUNCTION is a reusable recipe. A CLASS is a blueprint for objects:
# here each object is one market, e.g. "India – Power Industry".


def cagr(start_value, end_value, years):            # compound annual growth rate, in %
    try:                                            # attempt the calculation
        return ((end_value / start_value) ** (1 / years) - 1) * 100  # (end ÷ start)^(1/years) − 1, as a %
    except ZeroDivisionError:                       # happens only if start_value is 0
        return np.nan                               # growth from zero cannot be measured


def annuity_factor(rate, years):                    # today's value of receiving US$1 every year for `years` years
    return (1 - (1 + rate) ** -years) / rate        # standard finance formula: (1 − (1+r)^−n) ÷ r


def get_carbon_price(country, sector, scenario, force_advanced=False):  # carbon money earned per tonne avoided
    info = COUNTRY_INFO[country]                    # this country's assumptions
    if scenario == "Current policies":              # CASE 1: today's world
        if sector == "Agriculture":                 # farms pay no carbon price today…
            return VOLUNTARY_CREDIT_PRICE           # …so only voluntary credits (US$5)
        return info["price_now"]                    # power & industry: today's price
    advanced_price, emerging_price = SCENARIO_PRICES[scenario]  # CASE 2: a future scenario; unpack the tuple
    if info["group"] == "Advanced" or force_advanced:  # advanced economy (or a what-if test treating it as one)
        price = advanced_price                      # use the higher price
    else:                                           # emerging economy
        price = emerging_price                      # use the lower price
    if sector == "Agriculture":                     # farms earn only carbon credits…
        price = price * AGRI_PRICE_SHARE            # …worth 25% of the price
    return price                                    # give the price back


class MarketProfile:                                # blueprint for one country–sector market
    def __init__(self, country, sector, series):    # runs automatically when an object is created
        if len(series) < TREND_WINDOW + 1:          # need at least 11 years of data
            raise ValueError(f"{country} – {sector}: not enough years of data")  # refuse to build a broken object
        self.country = country                      # store the country inside the object
        self.sector = sector                        # store the sector
        self.series = series.sort_index()           # store yearly emissions, sorted by year

    def latest(self):                               # METHOD: 2025 emissions
        return self.series[BASE_YEAR]               # look up the 2025 value

    def cagr_recent(self):                          # METHOD: growth rate 2015–2025
        return cagr(self.series[BASE_YEAR - TREND_WINDOW], self.latest(), TREND_WINDOW)  # reuse cagr()

    def peak_year(self):                            # METHOD: year with the highest emissions
        return int(self.series.idxmax())            # idxmax = the year (index) of the biggest value

    def pct_below_peak(self):                       # METHOD: how far 2025 is below the peak, in %
        return (1 - self.latest() / self.series.max()) * 100  # 0 means 2025 IS the peak

    def volatility(self):                           # METHOD: how bumpy the series is
        changes = np.diff(self.series.values) / self.series.values[:-1] * 100  # yearly % changes
        return np.std(changes)                      # standard deviation of those changes

    def forecast(self, year):                       # METHOD: predicted emissions in a future year
        recent = self.series[self.series.index >= BASE_YEAR - TREND_WINDOW]  # keep 2015–2025 only
        slope, intercept = np.polyfit(recent.index, recent.values, 1)  # best-fit straight line through those years
        return max(slope * year + intercept, 0)     # read the line at `year`; never below zero

    def momentum(self):                             # METHOD: describe the trend in words
        growth = self.cagr_recent()                 # 10-year growth rate
        if growth > 2:                              # above 2% a year
            return "Rising fast"                    # strong growth
        elif growth > 0.5:                          # 0.5% to 2%
            return "Rising"                         # moderate growth
        elif growth > -0.5:                         # −0.5% to 0.5%
            return "Flat"                           # little change
        else:                                       # below −0.5%
            return "Declining"                      # falling

    def to_dict(self):                              # METHOD: all metrics as one dictionary (= one table row)
        return {"Country": self.country,            # country
                "Sector": self.sector,              # sector
                "Emissions_2025_Mt": self.latest(),  # 2025 emissions
                "Growth_10y_pct": self.cagr_recent(),  # growth rate
                "Peak_Year": self.peak_year(),      # peak year
                "Below_Peak_pct": self.pct_below_peak(),  # distance below peak
                "Volatility_pct": self.volatility(),  # volatility
                "Forecast_2030_Mt": self.forecast(FORECAST_YEAR),  # 2030 forecast
                "Momentum": self.momentum()}        # trend label

    def __repr__(self):                             # METHOD: what print() shows for the object
        return f"<Market {self.country} | {self.sector}: {self.latest():,.0f} Mt, {self.cagr_recent():+.1f}%/yr>"  # one-line summary


profiles = {}                                       # DICTIONARY: (country, sector) -> MarketProfile object
for (country, sector), group in df_clean.groupby(["Country", "Sector"]):  # LOOP over the 33 country–sector groups
    series = group.set_index("Year")["Emissions_Mt_CO2eq"]  # this group's emissions, indexed by year
    try:                                            # try to build the object
        profiles[(country, sector)] = MarketProfile(country, sector, series)  # create it; the key is a TUPLE
    except ValueError as error:                     # the data was too short
        print("Skipped:", error)                    # report and carry on

print("Market profiles created:", len(profiles))    # expect 33
print("Example:", profiles[("India", "Power Industry")])  # print() uses __repr__

# %%
# ============================================================
# CELL 13: World Bank API — GDP and population (extra credit)
# ============================================================
# Big countries naturally emit more, so we also compare emissions PER
# PERSON and PER DOLLAR OF GDP. We download population and GDP live.
# If the internet fails, we use stored values so the demo never breaks.

import requests                                     # library for calling websites/APIs

# Stored backup values: ISO3 code -> (population, GDP in US$), World Bank 2023
FALLBACK_ECON = {  # ISO3 code -> (population, GDP in US$)
    "AUS": (26_451_126, 1_723_827e6),   "BRA": (211_140_731, 2_173_666e6),  # Australia, Brazil (e6 = million)
    "CAN": (39_299_098, 2_140_086e6),   "CHN": (1_422_584_930, 17_794_782e6),  # Canada, China
    "DEU": (84_548_233, 4_456_081e6),   "IND": (1_438_069_597, 3_549_919e6),  # Germany, India
    "IDN": (281_190_068, 1_371_171e6),  "JPN": (124_370_947, 4_212_945e6),  # Indonesia, Japan
    "ZAF": (63_212_386, 377_782e6),     "GBR": (68_682_965, 3_340_032e6),  # South Africa, UK
    "USA": (343_477_330, 27_360_935e6),             # United States
}                                                   # end of FALLBACK_ECON


def fetch_world_bank(indicator, iso_codes):         # download one indicator for many countries
    url = ("https://api.worldbank.org/v2/country/" + ";".join(iso_codes)  # web address with codes joined by ";"
           + "/indicator/" + indicator + "?format=json&mrv=1&per_page=100")  # mrv=1 = most recent value, as JSON
    response = requests.get(url, timeout=15)        # send the request; give up after 15 seconds
    response.raise_for_status()                     # turn an HTTP error (e.g. 404) into a Python error
    rows = response.json()[1]                       # the answer is [metadata, data]; keep the data part
    results = {}                                    # dictionary to fill: code -> (value, year)
    for row in rows:                                # LOOP over countries in the answer
        if row["value"] is not None:                # skip blanks
            results[row["countryiso3code"]] = (row["value"], int(row["date"]))  # store value and year
    return results                                  # give the dictionary back


codes = {}                                          # dictionary: ISO3 code -> country name
for _, row in df_clean[["EDGAR Country Code", "Country"]].drop_duplicates().iterrows():  # one row per country
    codes[row["EDGAR Country Code"]] = row["Country"]  # e.g. "IND" -> "India"
iso_list = sorted(codes)                            # alphabetical list of the 11 codes

econ_rows = []                                      # list of [country, population, GDP, year]
try:                                                # try the live API first
    pop = fetch_world_bank("SP.POP.TOTL", iso_list)  # World Bank code for total population
    gdp = fetch_world_bank("NY.GDP.MKTP.CD", iso_list)  # World Bank code for GDP in current US$
    for code in iso_list:                           # LOOP over our countries
        econ_rows.append([codes[code], pop[code][0], gdp[code][0], gdp[code][1]])  # KeyError here if a country is missing
    econ_source = "World Bank API (live)"           # remember the source
except (requests.exceptions.RequestException, ValueError, KeyError, IndexError, TypeError) as error:  # any network/data problem
    print("⚠ World Bank API unavailable (" + type(error).__name__ + ") – using stored values")  # warn
    econ_rows = []                                  # start again with an empty list
    for code in iso_list:                           # LOOP over our countries
        population, gdp_usd = FALLBACK_ECON[code]   # unpack the stored tuple
        econ_rows.append([codes[code], population, gdp_usd, 2023])  # add the stored values
    econ_source = "Stored fallback (World Bank 2023 GDP, UN WPP population)"  # remember the source

econ = pd.DataFrame(econ_rows, columns=["Country", "Population", "GDP_USD", "GDP_Year"])  # list -> table

totals_2025 = latest_data.groupby("Country")["Emissions_Mt_CO2eq"].sum()  # 2025 emissions per country (3 sectors)
econ["Emissions_2025_Mt"] = econ["Country"].map(totals_2025)  # look up each country's total
econ["t_per_person"] = econ["Emissions_2025_Mt"] * 1e6 / econ["Population"]  # Mt → tonnes, ÷ people
econ["kg_per_USD_GDP"] = econ["Emissions_2025_Mt"] * 1e9 / econ["GDP_USD"]  # Mt → kg, ÷ dollars of GDP

print("Economic data source:", econ_source)         # which source was used
display(econ.round(2))                              # show the table

fig, axes = plt.subplots(1, 2, figsize=(15, 5.5))   # two charts side by side

ordered = econ.sort_values("t_per_person")          # LEFT chart: sort so the biggest bar is on top
bars = axes[0].barh(ordered["Country"], ordered["t_per_person"], color="#247BA0")  # horizontal bars
axes[0].bar_label(bars, fmt="%.2f", padding=4, fontsize=9)  # value labels
axes[0].set_title("Tonnes CO₂e per person (3 sectors)", fontsize=13, fontweight="bold")  # title

ordered = econ.sort_values("kg_per_USD_GDP")        # RIGHT chart: same steps for kg per US$
bars = axes[1].barh(ordered["Country"], ordered["kg_per_USD_GDP"], color="#D9534F")  # horizontal bars
axes[1].bar_label(bars, fmt="%.2f", padding=4, fontsize=9)  # value labels
axes[1].set_title("kg CO₂e per US$ of GDP (3 sectors)", fontsize=13, fontweight="bold")  # title

fig.suptitle("Fair comparison: emissions relative to people and economic output", fontsize=15, fontweight="bold", y=1.02)  # overall title
plt.tight_layout()                                  # avoid overlaps
plt.show()                                          # draw

# %%
# ============================================================
# CELL 14: Market Scorecard & Priority Matrix
# ============================================================
# Each market gets a priority score out of 100 from four signals.

WEIGHTS = {"size": 0.40,                            # bigger markets = more emissions to cut
           "growth": 0.30,                          # growing markets = risk of new fossil plants
           "near_peak": 0.15,                       # still at its peak = hasn't started falling
           "intensity": 0.15}                       # carbon-heavy economy (emissions per US$ GDP)

rows = []                                           # one dictionary per market
for profile in profiles.values():                   # LOOP over the 33 MarketProfile objects
    rows.append(profile.to_dict())                  # each object gives us its metrics
scorecard = pd.DataFrame(rows)                      # list of dictionaries -> table
scorecard = scorecard.merge(econ[["Country", "kg_per_USD_GDP"]], on="Country")  # add GDP intensity from Cell 13

# rank(pct=True) turns any column into a 0–1 score (1 = highest), so different measures can be added together
scorecard["Priority_Score"] = 100 * (  # weighted sum of four 0–1 scores, × 100
    WEIGHTS["size"] * scorecard["Emissions_2025_Mt"].rank(pct=True)  # bigger = higher
    + WEIGHTS["growth"] * scorecard["Growth_10y_pct"].rank(pct=True)  # faster growth = higher
    + WEIGHTS["near_peak"] * (-scorecard["Below_Peak_pct"]).rank(pct=True)  # minus sign: closer to peak = higher
    + WEIGHTS["intensity"] * scorecard["kg_per_USD_GDP"].rank(pct=True)  # more carbon-intensive = higher
)                                                   # end of the formula

SIZE_THRESHOLD = scorecard["Emissions_2025_Mt"].median()  # the middle market size splits "large" from "small"


def classify_market(emissions, growth):             # put a market into one of four boxes
    large = emissions >= SIZE_THRESHOLD             # True if large
    growing = growth > 0.5                          # True if growing faster than 0.5% a year
    if large and growing:                           # big and getting bigger
        return "Priority: large & growing"  # big and getting bigger
    elif large:                                     # big but not growing
        return "Transition risk: large, flat/declining"  # big but no longer growing
    elif growing:                                   # small but growing
        return "Emerging: small & growing"  # small but rising
    else:                                           # small and shrinking
        return "Mature: small & declining"  # small and shrinking


quadrants = []                                      # list of quadrant names
for _, row in scorecard.iterrows():                 # LOOP over every market row
    quadrants.append(classify_market(row["Emissions_2025_Mt"], row["Growth_10y_pct"]))  # classify it
scorecard["Quadrant"] = quadrants                   # store as a new column

ACTIONS = {"Priority: large & growing": "Invest now – clean capacity before fossil lock-in",  # quadrant -> advice
           "Transition risk: large, flat/declining": "Efficiency + fuel switch; price carbon risk",  # clean up existing assets
           "Emerging: small & growing": "Early-mover pipeline; small, scalable bets",  # start small
           "Mature: small & declining": "Monitor; learn from their decline"}  # low priority
QUAD_COLOURS = {"Priority: large & growing": "#C0392B",  # red
                "Transition risk: large, flat/declining": "#E67E22",  # orange
                "Emerging: small & growing": "#2980B9",  # blue
                "Mature: small & declining": "#7F8C8D"}  # grey
scorecard["Recommended_Stance"] = scorecard["Quadrant"].map(ACTIONS)  # look up the advice for each market
scorecard = scorecard.sort_values("Priority_Score", ascending=False).reset_index(drop=True)  # best first
scorecard["Market"] = scorecard["Country"] + " – " + scorecard["Sector"]  # combined name, e.g. "India – Power Industry"

display(scorecard[["Market", "Emissions_2025_Mt", "Growth_10y_pct", "Peak_Year", "Priority_Score", "Quadrant"]].head(12).round(1))  # top 12

scorecard["Label"] = ""                             # empty label for every bubble…
for i in range(5):                                  # LOOP i = 0,1,2,3,4 …
    scorecard.loc[i, "Label"] = f"#{i + 1} " + scorecard.loc[i, "Market"]  # …then name only the top 5

fig = px.scatter(scorecard, x="Growth_10y_pct", y="Emissions_2025_Mt",  # bubble chart: growth vs size
                 size="Priority_Score", color="Quadrant", text="Label",  # bubble size = score; colour = quadrant; label text
                 color_discrete_map=QUAD_COLOURS, log_y=True, size_max=34,  # our colours; log scale (sizes differ 300×)
                 hover_name="Market",               # tooltip title
                 labels={"Growth_10y_pct": "Growth rate 2015–2025 (% per year)",  # axis labels
                         "Emissions_2025_Mt": "Emissions 2025 (Mt CO₂e, log scale)"},  # y-axis label
                 title="Market Priority Matrix — where should the fund focus?",  # title
                 template="plotly_white")           # white style
fig.update_traces(textposition="top center", textfont_size=10)  # put the labels above the bubbles
fig.add_vline(x=0.5, line_dash="dash", line_color="grey")  # line separating growing from not growing
fig.add_hline(y=SIZE_THRESHOLD, line_dash="dash", line_color="grey")  # line separating large from small
fig.update_layout(height=650, title_x=0.5, legend_title_text="",  # size, centred title
                  legend=dict(orientation="h", y=-0.15))  # legend in one row under the chart
fig.show()                                          # display
# %%
# ============================================================
# CELL 15: 2030 outlook — current trend vs a 1.5 °C pathway
# ============================================================
# IPCC: to keep 1.5 °C in reach, emissions must be 43% below 2019 by 2030.

PATHWAY_CUT_2030 = 0.43                             # required cut vs 2019
years_ahead = list(range(BASE_YEAR, FORECAST_YEAR + 1))  # [2025, 2026, 2027, 2028, 2029, 2030]
outlook_rows = []                                   # one summary row per sector

fig, axes = plt.subplots(1, 3, figsize=(17, 5))     # three panels
sector_names = sorted(df_clean["Sector"].unique())  # the 3 sectors in alphabetical order

for i in range(3):                                  # LOOP over the 3 sectors (i = 0, 1, 2)
    sector = sector_names[i]                        # this sector's name
    ax = axes[i]                                    # this sector's panel
    history = df_clean[df_clean["Sector"] == sector].groupby("Year")["Emissions_Mt_CO2eq"].sum()  # actual yearly totals

    bau = []                                        # "business as usual" = where today's trends lead
    for year in years_ahead:                        # LOOP over 2025–2030
        total = 0                                   # running total for this year
        for (country, s), profile in profiles.items():  # LOOP over all markets…
            if s == sector:                         # …keep only this sector's 11 markets
                total = total + profile.forecast(year)  # add each country's own trend forecast
        bau.append(total)                           # store the year's total
    bau[0] = history[BASE_YEAR]                     # start the line from the actual 2025 value

    target_2030 = history[2019] * (1 - PATHWAY_CUT_2030)  # 2019 level × 0.57 = where 2030 should be
    pathway = np.linspace(history[BASE_YEAR], target_2030, len(years_ahead))  # straight line from 2025 to that target
    gap = bau[-1] - pathway[-1]                     # [-1] = last item (2030): trend minus target
    outlook_rows.append([sector, history[2019], history[BASE_YEAR], bau[-1], target_2030, gap])  # save the row

    ax.plot(history.index, history.values, color="#247BA0", lw=2.5, label="Actual")  # blue: history
    ax.plot(years_ahead, bau, color="#D9534F", lw=2.5, ls="--", label="Trend (BAU)")  # red dashed: trend
    ax.plot(years_ahead, pathway, color="#2A9D8F", lw=2.5, ls=":", label="1.5 °C-aligned")  # green dotted: target path
    ax.fill_between(years_ahead, pathway, bau, color="#D9534F", alpha=0.12)  # shade the gap
    ax.set_title(f"{sector}\n2030 gap: {gap:,.0f} Mt CO₂e", fontsize=12, fontweight="bold")  # title with the gap
    ax.set_xlim(2005, 2030.5)                       # zoom in on 2005–2030
    ax.set_ylim(bottom=0)                           # y-axis starts at zero
    ax.grid(True, linestyle="--", alpha=0.25)       # dashed grid

axes[0].set_ylabel("Emissions (Mt CO₂e)")           # y label on the first panel
axes[0].legend(frameon=False)                       # legend on the first panel
fig.suptitle("The 2030 emissions gap: current trends vs a 1.5 °C-aligned path", fontsize=15, fontweight="bold", y=1.03)  # title
plt.tight_layout()                                  # avoid overlaps
plt.show()                                          # draw

outlook = pd.DataFrame(outlook_rows, columns=["Sector", "Emissions_2019", "Emissions_2025",  # list -> table
                                              "BAU_2030", "Pathway_2030", "Gap_Mt"])  # column names
display(outlook.round(0))                           # show the table
total_gap = outlook["Gap_Mt"].sum()                 # add up the three sector gaps
print(f"Total 2030 gap: {total_gap:,.0f} Mt CO2e per year")  # report it
print(f"The fund's {TARGET_MT_PER_YEAR} Mt target is {TARGET_MT_PER_YEAR / total_gap:.1%} of the gap "  # put the fund in perspective
      "-> one fund cannot close it, so it must choose where each dollar does the most.")  # business conclusion

# %%
# ============================================================
# CELL 16: Carbon Exposure Calculator
# ============================================================
# Exposure = emissions × carbon price = money at stake in each market.
# This is the cost for a WHOLE national sector, not one company's bill.

exposure_rows = []                                  # one row per market
for (country, sector), profile in profiles.items():  # LOOP over the 33 markets
    if sector == "Agriculture":                     # farms are not carbon-priced today
        today_price = 0  # so today's price is zero
    else:                                           # power & industry
        today_price = COUNTRY_INFO[country]["price_now"]  # today's price
    emissions_2030 = profile.forecast(FORECAST_YEAR)  # forecast 2030 emissions (Mt)
    exposure_rows.append({                          # build this market's row (US$ bn = Mt × 1e6 × US$/t ÷ 1e9)
        "Country": country,                         # country
        "Sector": sector,                           # sector
        "Current_USD_bn": profile.latest() * 1e6 * today_price / 1e9,  # today's cost
        "Announced pledges (IEA APS)": emissions_2030 * 1e6 * get_carbon_price(country, sector, "Announced pledges (IEA APS)") / 1e9,  # 2030 cost, pledges
        "Net zero (IEA NZE)": emissions_2030 * 1e6 * get_carbon_price(country, sector, "Net zero (IEA NZE)") / 1e9,  # 2030 cost, net zero
    })                                              # end of the row

exposure = pd.DataFrame(exposure_rows)              # list -> table
exposure["Repricing_Gap_USD_bn"] = exposure["Net zero (IEA NZE)"] - exposure["Current_USD_bn"]  # extra cost if net-zero prices arrive

total_now = exposure["Current_USD_bn"].sum()        # total priced today
total_nze = exposure["Net zero (IEA NZE)"].sum()    # total under net zero
top_gap = exposure.sort_values("Repricing_Gap_USD_bn", ascending=False).iloc[0]  # market with the biggest gap

show_kpi_cards([                                    # three cards using the helper from Cell 2
    ("Carbon cost priced today", f"US$ {total_now:,.0f} bn/yr", "#172554"),  # card 1
    ("Potential under net zero (2030)", f"US$ {total_nze:,.0f} bn/yr", "#7f1d1d"),  # card 2
    ("Largest repricing risk", f"{top_gap['Country']} – {top_gap['Sector']} (+US$ {top_gap['Repricing_Gap_USD_bn']:,.0f} bn/yr)", "#365314"),  # card 3
])                                                  # end of the call

fig, axes = plt.subplots(1, 2, figsize=(17, 6.5))   # two panels

heat = exposure.pivot(index="Country", columns="Sector", values="Net zero (IEA NZE)")  # reshape: rows = countries, columns = sectors
heat = heat.loc[heat.sum(axis=1).sort_values(ascending=False).index]  # order countries by total, largest first
sns.heatmap(heat, annot=True, fmt=",.0f", cmap="YlOrRd", linewidths=0.5,  # coloured grid with numbers in each cell
            cbar_kws={"label": "US$ bn per year"}, ax=axes[0])  # colour-bar label; left panel
axes[0].set_title("Potential carbon cost under net zero, 2030\n(US$ bn per year)", fontsize=12, fontweight="bold")  # title
axes[0].set_xlabel("")                              # no x label
axes[0].set_ylabel("")                              # no y label

by_country = exposure.groupby("Country")[["Current_USD_bn", "Announced pledges (IEA APS)", "Net zero (IEA NZE)"]].sum()  # totals per country
by_country = by_country.loc[heat.index]             # same order as the heatmap
by_country.plot(kind="barh", ax=axes[1], width=0.8, color=["#7F8C8D", "#F4A261", "#C0392B"])  # grouped bars: grey, orange, red
axes[1].invert_yaxis()                              # largest country on top
axes[1].set_xscale("log")                           # log scale (values from ~1 to ~1,000)
axes[1].set_title("Carbon cost today vs future scenarios (log scale)", fontsize=12, fontweight="bold")  # title
axes[1].set_xlabel("US$ bn per year (log scale)")   # x label
axes[1].set_ylabel("")                              # no y label
axes[1].legend(["Priced today (no bar = unpriced)", "Announced pledges", "Net zero"], frameon=False, loc="lower right")  # legend

plt.tight_layout()                                  # avoid overlaps
plt.show()                                          # draw

# %%
# ============================================================
# CELL 17: All investable projects & the cost curve (MACC)
# ============================================================
# Every market × every project type that fits its sector = one project.
# For each we work out: cost per tonne, tonnes per dollar, NPV, and maximum size.


def project_economics(spec, country):               # capital per tonne/yr and yearly benefit per tonne
    if spec["type"] == "power":                     # solar or wind
        mwh_per_kw = 8.76 * spec["capacity_factor"]  # MWh produced per kW per year (8,760 hours × capacity factor ÷ 1,000)
        tonnes_per_kw = mwh_per_kw * COUNTRY_INFO[country]["grid"]  # CO2 avoided per kW = MWh × grid CO2 per MWh
        capex_per_tpa = spec["capex_per_kw"] / tonnes_per_kw  # cost per kW ÷ tonnes per kW
        cash_per_kw = mwh_per_kw * POWER_PRICE_USD_MWH - spec["om_share"] * spec["capex_per_kw"]  # power sales minus upkeep
        benefit_per_t = cash_per_kw / tonnes_per_kw  # yearly cash per tonne avoided
    else:                                           # all other projects
        capex_per_tpa = spec["capex_per_tpa"]       # read straight from the catalogue
        benefit_per_t = spec["benefit_per_t"]       # read straight from the catalogue
    return capex_per_tpa, benefit_per_t             # return both numbers (as a tuple)


priority_lookup = {}                                # dictionary: (country, sector) -> priority score from Cell 14
for _, row in scorecard.iterrows():                 # LOOP over scorecard rows
    priority_lookup[(row["Country"], row["Sector"])] = row["Priority_Score"]  # store the score


def build_projects(scenario, emerging_rate=None, emerging_full_price=False):  # the two extra inputs are only for Cell 20's what-if tests
    rows = []                                       # one dictionary per project
    for (country, sector), profile in profiles.items():  # LOOP over every market
        for name, spec in INTERVENTIONS.items():    # LOOP over every project type
            if spec["sector"] != sector:            # project belongs to another sector…
                continue                            # …skip it
            if "countries" in spec and country not in spec["countries"]:  # project limited to certain countries (rice)…
                continue                            # …skip if this country isn't one of them

            capex_per_tpa, benefit_per_t = project_economics(spec, country)  # unpack the two numbers

            rate = COUNTRY_INFO[country]["discount"]  # normal cost of borrowing
            if emerging_rate is not None and country in EMERGING_FOCUS:  # WHAT-IF: cheaper finance
                rate = emerging_rate                # use the test rate instead
            force_advanced = emerging_full_price and country in EMERGING_FOCUS  # WHAT-IF: give them the advanced carbon price
            price = get_carbon_price(country, sector, scenario, force_advanced)  # carbon money per tonne

            af = annuity_factor(rate, spec["life"])  # today's value of US$1 a year over the project life
            max_tpa = spec["reach"] * profile.forecast(FORECAST_YEAR) * 1e6  # max tonnes/yr = reach × 2030 emissions

            rows.append({                           # this project's row
                "Country": country, "Sector": sector, "Project": name,  # names
                "Priority_Score": priority_lookup[(country, sector)],  # market priority (tie-breaker in Cell 18)
                "Capex_per_tpa": capex_per_tpa,     # cost to avoid 1 t per year
                "Benefit_per_t": benefit_per_t,     # yearly saving per tonne
                "Carbon_price": price,              # carbon money per tonne
                "Abatement_cost_per_t": capex_per_tpa / af - benefit_per_t,  # net cost per tonne = yearly capital charge − saving
                "Tonnes_per_USDm": 1e6 / capex_per_tpa,  # tonnes/yr avoided per US$1 million
                "NPV_per_USD": (benefit_per_t + price) * af / capex_per_tpa - 1,  # value created per US$1 invested
                "Annual_cash_per_USD": (benefit_per_t + price) / capex_per_tpa,  # yearly cash per US$1 (for payback)
                "Life": spec["life"],               # project life
                "Max_Mt": max_tpa / 1e6,            # max tonnes/yr in Mt
                "Max_invest_USDm": max_tpa * capex_per_tpa / 1e6,  # max money the project can absorb (US$ m)
            })                                      # end of the row
    return pd.DataFrame(rows)                       # all rows -> one table


projects = build_projects(SCENARIO)                 # build the 80 projects for the chosen scenario
print("Investable projects:", len(projects))        # how many
print(f"Combined potential: {projects['Max_Mt'].sum():,.0f} Mt/yr for US$ {projects['Max_invest_USDm'].sum() / 1000:,.0f} bn")  # total size
display(projects.sort_values("Abatement_cost_per_t")[["Country", "Project", "Abatement_cost_per_t",  # 10 cheapest projects
                                                      "Tonnes_per_USDm", "NPV_per_USD", "Max_Mt"]].head(10).round(2))  # pick columns, show the 10 cheapest, 2 decimals

# MACC chart: each bar is one project; width = tonnes it can avoid, height = net cost per tonne
SECTOR_COLOURS = {"Power Industry": "#F4A261", "Industrial Combustion": "#2A9D8F", "Agriculture": "#6A994E"}  # sector -> colour
macc = projects.sort_values("Abatement_cost_per_t").reset_index(drop=True)  # cheapest first
macc["x_start"] = macc["Max_Mt"].cumsum() - macc["Max_Mt"]  # where each bar starts = total width of the bars before it

fig, ax = plt.subplots(figsize=(16, 6.5))           # one wide chart
ax.bar(macc["x_start"], macc["Abatement_cost_per_t"], width=macc["Max_Mt"], align="edge",  # bars of different widths, side by side
       color=macc["Sector"].map(SECTOR_COLOURS), edgecolor="white", linewidth=0.4)  # coloured by sector

if SCENARIO != "Current policies":                  # price lines only exist for the future scenarios
    adv, emg = SCENARIO_PRICES[SCENARIO]            # unpack (advanced, emerging) prices
    ax.axhline(adv, color="#172554", ls="--")       # line at the advanced-economy price
    ax.axhline(emg, color="#7f1d1d", ls="--")       # line at the emerging-economy price
    ax.text(0, adv + 3, f"Advanced-economy carbon price ${adv}", fontsize=9, color="#172554")  # label
    ax.text(0, emg + 3, f"Emerging-economy carbon price ${emg}", fontsize=9, color="#7f1d1d")  # label

for sector, colour in SECTOR_COLOURS.items():       # LOOP to build the legend…
    ax.bar(0, 0, color=colour, label=sector)        # …an invisible bar per sector just to get a legend entry
ax.legend(frameon=False, loc="lower right")         # show the legend
ax.axhline(0, color="black", lw=0.8)                # zero line: bars below it pay for themselves
ax.set_xlabel("Cumulative emissions the fund could avoid (Mt CO₂e per year)")  # x label
ax.set_ylabel("Net cost per tonne avoided (US$)")   # y label
ax.set_title("Marginal Abatement Cost Curve — cheapest on the left; bars below a price line pay for themselves",  # chart title
             fontsize=13, fontweight="bold")        # title
plt.tight_layout()                                  # avoid overlaps
plt.show()                                          # draw

# %%
# ============================================================
# CELL 18: OPTIMIZATION ENGINE (linear programming)
# ============================================================
# In plain English, the computer solves:
#   CHOOSE  how many US$ to put in each of the 80 projects
#   TO      maximise NPV (or tonnes avoided)
#   SUBJECT TO  total ≤ budget · each country ≤ 30% · each technology ≤ 30%
#               each sector ≥ 20% · each project ≤ its maximum size
#               (return mode) tonnes avoided ≥ target
# linprog only understands "≤" rules and only MINIMISES, so:
#   • to MAXIMISE something we minimise its negative
#   • a "≥" rule is written as "≤" by multiplying both sides by −1

from scipy.optimize import linprog                  # SciPy's linear-programming solver


class OptimisationError(Exception):                 # our own error type for "no plan is possible"
    pass                                            # it needs no extra code


def optimise_portfolio(projects, budget, objective, target_mt):  # returns the best plan
    tonnes = projects["Tonnes_per_USDm"].values / 1e6  # Mt avoided per US$ m, for every project
    npv = projects["NPV_per_USD"].values            # NPV per US$, for every project

    if objective == "Maximise CO2e avoided":        # impact mode:
        priority = projects["Priority_Score"].values / 100  # tiny tie-breaker: prefer higher-priority markets
        goal = -(tonnes * 1000 + 0.001 * priority)  # minus sign = maximise tonnes
    else:                                           # return mode:
        goal = -npv                                 # minus sign = maximise NPV

    rules_left = []                                 # left side of each "≤" rule (one number per project)
    rules_right = []                                # right side of each "≤" rule (one limit)

    rules_left.append(np.ones(len(projects)))       # RULE: sum of all investments…
    rules_right.append(budget)                      # …≤ budget

    for country in projects["Country"].unique():    # RULE per country:
        rules_left.append(np.where(projects["Country"] == country, 1, 0))  # 1 for this country's projects, 0 for others
        rules_right.append(MAX_COUNTRY_SHARE * budget)  # their total ≤ 30% of budget

    for project_type in projects["Project"].unique():  # RULE per technology:
        rules_left.append(np.where(projects["Project"] == project_type, 1, 0))  # 1 for this technology
        rules_right.append(MAX_PROJECT_SHARE * budget)  # its total ≤ 30% of budget

    for sector in projects["Sector"].unique():      # RULE per sector (a "≥" rule, so multiplied by −1):
        rules_left.append(np.where(projects["Sector"] == sector, -1, 0))  # −1 for this sector's projects
        rules_right.append(-MIN_SECTOR_SHARE * budget)  # −(sector total) ≤ −20% of budget  ⇔  sector total ≥ 20%

    if objective != "Maximise CO2e avoided":        # RULE in return mode (also "≥", so × −1):
        rules_left.append(-tonnes)                  # −(tonnes avoided)…
        rules_right.append(-target_mt)              # …≤ −target  ⇔  tonnes avoided ≥ target

    limits = []                                     # each project's own range of investment
    for max_invest in projects["Max_invest_USDm"]:  # LOOP over projects
        limits.append((0, max_invest))              # between 0 and its maximum size

    result = linprog(goal, A_ub=rules_left, b_ub=rules_right, bounds=limits, method="highs")  # SOLVE

    if result.status != 0:                          # 0 = solved; anything else = no possible plan
        raise OptimisationError(result.message)     # raise our own error with the solver's reason

    plan = projects.copy()                          # copy the project table
    plan["Invest_USDm"] = np.round(result.x, 2)     # result.x = best US$ m for each project
    plan = plan[plan["Invest_USDm"] > 0.5]          # keep only projects that get money
    return plan.reset_index(drop=True)              # renumber the rows and return the plan


def portfolio_metrics(plan):                        # business KPIs for ANY plan
    invest = plan["Invest_USDm"]                    # money per project (US$ m)
    total = invest.sum()                            # total money invested
    mt = (invest * plan["Tonnes_per_USDm"]).sum() / 1e6  # Mt avoided per year
    npv = (invest * plan["NPV_per_USD"]).sum()      # total NPV (US$ m)
    cash = (invest * plan["Annual_cash_per_USD"]).sum()  # total yearly cash (US$ m)
    lifetime_mt = (invest * plan["Tonnes_per_USDm"] * plan["Life"]).sum() / 1e6  # Mt avoided over project lives
    return {"Invested_USDm": total,                 # total invested
            "Mt_avoided_per_year": mt,              # yearly impact
            "Lifetime_Mt_avoided": lifetime_mt,     # lifetime impact
            "NPV_USDm": npv,                        # value created
            "ROI_pct": 100 * npv / total,           # NPV ÷ money invested, in %
            "Payback_years": total / cash,          # years of cash needed to earn the money back
            "Capital_per_t_per_year": total / mt}   # US$ invested per tonne avoided per year


try:                                                # FIRST try exactly what management asked for
    best = optimise_portfolio(projects, BUDGET_USD_M, OBJECTIVE, TARGET_MT_PER_YEAR)  # run the optimizer
    status_note = "All constraints satisfied"       # it worked
except OptimisationError as error:                  # the target was impossible…
    print("⚠ Target cannot be met:", error)         # …explain…
    best = optimise_portfolio(projects, BUDGET_USD_M, "Maximise CO2e avoided", 0)  # …and show the max-impact plan instead
    status_note = "Target infeasible – showing max-impact plan"  # record what happened

kpi = portfolio_metrics(best)                       # KPIs of the recommended plan
target_met = kpi["Mt_avoided_per_year"] >= TARGET_MT_PER_YEAR - 0.01  # tiny tolerance for rounding

print("Status:", status_note)                       # which version ran
for key, value in kpi.items():                      # LOOP over the KPIs
    print(f"  {key:<24}: {value:,.2f}")             # print name (padded to 24 characters) and value
print("  Target met?", "YES" if target_met else "NO")  # one-line if/else

display(best.sort_values("Invest_USDm", ascending=False)[["Country", "Sector", "Project",  # the plan, biggest first
                                                          "Invest_USDm", "Max_invest_USDm", "NPV_per_USD"]].round(2))  # columns to show, rounded

fig = px.sunburst(best, path=["Sector", "Project", "Country"], values="Invest_USDm",  # rings: sector → project → country
                  color="Sector", color_discrete_map=SECTOR_COLOURS,  # sector colours
                  title=f"Optimised allocation of US$ {kpi['Invested_USDm'] / 1000:,.1f} bn ({OBJECTIVE})")  # title
fig.update_traces(textinfo="label+percent root")    # show name and % of the whole budget
fig.update_layout(height=650, title_x=0.5)          # size, centred title
fig.show()                                          # display
# %%
# ============================================================
# CELL 19: Does optimisation add value? — strategy comparison
# ============================================================
# Same budget, same projects: compare the optimizer with two simple
# rules a manager might use without analytics.


def equal_split(projects, budget):                  # RULE 1: share the money out evenly
    money_per_market = budget / len(profiles)       # same amount for each of the 33 markets
    amounts = []                                    # amount for each project
    for _, row in projects.iterrows():              # LOOP over projects
        same_market = projects[(projects["Country"] == row["Country"]) & (projects["Sector"] == row["Sector"])]  # projects in this market
        share = money_per_market / len(same_market)  # split the market's money equally between its projects
        amounts.append(min(share, row["Max_invest_USDm"]))  # but never more than the project's maximum
    plan = projects.copy()                          # copy the table
    plan["Invest_USDm"] = amounts                   # add the amounts
    return plan                                     # the plan


def biggest_emitters_first(projects, budget):       # RULE 2: fund the biggest polluting markets first
    plan = projects.copy()                          # copy the table
    sizes = []                                      # each project's market size
    for _, row in plan.iterrows():                  # LOOP over projects
        sizes.append(profiles[(row["Country"], row["Sector"])].latest())  # look up 2025 emissions of its market
    plan["Size"] = sizes                            # add as a column
    plan = plan.sort_values(["Size", "Project"], ascending=[False, True])  # biggest markets first

    money_left = budget                             # money not yet spent
    spent_by_country = {}                           # dictionary: country -> money spent so far
    amounts = []                                    # amount for each project
    for _, row in plan.iterrows():                  # LOOP in size order
        already = spent_by_country.get(row["Country"], 0)  # money this country already has (0 if none)
        room = MAX_COUNTRY_SHARE * budget - already  # how much more this country may receive
        amount = max(0, min(row["Max_invest_USDm"], money_left, room))  # the smallest of: project max, money left, country room
        amounts.append(amount)                      # record it
        money_left = money_left - amount            # reduce the money left
        spent_by_country[row["Country"]] = already + amount  # update the country's total
    plan["Invest_USDm"] = amounts                   # add the amounts
    return plan                                     # the plan


def respects_limits(plan, budget):                  # True if a plan obeys all the fund's risk rules
    for country in plan["Country"].unique():        # check every country
        if plan[plan["Country"] == country]["Invest_USDm"].sum() > MAX_COUNTRY_SHARE * budget + 1:  # over the cap (+US$1m rounding)?
            return False                            # rule broken
    for project_type in plan["Project"].unique():   # check every technology
        if plan[plan["Project"] == project_type]["Invest_USDm"].sum() > MAX_PROJECT_SHARE * budget + 1:  # over the cap?
            return False                            # rule broken
    for sector in df_clean["Sector"].unique():      # check every sector
        if plan[plan["Sector"] == sector]["Invest_USDm"].sum() < MIN_SECTOR_SHARE * budget - 1:  # under the minimum?
            return False                            # rule broken
    return True                                     # all rules respected


strategies = {}                                     # dictionary: strategy name -> plan
strategies["Equal split"] = equal_split(projects, BUDGET_USD_M)  # rule 1
strategies["Biggest emitters first"] = biggest_emitters_first(projects, BUDGET_USD_M)  # rule 2
strategies["Optimised – impact"] = optimise_portfolio(projects, BUDGET_USD_M, "Maximise CO2e avoided", 0)  # optimizer, max tonnes
try:                                                # optimizer, max NPV with the target…
    strategies["Optimised – return"] = optimise_portfolio(projects, BUDGET_USD_M, "Maximise financial return (NPV)", TARGET_MT_PER_YEAR)  # with the target
except OptimisationError:                           # …or without it if the target is impossible
    strategies["Optimised – return"] = optimise_portfolio(projects, BUDGET_USD_M, "Maximise financial return (NPV)", 0)  # without the target

rows = []                                           # one row of KPIs per strategy
for name, plan in strategies.items():               # LOOP over the 4 strategies
    row = portfolio_metrics(plan)                   # its KPIs (a dictionary)
    row["Strategy"] = name                          # add its name
    if respects_limits(plan, BUDGET_USD_M):         # check the risk rules
        row["Within_risk_limits"] = "Yes"  # obeys all rules
    else:  # otherwise…
        row["Within_risk_limits"] = "No"  # …it breaks at least one rule
    rows.append(row)                                # add to the list
comparison = pd.DataFrame(rows).set_index("Strategy")  # list -> table, with strategy names as row labels
display(comparison.round(1))                        # show it

labels = []                                         # x-axis labels for the charts
for name in comparison.index:                       # LOOP over strategy names
    if comparison.loc[name, "Within_risk_limits"] == "No":  # if the strategy breaks the rules…
        labels.append(name + "\n(breaks limits)")   # …say so under its name
    else:  # otherwise…
        labels.append(name)                         # otherwise just the name
colours = ["#95A5A6", "#BDC3C7", "#C0392B", "#2A9D8F"]  # one colour per strategy

fig, axes = plt.subplots(1, 3, figsize=(17, 5))     # three charts

bars = axes[0].bar(labels, comparison["Mt_avoided_per_year"], color=colours)  # chart 1: tonnes avoided
axes[0].bar_label(bars, fmt="%.1f", padding=3)      # value labels
axes[0].axhline(TARGET_MT_PER_YEAR, color="black", ls="--", lw=1)  # dashed line at the target
axes[0].set_title("Emissions avoided (Mt CO₂e / year)", fontsize=12, fontweight="bold")  # title

bars = axes[1].bar(labels, comparison["NPV_USDm"] / 1000, color=colours)  # chart 2: NPV in US$ bn
axes[1].bar_label(bars, fmt="%.1f", padding=3)      # value labels
axes[1].set_title("Net present value (US$ bn)", fontsize=12, fontweight="bold")  # title

bars = axes[2].bar(labels, comparison["Capital_per_t_per_year"], color=colours)  # chart 3: capital per tonne
axes[2].bar_label(bars, fmt="%.0f", padding=3)      # value labels
axes[2].set_title("Capital needed per tonne/yr (US$)", fontsize=12, fontweight="bold")  # title

for ax in axes:                                     # LOOP over the three charts
    ax.tick_params(axis="x", rotation=20)           # tilt the labels
fig.suptitle(f"Same US$ {BUDGET_USD_M / 1000:,.0f} bn, very different results — the value of optimisation",  # overall title
             fontsize=15, fontweight="bold", y=1.03)  # overall title
plt.tight_layout()                                  # avoid overlaps
plt.show()                                          # draw

uplift = comparison.loc["Optimised – impact", "Mt_avoided_per_year"] / comparison.loc["Equal split", "Mt_avoided_per_year"]  # times more tonnes
print(f"The impact-optimised plan avoids {uplift:.1f}x more emissions than an equal split.")  # report

# %%
# ============================================================
# CELL 20: Stress tests
# ============================================================
# (a) What if the budget were smaller or bigger?
# (b) What is our SAME plan worth if carbon prices turn out differently?
# (c) What would make return-seeking money go to emerging markets?

frontier_rows = []                                  # (a) one row per budget
for budget in range(4000, 80001, 4000):             # LOOP: US$4 bn to US$80 bn in US$4 bn steps
    plan = optimise_portfolio(projects, budget, "Maximise CO2e avoided", 0)  # best impact plan at this budget
    m = portfolio_metrics(plan)                     # its KPIs
    frontier_rows.append([budget, m["Mt_avoided_per_year"], m["Capital_per_t_per_year"]])  # save the results
frontier = pd.DataFrame(frontier_rows, columns=["Budget_USDm", "Mt", "Capital_per_t"])  # list -> table

robust_rows = []                                    # (b) one row per scenario
for scenario in SCENARIO_PRICES:                    # LOOP over the 3 scenario names
    priced = build_projects(scenario)               # project economics under this scenario
    same_plan = best[["Country", "Sector", "Project", "Invest_USDm"]].merge(priced, on=["Country", "Sector", "Project"])  # OUR amounts + this scenario's economics
    m = portfolio_metrics(same_plan)                # KPIs of our plan in this scenario
    robust_rows.append([scenario, m["NPV_USDm"] / 1000, m["ROI_pct"], m["Payback_years"]])  # save NPV (US$ bn), ROI, payback
robustness = pd.DataFrame(robust_rows, columns=["Scenario", "NPV_USD_bn", "ROI_pct", "Payback_years"])  # list -> table


def emerging_share(emerging_rate, emerging_full_price):  # (c) % of budget the optimizer sends to EMERGING_FOCUS
    test_projects = build_projects(SCENARIO, emerging_rate, emerging_full_price)  # projects under the what-if
    plan = optimise_portfolio(test_projects, BUDGET_USD_M, OBJECTIVE, TARGET_MT_PER_YEAR)  # same settings as our plan
    money_there = plan[plan["Country"].isin(EMERGING_FOCUS)]["Invest_USDm"].sum()  # money going to the 4 countries
    return 100 * money_there / plan["Invest_USDm"].sum()  # as a % of everything invested


lever_tests = [("Today's terms", None, False),      # LIST of TUPLES: (label, test borrowing rate, full carbon price?)
               ("Cheaper finance", 0.06, False),    # borrowing cost 10% -> 6% (e.g. development-bank guarantees)
               ("Full carbon value", None, True),   # earn the advanced-economy carbon price (international credits)
               ("Both levers", 0.06, True)]         # both together
lever_rows = []                                     # results
for label, rate, full_price in lever_tests:         # LOOP: unpack each tuple
    try:                                            # run the test
        lever_rows.append([label, emerging_share(rate, full_price)])  # save (label, %)
    except OptimisationError:                       # if impossible…
        print("Skipped lever:", label)              # …skip it
finance_test = pd.DataFrame(lever_rows, columns=["Lever", "Share_to_EMDE_pct"])  # list -> table

fig, axes = plt.subplots(1, 3, figsize=(19, 5.5))   # three panels

ax = axes[0]                                        # LEFT: budget test
ax.plot(frontier["Budget_USDm"] / 1000, frontier["Mt"], marker="o", color="#247BA0", lw=2.5)  # tonnes vs budget
ax.axvline(BUDGET_USD_M / 1000, color="grey", ls="--")  # our chosen budget
ax.axhline(TARGET_MT_PER_YEAR, color="#C0392B", ls=":")  # the target
ax2 = ax.twinx()                                    # a second y-axis on the right, sharing the same x-axis
ax2.plot(frontier["Budget_USDm"] / 1000, frontier["Capital_per_t"], color="#E67E22", ls="--")  # capital per tonne (orange)
ax2.set_ylabel("Capital per tonne/yr (US$, orange dashed)", color="#E67E22")  # right-hand label
ax2.grid(False)                                     # no second grid
ax.set_xlabel("Budget (US$ bn)")                    # x label
ax.set_ylabel("Emissions avoided (Mt CO₂e / year)")  # left label
ax.set_title("Scaling the fund: cheapest options run out,\ncost per tonne rises", fontsize=12, fontweight="bold")  # title

ax = axes[1]                                        # MIDDLE: carbon-price risk
short_names = ["Today's prices", "Pledges (APS)", "Net zero (NZE)"]  # shorter labels, same order as SCENARIO_PRICES
bars = ax.bar(short_names, robustness["NPV_USD_bn"], color="#2A9D8F")  # NPV of our plan in each scenario
ax.bar_label(bars, fmt="US$ %.1f bn", padding=3)    # value labels
ax.axhline(0, color="black", lw=0.8)                # zero line
ax.set_ylabel("NPV of recommended plan (US$ bn)")   # label
ax.set_title("Carbon-price risk: the SAME plan in each scenario", fontsize=12, fontweight="bold")  # title

ax = axes[2]                                        # RIGHT: policy levers
bars = ax.bar(finance_test["Lever"], finance_test["Share_to_EMDE_pct"], color="#2980B9")  # % to emerging markets
ax.bar_label(bars, fmt="%.0f%%", padding=3)         # "13%" labels (%% prints a % sign)
ax.set_ylim(0, 100)                                 # 0–100%
ax.set_ylabel("% of budget to India, Indonesia,\nBrazil & South Africa")  # label
ax.set_title("What would pull return-seeking capital\ninto emerging markets?", fontsize=12, fontweight="bold")  # title
ax.tick_params(axis="x", rotation=15)               # tilt labels

plt.tight_layout()                                  # avoid overlaps
plt.show()                                          # draw
display(robustness.round(2))                        # scenario table
display(finance_test.round(1))                      # lever table

# %%
# ============================================================
# CELL 21: RECOMMENDED BUSINESS ACTION — dashboard
# ============================================================

by_country_alloc = best.groupby("Country")["Invest_USDm"].sum().sort_values(ascending=False)  # money per country, largest first
by_sector_alloc = best.groupby("Sector")["Invest_USDm"].sum()  # money per sector
best["Mt"] = best["Invest_USDm"] * best["Tonnes_per_USDm"] / 1e6  # Mt avoided by each project
by_project_mt = best.groupby("Project")["Mt"].sum().sort_values()  # Mt per project type, smallest first
downside = robustness.loc[0, "NPV_USD_bn"]          # row 0 = "Current policies": NPV if carbon prices stay at today's level

if target_met:                                      # colour of the target card: green if met…
    target_colour = "#166534"  # green
else:                                               # …red if not
    target_colour = "#7f1d1d"  # red

show_kpi_cards([                                    # six KPI cards using the helper from Cell 2
    ("Invest", f"US$ {kpi['Invested_USDm'] / 1000:,.1f} bn", "#172554"),  # money
    ("CO₂e avoided", f"{kpi['Mt_avoided_per_year']:,.1f} Mt/yr", "#164e63"),  # yearly impact
    ("Net present value", f"US$ {kpi['NPV_USDm'] / 1000:,.1f} bn", "#365314"),  # value
    ("ROI · payback", f"{kpi['ROI_pct']:.0f}% · {kpi['Payback_years']:.1f} yrs", "#365314"),  # return and payback
    (f"Target {TARGET_MT_PER_YEAR} Mt/yr", "MET" if target_met else "NOT MET", target_colour),  # target status
    ("NPV at today's carbon prices", f"US$ {downside:,.1f} bn", "#3f3f46"),  # downside case
])                                                  # end of the call

fig, axes = plt.subplots(1, 2, figsize=(16, 5.5))   # two charts
bars = axes[0].barh(by_country_alloc.index[::-1], by_country_alloc.values[::-1] / 1000, color="#247BA0")  # money per country, largest on top
axes[0].bar_label(bars, fmt="US$ %.2f bn", padding=4, fontsize=9)  # value labels
axes[0].axvline(MAX_COUNTRY_SHARE * BUDGET_USD_M / 1000, color="#C0392B", ls="--")  # red line at the country cap
axes[0].set_title("Where the money goes (red line = country limit)", fontsize=12, fontweight="bold")  # title
axes[0].set_xlabel("US$ bn")                        # x label
axes[0].margins(x=0.2)                              # room for labels

bar_colours = []                                    # one colour per project type
for project_name in by_project_mt.index:            # LOOP over project types
    sector = INTERVENTIONS[project_name]["sector"]  # look up its sector
    bar_colours.append(SECTOR_COLOURS[sector])      # use that sector's colour
bars = axes[1].barh(by_project_mt.index, by_project_mt.values, color=bar_colours)  # Mt per project type
axes[1].bar_label(bars, fmt="%.1f Mt", padding=4, fontsize=9)  # value labels
axes[1].set_title("What the money buys (Mt CO₂e avoided per year)", fontsize=12, fontweight="bold")  # title
axes[1].margins(x=0.2)                              # room for labels
plt.tight_layout()                                  # avoid overlaps
plt.show()                                          # draw

# Recommendations written automatically by if/elif/else rules
recommendations = []                                # list of sentences

recommendations.append(f"Commit US$ {kpi['Invested_USDm'] / 1000:,.1f} bn across {best['Country'].nunique()} countries and "  # rec 1: total, number of countries…
                       f"{best['Project'].nunique()} project types, led by {by_country_alloc.index[0]} "  # …number of project types and the lead country…
                       f"(US$ {by_country_alloc.iloc[0] / 1000:,.1f} bn).")  # 1: the headline plan

recommendations.append(f"The single biggest lever is '{by_project_mt.index[-1]}' "  # rec 2: the project type avoiding the most tonnes…
                       f"({by_project_mt.iloc[-1]:,.1f} Mt/yr avoided).")  # 2: the biggest project type (last = largest)

if target_met:                                      # 3: target
    recommendations.append(f"The {TARGET_MT_PER_YEAR} Mt/yr target is achievable within budget "  # rec 3a: target met…
                           f"({kpi['Mt_avoided_per_year']:,.1f} Mt/yr).")  # …with the achieved tonnes
else:  # target not met:
    shortfall = TARGET_MT_PER_YEAR - kpi["Mt_avoided_per_year"]  # how much is missing
    recommendations.append(f"Target missed by {shortfall:,.1f} Mt/yr: raise the budget, relax the "  # rec 3b: say by how much…
                           "country limit, or lower the target.")  # …and what to change

if downside < 0:                                    # 4: carbon-price risk — loses money at today's prices
    recommendations.append("The plan only creates value if carbon prices rise: hedge with contracts "  # rec 4a: loses money at today's prices…
                           "for difference, offtake agreements or phased investment.")  # …so reduce that risk
elif downside < 0.5 * kpi["NPV_USDm"] / 1000:       # still positive but loses over half its value
    recommendations.append("The plan stays profitable at today's carbon prices but loses most of its "  # rec 4b: small profit at today's prices…
                           "upside – stage investments and track carbon-price policy closely.")  # …so invest in stages
else:                                               # keeps most of its value
    recommendations.append("The plan is robust: profitable even at today's carbon prices.")  # rec 4c: keeps most of its value

priority_rows = scorecard[(scorecard["Quadrant"] == "Priority: large & growing") & (scorecard["Country"].isin(EMERGING_FOCUS))]  # priority markets in the 4 countries
priority_markets = list(priority_rows["Market"].head(3))  # top 3 names
share_today = finance_test.loc[0, "Share_to_EMDE_pct"]  # row 0 = "Today's terms"
best_row = finance_test.loc[finance_test["Share_to_EMDE_pct"].idxmax()]  # the lever with the highest share
if best_row["Share_to_EMDE_pct"] > share_today + 10:  # 5: a lever makes a big difference (> 10 points)
    recommendations.append(f"Only {share_today:.0f}% of the budget reaches India, Indonesia, Brazil and South Africa, "  # rec 5: the problem…
                           f"although they hold top-priority markets ({', '.join(priority_markets)}). "  # …why it matters (names joined with commas)…
                           f"'{best_row['Lever']}' would raise this to {best_row['Share_to_EMDE_pct']:.0f}% – partner with "  # …the lever that fixes it…
                           "development banks and secure international carbon-credit buyers for these markets.")  # …and the action
else:                                               # no lever helps much
    recommendations.append(f"Keep a pipeline in priority markets: {', '.join(priority_markets)}.")  # rec 5 (fallback)

number = 1                                          # counter for numbering
for rec in recommendations:                         # LOOP over the sentences
    print(f"{number}. {rec}")                       # print "1. …", "2. …"
    number = number + 1                             # next number

# %%
# ============================================================
# CELL 22: Company lens — how ONE company should use these results
# ============================================================
# National data = the company's operating environment. The company's own
# emissions must come from its own records. Change the form values below.

# Company name (text box)
COMPANY_NAME = "Illustrative manufacturer"  # @param {type:"string"}
# Country (dropdown)
COMPANY_COUNTRY = "India"  # @param ["Australia", "Brazil", "Canada", "China", "Germany", "India", "Indonesia", "Japan", "South Africa", "United Kingdom", "United States"]
# Sector (dropdown)
COMPANY_SECTOR = "Industrial Combustion"  # @param ["Agriculture", "Industrial Combustion", "Power Industry"]
# The company's OWN yearly emissions (Mt CO2e)
COMPANY_EMISSIONS_MT = 2.0  # @param {type:"number"}
# Its reduction target by 2030 (%)
COMPANY_CUT_PCT = 30  # @param {type:"number"}

market = profiles[(COMPANY_COUNTRY, COMPANY_SECTOR)]  # the company's national market (a MarketProfile object)

years_left = FORECAST_YEAR - BASE_YEAR              # 5 years to 2030
required_rate = ((1 - COMPANY_CUT_PCT / 100) ** (1 / years_left) - 1) * 100  # yearly % change needed, e.g. 0.70^(1/5) − 1 = −6.9%

bill_rows = []                                      # the company's own carbon bill in each scenario
for scenario in SCENARIO_PRICES:                    # LOOP over scenarios
    price = get_carbon_price(COMPANY_COUNTRY, COMPANY_SECTOR, scenario)  # carbon price for its country/sector
    bill_rows.append([scenario, price, price * COMPANY_EMISSIONS_MT])  # Mt × US$/t = US$ million
company_exposure = pd.DataFrame(bill_rows, columns=["Scenario", "Carbon price (US$/t)", "Company carbon bill (US$ m/yr)"])  # list -> table

options = projects[(projects["Country"] == COMPANY_COUNTRY) & (projects["Sector"] == COMPANY_SECTOR)]  # projects for its country & sector
options = options[["Project", "Abatement_cost_per_t", "Capex_per_tpa"]].sort_values("Abatement_cost_per_t")  # cheapest first

print(f"{COMPANY_NAME} — {COMPANY_COUNTRY}, {COMPANY_SECTOR}, {COMPANY_EMISSIONS_MT} Mt CO2e/yr")  # header
print(f"• National sector: {market.latest():,.0f} Mt, trend {market.cagr_recent():+.1f}%/yr ({market.momentum()})")  # context
print(f"• Company target : -{COMPANY_CUT_PCT}% by 2030 = {required_rate:+.1f}%/yr")  # required pace
print(f"• Gap vs national trend: {required_rate - market.cagr_recent():+.1f} percentage points per year "  # difference between company and national pace
      "-> the firm must do much better than its national sector")  # what it means
display(company_exposure.round(1))                  # bill table
print("Cheapest options for this company:")         # heading
display(options.round(1))                           # options table

# %%
# ============================================================
# CELL 23: Export results — Excel workbook + executive summary
# ============================================================
EXCEL_FILE = "carbon_investment_plan.xlsx"          # workbook name
SUMMARY_FILE = "executive_summary.txt"              # text file name

assumption_rows = []                                # project assumptions as rows
for name, spec in INTERVENTIONS.items():            # LOOP over project types
    if spec["type"] == "power":                     # solar/wind store cost per kW
        capex, unit = spec["capex_per_kw"], "per kW"  # two values assigned at once (a tuple)
    else:                                           # others store cost per tonne/yr
        capex, unit = spec["capex_per_tpa"], "per t/yr"  # two values assigned at once
    assumption_rows.append([name, spec["sector"], capex, unit, spec["life"], spec["reach"]])  # add the row
assumptions = pd.DataFrame(assumption_rows, columns=["Project", "Sector", "Capex_USD", "Capex_unit", "Life_years", "Reach_share"])  # table

country_rows = []                                   # country assumptions as rows
for country, info in COUNTRY_INFO.items():          # LOOP over countries
    country_rows.append([country, info["group"], info["price_now"], info["discount"], info["grid"]])  # add the row
country_table = pd.DataFrame(country_rows, columns=["Country", "group", "price_now", "discount", "grid"])  # table
sources_table = pd.DataFrame(DATA_SOURCES, columns=["Item", "Source"])  # list of tuples -> table

try:                                                # writing files can fail (e.g. the file is open in Excel)
    with pd.ExcelWriter(EXCEL_FILE, engine="openpyxl") as writer:  # open the workbook ("with" closes it safely)
        best.to_excel(writer, sheet_name="Recommended_Portfolio", index=False)  # sheet 1
        comparison.to_excel(writer, sheet_name="Strategy_Comparison")  # sheet 2
        scorecard.to_excel(writer, sheet_name="Market_Scorecard", index=False)  # sheet 3
        exposure.to_excel(writer, sheet_name="Carbon_Exposure", index=False)  # sheet 4
        projects.to_excel(writer, sheet_name="All_Projects", index=False)  # sheet 5
        robustness.to_excel(writer, sheet_name="Scenario_Stress_Test", index=False)  # sheet 6
        assumptions.to_excel(writer, sheet_name="Project_Assumptions", index=False)  # sheet 7
        country_table.to_excel(writer, sheet_name="Country_Assumptions", index=False)  # sheet 8
        sources_table.to_excel(writer, sheet_name="Data_Sources", index=False)  # sheet 9
    print("✔ Saved", EXCEL_FILE)                    # success
except (PermissionError, OSError) as error:         # file locked or disk problem
    print("✘ Could not save Excel file:", error)    # report instead of crashing

lines = []                                          # the summary, one line at a time
lines.append("CARBON STRATEGY & INVESTMENT OPTIMIZER — EXECUTIVE SUMMARY")  # heading
lines.append("=" * 62)                              # a row of 62 "=" signs
lines.append(f"Settings: budget US$ {BUDGET_USD_M / 1000:,.1f} bn | target {TARGET_MT_PER_YEAR} Mt/yr | {SCENARIO} | {OBJECTIVE}")  # the settings used
lines.append("")                                    # blank line
lines.append("KEY FINDINGS")  # section heading
lines.append(f"- Power Industry is {leading_share:.1f}% of 2025 sample emissions ({leading_value:,.0f} Mt CO2e).")  # Cell 4
lines.append(f"- On current trends the sample is {total_gap:,.0f} Mt/yr above a 1.5C-aligned path in 2030.")  # Cell 15
lines.append(f"- Carbon cost priced today: US$ {total_now:,.0f} bn/yr; under net-zero prices: US$ {total_nze:,.0f} bn/yr.")  # Cell 16
lines.append(f"- Largest repricing risk: {top_gap['Country']} {top_gap['Sector']} (+US$ {top_gap['Repricing_Gap_USD_bn']:,.0f} bn/yr).")  # Cell 16
lines.append(f"- Optimised plan avoids {uplift:.1f}x more CO2e than an equal split of the same budget.")  # Cell 19
lines.append("")  # blank line
lines.append("RECOMMENDED PLAN")  # section heading
lines.append(f"- Invest US$ {kpi['Invested_USDm'] / 1000:,.1f} bn -> {kpi['Mt_avoided_per_year']:,.1f} Mt CO2e avoided per year")  # Cell 18
lines.append(f"- NPV US$ {kpi['NPV_USDm'] / 1000:,.1f} bn | ROI {kpi['ROI_pct']:.0f}% | payback {kpi['Payback_years']:.1f} years")  # Cell 18
lines.append(f"- NPV if carbon prices stay at today's level: US$ {downside:,.1f} bn")  # Cell 20
lines.append("")  # blank line
lines.append("ACTIONS")  # section heading
for i in range(len(recommendations)):               # LOOP over the recommendations by position
    lines.append(f"{i + 1}. {recommendations[i]}")  # number them from 1
lines.append("")  # blank line
lines.append("CAVEAT: national sector emissions are used to size markets; they are not company")  # caveat, line 1
lines.append("emissions. Cost figures are planning assumptions to be replaced by project quotes.")  # caveat, line 2
lines.append("")  # blank line
lines.append("DATA SOURCES")  # section heading
for item, source in DATA_SOURCES:                   # LOOP: unpack each (item, source) tuple
    lines.append(f"- {item}: {source}")             # one line per source

try:                                                # write the text file
    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:  # "w" = write; utf-8 handles symbols like "–"
        f.write("\n".join(lines))                   # join the lines with line breaks and write them
    print("✔ Saved", SUMMARY_FILE)                  # success
except OSError as error:                            # disk/permission problem
    print("✘ Could not save summary:", error)       # report it

with open(SUMMARY_FILE, encoding="utf-8") as f:     # read the file back…
    print(f.read())                                 # …and print it, to prove it was saved

try:                                                # download both files (works only in Google Colab)
    from google.colab import files as colab_files   # Colab's file helper
    colab_files.download(EXCEL_FILE)                # download the workbook
    colab_files.download(SUMMARY_FILE)              # download the summary
except ImportError:                                 # not running in Colab
    print("(Not running in Colab – files saved in the working folder.)")  # explain
