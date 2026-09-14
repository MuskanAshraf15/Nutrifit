import pandas as pd
import mysql.connector

# CSV file ka naam/path
csv_file = "project_data_set"

# CSV read karo
csv_file = r"C:\Users\Muhamad Muskan Qadri\Downloads\Project_data_set(1).csv"

df = pd.read_csv(csv_file)

print("CSV loaded successfully")
print("Total rows:", len(df))
print(df.head())


# MySQL connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="WJ28@krhps",
    database="food_recommendation"
)

cursor = db.cursor()

# Cost mapping
# CSV mein Cost = Low / Medium / High
# MySQL Cost column DECIMAL hai

cost_map = {
    "Low": 225,
    "Medium": 550,
    "High": 750
}



# Existing foods table mein data insert karo

query = """
INSERT INTO foods
(
    Food_ID,
    Food_Name,
    Meal_Type,
    Calories,
    Protein_g,
    Carbs_g,
    Fat_g,
    Serving_g,
    Cost,
    Preference,
    Activity,
    Goal,
    Estimated_Cost
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""


# CSV rows insert karo
for _, row in df.iterrows():

    # Cost Low/Medium/High ko numeric value mein convert karo
    cost = cost_map.get(
        str(row["Cost"]).strip(),
        550
    )

    cursor.execute(
        query,
        (
            int(row["Food_ID"]),
            row["Food_Name"],
            row["Meal_Type"],
            float(row["Calories"]),
            float(row["Protein (g)"]),
            float(row["Carbs (g)"]),
            float(row["Fat (g)"]),
            float(row["Serving (g)"]),
            cost,
            row["Preference"],
            row["Activity"],
            row["Goal"],
            float(row["Estimated Cost"])
        )
    )



# Save changes
db.commit()

print("Food dataset imported successfully!")
print("Total rows imported:", len(df))


# Close connection

cursor.close()
db.close()