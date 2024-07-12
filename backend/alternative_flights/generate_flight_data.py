import os
import json
import random
from datetime import datetime, timedelta

def generate_flight_data(start_date_str):
    # Convert input string to datetime
    start_date = datetime.strptime(start_date_str, "%d-%m-%Y %H:%M:%S")

    # List of airports
    airports = ["SFO", "LAX", "NYC", "CHI", "MIA", "DFW", "SEA", "BOS"]

    # List of airlines with code, name, and flight number range
    airlines = [
        {"code": "AA", "name": "American Airlines", "flight_range": (1000, 2000)},
        {"code": "DL", "name": "Delta Air Lines", "flight_range": (2000, 3000)},
        {"code": "UA", "name": "United Airlines", "flight_range": (3000, 4000)},
        {"code": "WN", "name": "Southwest Airlines", "flight_range": (4000, 5000)},
        {"code": "B6", "name": "JetBlue Airways", "flight_range": (5000, 6000)},
        {"code": "AS", "name": "Alaska Airlines", "flight_range": (6000, 7000)},
        {"code": "NK", "name": "Spirit Airlines", "flight_range": (7000, 8000)},
        {"code": "F9", "name": "Frontier Airlines", "flight_range": (8000, 9000)}
    ]

    # Approximate distances between airports (in miles)
    distances = {
        ("SFO", "LAX"): 337, ("SFO", "NYC"): 2572, ("SFO", "CHI"): 1847, ("SFO", "MIA"): 2582, ("SFO", "DFW"): 1464, ("SFO", "SEA"): 679, ("SFO", "BOS"): 2704,
        ("LAX", "NYC"): 2475, ("LAX", "CHI"): 1745, ("LAX", "MIA"): 2342, ("LAX", "DFW"): 1235, ("LAX", "SEA"): 954, ("LAX", "BOS"): 2611,
        ("NYC", "CHI"): 740, ("NYC", "MIA"): 1090, ("NYC", "DFW"): 1372, ("NYC", "SEA"): 2414, ("NYC", "BOS"): 215,
        ("CHI", "MIA"): 1197, ("CHI", "DFW"): 802, ("CHI", "SEA"): 1721, ("CHI", "BOS"): 867,
        ("MIA", "DFW"): 1121, ("MIA", "SEA"): 2724, ("MIA", "BOS"): 1258,
        ("DFW", "SEA"): 1660, ("DFW", "BOS"): 1551,
        ("SEA", "BOS"): 2489
    }

    # Generate flight data
    flight_data = {}

    for airport in airports:
        flight_data[airport] = {}
        # Randomly select 3-4 destination airports
        destinations = random.sample([a for a in airports if a != airport], random.randint(3, 4))
        
        for dest in destinations:
            flight_data[airport][dest] = []
            
            num_days = 7
            num_flights_per_day = 8

            for day in range(num_days):
                for _ in range(num_flights_per_day):
                    # Generate random departure time within the current day
                    dep_time = start_date + timedelta(days=day, hours=random.uniform(0, 23))
                    
                    # Get distance and calculate duration
                    distance = distances.get((airport, dest)) or distances.get((dest, airport), 1000)
                    duration_hours = distance / 500  # Assuming average speed of 500 miles per hour
                    duration = timedelta(hours=duration_hours)
                    arr_time = dep_time + duration
                    
                    # Generate random price between $100 and $1000
                    price = round(random.uniform(100, 1000), 2)

                    # Select random airline and generate flight number
                    airline = random.choice(airlines)
                    flight_number = random.randint(*airline["flight_range"])
                    
                    flight = {
                        "departureTime": dep_time.strftime("%d-%m-%Y %H:%M:%S"),
                        "arrivalTime": arr_time.strftime("%d-%m-%Y %H:%M:%S"),
                        "airlineCode": airline["code"],
                        "airlineName": airline["name"],
                        "flightNumber": f"{flight_number}",
                        "price": price,
                        "duration": f"{duration_hours:.2f}",
                        "distance": distance
                    }
                    
                    flight_data[airport][dest].append(flight)
            
            # Sort flights by departure time
            flight_data[airport][dest].sort(key=lambda x: x["departureTime"])

    return flight_data

if __name__ == "__main__":
    start_date_str = "10-07-2024 12:00:00"
    start_date = datetime.strptime(start_date_str, "%d-%m-%Y %H:%M:%S")
    end_date = start_date + timedelta(hours=24)
    
    flight_data = generate_flight_data(start_date_str)
    
    file_path = 'backend/alternative_flights/flight_data.json'
    with open(file_path, 'w') as f:
        json.dump(flight_data, f, indent=2)
