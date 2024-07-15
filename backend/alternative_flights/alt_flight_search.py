import os
import json
from datetime import datetime, timedelta
import uuid
from typing import List, Dict
import numpy as np
from scipy import stats

class Flight:
    def __init__(self, departure_airport, flight_data):
        self.flight_id = str(uuid.uuid4())
        self.departure_airport = departure_airport
        self.arrival_airport = flight_data['arrival_airport']
        self.departure_time = datetime.strptime(flight_data['departureTime'], "%d-%m-%Y %H:%M:%S")
        self.arrival_time = datetime.strptime(flight_data['arrivalTime'], "%d-%m-%Y %H:%M:%S")
        self.airline_code = flight_data['airlineCode']
        self.airline_name = flight_data['airlineName']
        self.flight_number = flight_data['flightNumber']
        self.price = flight_data['price']
        self.duration = float(flight_data['duration'])
        self.distance = flight_data['distance']

    def to_dict(self):
        return {
            'flight_id': self.flight_id,
            'departure_airport': self.departure_airport,
            'arrival_airport': self.arrival_airport,
            'departure_time': self.departure_time.strftime("%d-%m-%Y %H:%M:%S"),
            'arrival_time': self.arrival_time.strftime("%d-%m-%Y %H:%M:%S"),
            'airline_code': self.airline_code,
            'airline_name': self.airline_name,
            'flight_number': self.flight_number,
            'price': self.price,
            'duration': self.duration,
            'distance': self.distance
        }

class FlightOption:
    def __init__(self):
        self.option_id = str(uuid.uuid4())
        self.flights: List[Flight] = []
        self.total_price = 0
        self.total_duration = 0
        self.total_distance = 0
        self.idle_time = 0
        self.discount = 0
        self.score = 0

    def add_flight(self, flight: Flight):
        self.flights.append(flight)

    def calculate_totals(self):
        self.total_price = sum(flight.price for flight in self.flights)
        self.total_distance = sum(flight.distance for flight in self.flights)
        self.calculate_idle_time()
        self.total_duration = sum(flight.duration for flight in self.flights) + self.idle_time

    def calculate_idle_time(self):
        self.idle_time = sum((self.flights[i+1].departure_time - self.flights[i].arrival_time).total_seconds() / 3600
                                for i in range(len(self.flights) - 1))

    def to_dict(self):
        flight_time = sum(flight.duration for flight in self.flights)
        original_price = sum(flight.price for flight in self.flights)
        discount_percentage = (self.discount / original_price) * 100 if original_price > 0 else 0
        
        return {
            'option_id': self.option_id,
            'flights': [flight.to_dict() for flight in self.flights],
            'summary': {
                'original_price': round(original_price, 2),
                'discount_percentage': round(discount_percentage, 2),
                'discounted_price': round(self.total_price, 2),
                'flight_time': round(flight_time, 2),
                'connection_time': round(self.idle_time, 2),
                'total_duration': round(self.total_duration, 2),
                'total_distance': self.total_distance,
                'score': round(self.score, 4),
                'path': ' -> '.join(f"{flight.departure_airport}" for flight in self.flights) + f" -> {self.flights[-1].arrival_airport}"
            }
        }

def load_flight_data(file_path: str) -> Dict[str, List[Flight]]:
    with open(file_path, 'r') as file:
        data = json.load(file)

    flight_data = {}
    for departure_airport, destinations in data.items():
        flight_data[departure_airport] = []
        for destination, flights in destinations.items():
            for flight in flights:
                flight['arrival_airport'] = destination
                flight_data[departure_airport].append(Flight(departure_airport, flight))

    return flight_data

def filter_flights_within_24h(flight_data: Dict[str, List[Flight]], departure_time: datetime) -> Dict[str, List[Flight]]:
    end_time = departure_time + timedelta(hours=24)
    return {
        airport: [flight for flight in flights if departure_time <= flight.departure_time < end_time]
        for airport, flights in flight_data.items()
    }

def find_flight_options(departure_airport: str, arrival_airport: str, departure_time: datetime, flight_data: Dict[str, List[Flight]]) -> List[FlightOption]:
    filtered_data = filter_flights_within_24h(flight_data, departure_time)
    options = []

    def dfs(current_airport: str, current_time: datetime, current_option: FlightOption, visited: set):
        if len(current_option.flights) > 3:  # Max 4 stops
            return

        if current_airport == arrival_airport:
            current_option.calculate_totals()  # Calculate totals when a complete route is found
            if current_option.total_duration <= 24:  # Ensure total trip time is <= 24 hours
                options.append(current_option)
            return

        for flight in filtered_data.get(current_airport, []):
            if len(current_option.flights) == 0 and flight.departure_time < current_time:
                continue
            elif len(current_option.flights) > 0 and flight.departure_time < current_time + timedelta(hours=1):
                continue

            connection_time = (flight.departure_time - current_time).total_seconds() / 3600
            if connection_time < 1 or connection_time > 6:  # Connection time between 1 and 6 hours
                continue

            if flight.arrival_airport in visited:
                continue

            new_option = FlightOption()
            new_option.flights = current_option.flights.copy()
            new_option.add_flight(flight)

            new_visited = visited.copy()
            new_visited.add(flight.arrival_airport)

            dfs(flight.arrival_airport, flight.arrival_time, new_option, new_visited)

    initial_option = FlightOption()
    dfs(departure_airport, departure_time, initial_option, {departure_airport})

    return options

def calculate_baseline_duration(options: List[FlightOption]) -> float:
    direct_flights = [opt for opt in options if len(opt.flights) == 1]
    if direct_flights:
        return min(opt.total_duration for opt in direct_flights)
   
    min_connections = min(len(opt.flights) for opt in options)
    least_connection_flights = [opt for opt in options if len(opt.flights) == min_connections]
    return min(opt.total_duration for opt in least_connection_flights)

def apply_discounts(options: List[FlightOption], baseline_duration: float):
    durations = np.array([opt.total_duration for opt in options])
    idle_times = np.array([opt.idle_time for opt in options])

    duration_threshold = baseline_duration * 1.5
    max_idle_time = np.max(idle_times)

    for i, option in enumerate(options):
        discount = 0
        if durations[i] >= duration_threshold:
            discount += option.total_price * 0.5
            if idle_times[i] == max_idle_time and max_idle_time > 0:
                discount += option.total_price * 0.2
       
        option.discount = min(discount, option.total_price * 0.7)  # Cap discount at 70%
        option.total_price -= option.discount

def calculate_ranking_scores(options: List[FlightOption], preferred_airline_code: str) -> List[FlightOption]:
    prices = np.array([opt.total_price for opt in options])
    durations = np.array([opt.total_duration for opt in options])
    connections = np.array([len(opt.flights) - 1 for opt in options])
    airline_matches = np.array([1 if any(flight.airline_code == preferred_airline_code for flight in opt.flights) else 0 for opt in options])

    price_scores = 1 - (prices - np.min(prices)) / (np.max(prices) - np.min(prices))
    speed_scores = 1 - (durations - np.min(durations)) / (np.max(durations) - np.min(durations))
    directness_scores = np.where(connections == 0, 2, 1 - connections / np.max(connections))

    overall_scores = (
        0.35 * price_scores +
        0.25 * speed_scores +
        0.30 * directness_scores +
        0.10 * airline_matches
    )

    scored_options = list(zip(overall_scores, options))
    scored_options.sort(key=lambda x: (-x[0], x[1].total_price))
    sorted_options = [option for _, option in scored_options]

    for score, option in zip(overall_scores, sorted_options):
        option.score = score

    return sorted_options

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, 'flight_data.json')
   
    flight_data = load_flight_data(file_path)

    departure_airport = "NYC"
    arrival_airport = "MIA"
    departure_time = datetime(2024, 7, 10, 12, 0, 0)
    preferred_airline_code = "AA"

    options = find_flight_options(departure_airport, arrival_airport, departure_time, flight_data)
    if not options:
        print("No flight options found.")
        return

    baseline_duration = calculate_baseline_duration(options)
    apply_discounts(options, baseline_duration)
   
    sorted_options = calculate_ranking_scores(options, preferred_airline_code)

    results = [{
        "rank": i+1,
        **option.to_dict()
    } for i, option in enumerate(sorted_options)]

    output_file_path = os.path.join(current_dir, 'results.json')
    with open(output_file_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"Results have been exported to {output_file_path}")

if __name__ == "__main__":
    main()


