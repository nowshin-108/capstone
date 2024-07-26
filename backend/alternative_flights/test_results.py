import unittest
import json
import os
from datetime import datetime
from alt_flight_search import main, load_flight_data, find_flight_options, calculate_baseline_duration, apply_discounts, calculate_ranking_scores

class TestFlightRecommendation(unittest.TestCase):
    def setUp(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        results_path = os.path.join(parent_dir, 'routes', 'results.json')

        with open(results_path, 'r') as f:
            self.results = json.load(f)

    def test_results_structure(self):
        self.assertTrue(len(self.results) > 0, "No results were generated")
        
        for result in self.results:
            self.assertIn('rank', result)
            self.assertIn('option_id', result)
            self.assertIn('flights', result)
            self.assertIn('summary', result)
            
            summary = result['summary']
            self.assertIn('original_price', summary)
            self.assertIn('discount_percentage', summary)
            self.assertIn('discounted_price', summary)
            self.assertIn('flight_time', summary)
            self.assertIn('connection_time', summary)
            self.assertIn('total_duration', summary)
            self.assertIn('total_distance', summary)
            self.assertIn('score', summary)
            self.assertIn('path', summary)

    def test_ranking(self):
        scores = [result['summary']['score'] for result in self.results]
        ranks = [result['rank'] for result in self.results]
        
        # Checking if ranks are in ascending order (1, 2, 3, ...)
        self.assertEqual(ranks, list(range(1, len(ranks) + 1)), "Ranks are not in correct ascending order")
        
        # Checking if lower ranks correspond to higher scores
        for i in range(len(scores) - 1):
            self.assertLessEqual(ranks[i], ranks[i+1], 
                f"Rank {ranks[i]} with score {scores[i]} is not less than or equal to rank {ranks[i+1]} with score {scores[i+1]}")

        print("Scores:", scores)
        print("Ranks:", ranks)

    def test_price_calculation(self):
        for result in self.results:
            flights_total = sum(flight['price'] for flight in result['flights'])
            self.assertAlmostEqual(flights_total, result['summary']['original_price'], delta=0.01)
            
            discounted_price = result['summary']['original_price'] * (1 - result['summary']['discount_percentage'] / 100)
            self.assertAlmostEqual(discounted_price, result['summary']['discounted_price'], delta=0.01)

    def test_duration_calculation(self):
        for result in self.results:
            flight_time = sum(flight['duration'] for flight in result['flights'])
            self.assertAlmostEqual(flight_time, result['summary']['flight_time'], delta=0.01)
            
            total_duration = result['summary']['flight_time'] + result['summary']['connection_time']
            self.assertAlmostEqual(total_duration, result['summary']['total_duration'], delta=0.01)

    def test_path_correctness(self):
        for result in self.results:
            expected_path = ' -> '.join([flight['departure_airport'] for flight in result['flights']])
            expected_path += f" -> {result['flights'][-1]['arrival_airport']}"
            self.assertEqual(expected_path, result['summary']['path'])

    def test_discount_application(self):
        for result in self.results:
            original_price = result['summary']['original_price']
            discount_percentage = result['summary']['discount_percentage']
            discounted_price = result['summary']['discounted_price']
            
            expected_discounted_price = original_price * (1 - discount_percentage / 100)
            self.assertAlmostEqual(discounted_price, expected_discounted_price, delta=0.01)

    def test_connection_time(self):
        for result in self.results:
            if len(result['flights']) > 1:
                calculated_connection_time = sum(
                    (datetime.strptime(result['flights'][i+1]['departure_time'], "%d-%m-%Y %H:%M:%S") - 
                        datetime.strptime(result['flights'][i]['arrival_time'], "%d-%m-%Y %H:%M:%S")).total_seconds() / 3600
                    for i in range(len(result['flights']) - 1)
                )
                self.assertAlmostEqual(calculated_connection_time, result['summary']['connection_time'], delta=0.01)

    def test_score_range(self):
        for result in self.results:
            self.assertGreaterEqual(result['summary']['score'], 0)
            self.assertLessEqual(result['summary']['score'], 1)

if __name__ == '__main__':
    unittest.main()

