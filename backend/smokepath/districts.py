"""District headquarters across the smoke source region, used to label fire clusters ("near Sangrur, Punjab").

Coordinates are approximate town centres; labels always say "near", never claim district boundaries.
"""
from .geo import haversine_km

DISTRICTS = [
    # Punjab
    ("Amritsar", "Punjab", 31.634, 74.872), ("Barnala", "Punjab", 30.378, 75.546),
    ("Bathinda", "Punjab", 30.211, 74.945), ("Faridkot", "Punjab", 30.676, 74.756),
    ("Fatehgarh Sahib", "Punjab", 30.649, 76.392), ("Fazilka", "Punjab", 30.402, 74.026),
    ("Ferozepur", "Punjab", 30.925, 74.613), ("Gurdaspur", "Punjab", 32.041, 75.405),
    ("Hoshiarpur", "Punjab", 31.532, 75.917), ("Jalandhar", "Punjab", 31.326, 75.576),
    ("Kapurthala", "Punjab", 31.380, 75.381), ("Ludhiana", "Punjab", 30.901, 75.857),
    ("Malerkotla", "Punjab", 30.531, 75.879), ("Mansa", "Punjab", 29.998, 75.401),
    ("Moga", "Punjab", 30.817, 75.170), ("Pathankot", "Punjab", 32.274, 75.652),
    ("Patiala", "Punjab", 30.340, 76.387), ("Rupnagar", "Punjab", 30.966, 76.533),
    ("Mohali", "Punjab", 30.704, 76.717), ("Sangrur", "Punjab", 30.245, 75.844),
    ("Nawanshahr", "Punjab", 31.125, 76.116), ("Sri Muktsar Sahib", "Punjab", 30.474, 74.516),
    ("Tarn Taran", "Punjab", 31.451, 74.928),
    # Haryana
    ("Ambala", "Haryana", 30.378, 76.777), ("Bhiwani", "Haryana", 28.793, 76.139),
    ("Charkhi Dadri", "Haryana", 28.592, 76.271), ("Faridabad", "Haryana", 28.408, 77.317),
    ("Fatehabad", "Haryana", 29.515, 75.455), ("Gurugram", "Haryana", 28.459, 77.027),
    ("Hisar", "Haryana", 29.149, 75.722), ("Jhajjar", "Haryana", 28.607, 76.657),
    ("Jind", "Haryana", 29.316, 76.316), ("Kaithal", "Haryana", 29.802, 76.400),
    ("Karnal", "Haryana", 29.686, 76.990), ("Kurukshetra", "Haryana", 29.969, 76.878),
    ("Mahendragarh", "Haryana", 28.044, 76.108), ("Nuh", "Haryana", 28.105, 77.001),
    ("Palwal", "Haryana", 28.144, 77.326), ("Panchkula", "Haryana", 30.695, 76.861),
    ("Panipat", "Haryana", 29.391, 76.964), ("Rewari", "Haryana", 28.198, 76.619),
    ("Rohtak", "Haryana", 28.896, 76.607), ("Sirsa", "Haryana", 29.534, 75.029),
    ("Sonipat", "Haryana", 28.993, 77.016), ("Yamunanagar", "Haryana", 30.129, 77.268),
    # Delhi, Chandigarh
    ("Delhi", "Delhi", 28.614, 77.209), ("Chandigarh", "Chandigarh", 30.733, 76.779),
    # Western Uttar Pradesh
    ("Saharanpur", "Uttar Pradesh", 29.968, 77.546), ("Muzaffarnagar", "Uttar Pradesh", 29.473, 77.708),
    ("Shamli", "Uttar Pradesh", 29.449, 77.310), ("Baghpat", "Uttar Pradesh", 28.944, 77.218),
    ("Meerut", "Uttar Pradesh", 28.984, 77.706), ("Ghaziabad", "Uttar Pradesh", 28.669, 77.454),
    ("Noida", "Uttar Pradesh", 28.535, 77.391), ("Bulandshahr", "Uttar Pradesh", 28.403, 77.858),
    ("Hapur", "Uttar Pradesh", 28.730, 77.776), ("Aligarh", "Uttar Pradesh", 27.883, 78.078),
    ("Bijnor", "Uttar Pradesh", 29.372, 78.136), ("Moradabad", "Uttar Pradesh", 28.839, 78.773),
    ("Rampur", "Uttar Pradesh", 28.809, 79.026), ("Mathura", "Uttar Pradesh", 27.492, 77.674),
    ("Bareilly", "Uttar Pradesh", 28.367, 79.432),
    # Northern Rajasthan
    ("Sri Ganganagar", "Rajasthan", 29.904, 73.877), ("Hanumangarh", "Rajasthan", 29.582, 74.329),
    ("Alwar", "Rajasthan", 27.553, 76.635), ("Jhunjhunu", "Rajasthan", 28.130, 75.399),
    ("Churu", "Rajasthan", 28.304, 74.967), ("Bharatpur", "Rajasthan", 27.217, 77.490),
    # Uttarakhand, Himachal
    ("Dehradun", "Uttarakhand", 30.316, 78.032), ("Haridwar", "Uttarakhand", 29.945, 78.164),
    ("Udham Singh Nagar", "Uttarakhand", 28.983, 79.400), ("Una", "Himachal Pradesh", 31.468, 76.270),
]


def nearest(lat, lon):
    name, state, _, _ = min(DISTRICTS, key=lambda d: haversine_km(lat, lon, d[2], d[3]))
    return name, state
