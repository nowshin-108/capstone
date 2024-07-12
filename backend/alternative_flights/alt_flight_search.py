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
        self.total_price += flight.price
        self.total_duration += flight.duration
        self.total_distance += flight.distance

    def calculate_idle_time(self):
        self.idle_time = max(0, sum((self.flights[i+1].departure_time - self.flights[i].arrival_time).total_seconds() / 3600
                                for i in range(len(self.flights) - 1)))

    def to_dict(self):
        return {
            'option_id': self.option_id,
            'flights': [flight.to_dict() for flight in self.flights],
            'total_price': self.total_price,
            'total_duration': self.total_duration,
            'total_distance': self.total_distance,
            'idle_time': self.idle_time,
            'discount': self.discount,
            'score': self.score,
            'path': ' -> '.join(f"{flight.departure_airport}" for flight in self.flights) + f" -> {self.flights[-1].arrival_airport}"
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
            current_option.calculate_idle_time()
            if current_option.total_duration <= 24:  # Ensure total trip time is <= 24 hours
                options.append(current_option)
            return

        for flight in filtered_data.get(current_airport, []):
            # If it's a direct flight, allow it to depart at the current time or later
            # If it's a connecting flight, make it depart at least 1 hour after the first flight lands
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

            if new_option.total_duration > 24:  # Prune if exceeding 24 hours
                continue

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

def calculate_ranking_scores(options: List[FlightOption], baseline_duration: float, preferred_airline_code: str):
    n_options = len(options)
    
    prices = np.array([opt.total_price for opt in options])
    durations = np.array([opt.total_duration for opt in options])
    connections = np.array([len(opt.flights) - 1 for opt in options])
    airline_matches = np.array([sum(1 for flight in opt.flights if flight.airline_code == preferred_airline_code) / len(opt.flights) for opt in options])

    price_scores = 1 - stats.zscore(prices)
    speed_scores = 1 - stats.zscore(durations)
    directness_scores = 1 - stats.zscore(connections)
    airline_scores = stats.zscore(airline_matches)

    def min_max_scale(x):
        return (x - np.min(x)) / (np.max(x) - np.min(x))

    price_scores = min_max_scale(price_scores)
    speed_scores = min_max_scale(speed_scores)
    directness_scores = min_max_scale(directness_scores)
    airline_scores = min_max_scale(airline_scores)

    weights = np.array([0.35, 0.30, 0.20, 0.15])  # price, speed, directness, airline
    scores = np.column_stack((price_scores, speed_scores, directness_scores, airline_scores))
    total_scores = np.dot(scores, weights)

    for i, option in enumerate(options):
        option.score = total_scores[i]

def are_options_similar(option1: FlightOption, option2: FlightOption, threshold: float) -> bool:
    same_flights = set(flight.flight_id for flight in option1.flights) == set(flight.flight_id for flight in option2.flights)
    similar_price = abs(option1.total_price - option2.total_price) / max(option1.total_price, option2.total_price) < (1 - threshold)
    similar_duration = abs(option1.total_duration - option2.total_duration) / max(option1.total_duration, option2.total_duration) < (1 - threshold)
    return same_flights and similar_price and similar_duration

def remove_similar_options(options: List[FlightOption], similarity_threshold: float = 0.9):
    unique_options = []
    for option in options:
        if not any(are_options_similar(option, unique_opt, similarity_threshold) for unique_opt in unique_options):
            unique_options.append(option)
    return unique_options

def sort_options(options: List[FlightOption], sort_by: str = 'score'):
    if sort_by == 'price':
        return sorted(options, key=lambda x: x.total_price)
    elif sort_by == 'duration':
        return sorted(options, key=lambda x: x.total_duration)
    else:  # Default to score
        return sorted(options, key=lambda x: x.score, reverse=True)

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, 'flight_data.json')
    
    flight_data = load_flight_data(file_path)

    departure_airport = "SFO"
    arrival_airport = "BOS"
    departure_time = datetime(2024, 7, 10, 12, 0, 0)
    preferred_airline_code = "AA"

    options = find_flight_options(departure_airport, arrival_airport, departure_time, flight_data)
    
    if not options:
        print("No flight options found.")
        return

    baseline_duration = calculate_baseline_duration(options)
    apply_discounts(options, baseline_duration)
    calculate_ranking_scores(options, baseline_duration, preferred_airline_code)

    options = remove_similar_options(options)
    sorted_options = sorted(options, key=lambda x: x.score, reverse=True)

    results = [{"rank": i+1, **option.to_dict()} for i, option in enumerate(sorted_options)]

    output_file_path = os.path.join(current_dir, 'results.json')
    with open(output_file_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"Results have been exported to {output_file_path}")

if __name__ == "__main__":
    main()

