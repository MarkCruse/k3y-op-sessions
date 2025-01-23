import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime, timedelta
from io import StringIO

# Step 1: Define the URL of the webpage containing the table
url = 'https://www.skccgroup.com/k3y/slot_list.php'

# Step 2: Fetch the HTML content of the webpage
response = requests.get(url)
html_content = response.content

# Step 3: Parse the HTML content using BeautifulSoup
soup = BeautifulSoup(html_content, 'lxml')

# Step 4: Extract the first table from the webpage
table = soup.find('table')

# Step 5: Convert the HTML table to a string and wrap it in StringIO
html_string = str(table)
html_io = StringIO(html_string)

# Step 6: Read the table into a pandas DataFrame
df = pd.read_html(html_io)[0]

# Convert all columns in the DataFrame to strings
df = df.astype(str)

# Step 7: Split the 'Operator ID' column into four separate columns
try:
    df[['Callsign', 'Name', 'State', 'SKCC']] = df['Operator ID'].str.split('-', n=3, expand=True)
except ValueError as e:
    print(f"Error splitting 'Operator ID': {e}")
    print("Ensure all rows in 'Operator ID' have the correct format (e.g., 'Callsign-Name-State-SKCC').")

# Filter rows where 'Callsign' matches 'KC4NO'
df = df[df['Callsign'] == 'KC4NO']

# Keep only relevant columns
df = df[['Jan', 'Start', 'End', 'Callsign']]

# Reset the DataFrame index
df.reset_index(drop=True, inplace=True)

# Convert 'Start' and 'End' columns from UTC to EST
def convert_to_est(utc_time):
    """Convert UTC time to EST (subtract 5 hours) and return in 12-hour format."""
    utc_datetime = datetime.strptime(utc_time, '%H:%M')
    est_datetime = utc_datetime - timedelta(hours=5)
    return est_datetime.strftime('%I:%M %p')  # 12-hour format with AM/PM

df['Start(EST)'] = df['Start'].apply(convert_to_est)
df['End(EST)'] = df['End'].apply(convert_to_est)

# Convert and format the Date column
def format_date(date_str):
    """Format date as 'Mon 1-22'."""
    try:
        day = int(date_str)
        current_year = datetime.now().year
        if datetime.now().month == 12:
            current_year += 1 
        date_obj = datetime(year=current_year, month=1, day=day) 
        return date_obj.strftime('%a %-m-%d') 
    except ValueError:
        print(f"Invalid date string: {date_str}")
        return None

# Ensure the 'Jan' column is treated as a string
df['Date'] = df['Jan'].astype(str).apply(format_date)

# Combine times and reorder columns
df['UTC Time'] = df['Start'] + ' - ' + df['End']
df['EST Time'] = df['Start(EST)'] + ' - ' + df['End(EST)']
df = df[['Date', 'UTC Time', 'EST Time', 'Callsign']]

# Print the header with 5 spaces between columns
header = "Date           UTC Time            EST Time                 Callsign"
header2 = "--------       -------------       -------------------      ------"
print(header)
print(header2)

# Print each row 
for _, row in df.iterrows():
    print(f"{row['Date']:15}{row['UTC Time']:20}{row['EST Time']:25}{row['Callsign']}")
    print()

# Print the final DataFrame
#print(df[['Date','Start(UTC)','End(UTC)','Start(EST)','End(EST)','Callsign']])

# Optional: Save the DataFrame to a CSV file for future reference
# df.to_csv('filtered_schedule.csv', index=False)
