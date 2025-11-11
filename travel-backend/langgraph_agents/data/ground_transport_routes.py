"""
Philippine Ground Transport Routes Database
Python port of the JavaScript groundTransportRoutes.js
Comprehensive data for bus, van, and ferry routes across the Philippines
"""

from typing import Dict, List, Optional, Any

# Ground transport route data
# Key format: "DepartureCity-DestinationCity" (bidirectional)
GROUND_TRANSPORT_ROUTES = {
    # ==================== LUZON ROUTES ====================
    
    # Metro Manila to Nearby Destinations
    "Manila-Tagaytay": {
        "distance": 60,
        "travel_time": 1.5,
        "modes": ["bus", "van"],
        "operators": ["DLTB Co", "Alps The Bus"],
        "cost": {"min": 150, "max": 300},
        "frequency": "every 30 mins",
        "scenic": True,
        "notes": "Popular weekend destination, frequent service",
    },
    
    "Manila-Batangas": {
        "distance": 120,
        "travel_time": 2.5,
        "modes": ["bus"],
        "operators": ["DLTB Co", "JAM Transit", "Ceres"],
        "cost": {"min": 200, "max": 350},
        "frequency": "every 30 mins",
        "notes": "Gateway to Batangas pier for Mindoro",
    },
    
    "Manila-Subic": {
        "distance": 120,
        "travel_time": 2.5,
        "modes": ["bus", "van"],
        "operators": ["Victory Liner", "Five Star Bus"],
        "cost": {"min": 250, "max": 400},
        "frequency": "hourly",
        "scenic": False,
    },
    
    # Northern Luzon Routes
    "Manila-Baguio": {
        "distance": 250,
        "travel_time": 6,
        "modes": ["bus"],
        "operators": ["Victory Liner", "Genesis Transport", "Joy Bus"],
        "cost": {"min": 450, "max": 750},
        "frequency": "hourly (24/7 service)",
        "scenic": True,
        "notes": "Mountain route with scenic views, popular tourist destination",
    },
    
    "Manila-Vigan": {
        "distance": 400,
        "travel_time": 8,
        "modes": ["bus"],
        "operators": ["Partas", "Farinas Trans", "Viron Transit"],
        "cost": {"min": 600, "max": 900},
        "frequency": "several daily",
        "has_overnight_option": True,
        "scenic": True,
        "notes": "UNESCO heritage city, overnight bus recommended",
    },
    
    "Baguio-Sagada": {
        "distance": 150,
        "travel_time": 5,
        "modes": ["bus", "van"],
        "operators": ["GL Trans", "Coda Lines"],
        "cost": {"min": 300, "max": 500},
        "frequency": "few daily",
        "scenic": True,
        "notes": "Mountain route, scenic but winding roads",
    },
    
    # ==================== VISAYAS FERRY ROUTES ====================
    # ✅ VERIFIED with actual operator fares (Nov 2025)
    
    # ========== CEBU FERRY ROUTES ==========
    "Cebu-Tagbilaran": {
        "distance": 70,
        "travel_time": 2,
        "modes": ["ferry"],
        "operators": ["OceanJet", "SuperCat 2GO", "Lite Ferries", "FastCat", "Weesam Express"],
        "cost": {"min": 238, "max": 500},  # ✅ OceanJet ₱238/₱425 / Lite ₱255 / FastCat ₱275 / Weesam ₱300 / SuperCat ₱500
        "frequency": "multiple daily (hourly)",
        "has_ferry": True,
        "scenic": True,
        "notes": "Fast ferry to Bohol capital. Multiple operators, very frequent service. Prices vary by operator and class.",
    },
    
    "Cebu-Bohol": {
        "distance": 70,
        "travel_time": 2,
        "modes": ["ferry"],
        "operators": ["OceanJet", "Lite Ferries", "FastCat"],
        "cost": {"min": 238, "max": 275},  # ✅ OceanJet ₱238 / FastCat/Lite ₱275
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Generic Bohol destination (multiple ports). See Cebu-Tagbilaran for main route.",
    },
    
    "Cebu-Tubigon": {
        "distance": 75,
        "travel_time": 2,
        "modes": ["ferry"],
        "operators": ["Lite Ferries", "FastCat", "Weesam Express"],
        "cost": {"min": 255, "max": 300},  # ✅ Lite ₱255 / FastCat ₱275 / Weesam ₱300
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Alternative Bohol port, northwest side of island",
    },
    
    "Cebu-Ormoc": {
        "distance": 115,
        "travel_time": 2.5,
        "modes": ["ferry"],
        "operators": ["OceanJet", "SuperCat 2GO", "Lite Ferries"],
        "cost": {"min": 430, "max": 740},  # ✅ Lite ₱430 / OceanJet ₱510 / SuperCat ₱740
        "frequency": "daily (multiple)",
        "has_ferry": True,
        "scenic": True,
        "notes": "Gateway to Western Leyte",
    },
    
    "Cebu-Cagayan de Oro": {
        "distance": 180,
        "travel_time": 5,
        "modes": ["ferry"],
        "operators": ["Lite Ferries"],
        "cost": {"min": 780, "max": 850},  # ✅ Lite ₱780
        "frequency": "several weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Direct ferry to Northern Mindanao",
    },
    
    "Cebu-Misamis": {
        "distance": 170,
        "travel_time": 4.5,
        "modes": ["ferry"],
        "operators": ["Lite Ferries"],
        "cost": {"min": 780, "max": 850},  # ✅ Lite ₱780
        "frequency": "several weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Misamis Occidental, Northern Mindanao",
    },
    
    "Cebu-Siquijor": {
        "distance": 150,
        "travel_time": 3.5,
        "modes": ["ferry"],
        "operators": ["Lite Ferries"],
        "cost": {"min": 430, "max": 500},  # ✅ Lite ₱430
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Mystical island destination",
    },
    
    "Cebu-Siargao": {
        "distance": 320,
        "travel_time": 9,
        "modes": ["ferry"],
        "operators": ["Starlite Ferries"],
        "cost": {"min": 750, "max": 850},  # ✅ Starlite ₱750
        "frequency": "limited weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Surfing paradise. Long journey - flight to Siargao recommended.",
    },
    
    "Cebu-Maasin": {
        "distance": 120,
        "travel_time": 3,
        "modes": ["ferry"],
        "operators": ["Weesam Express"],
        "cost": {"min": 375, "max": 450},  # ✅ Weesam ₱375
        "frequency": "several weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Southern Leyte capital",
    },
    
    # ========== ILOILO FERRY ROUTES ==========
    "Iloilo-Bacolod": {
        "distance": 42,
        "travel_time": 1,
        "modes": ["ferry"],
        "operators": ["FastCat", "Weesam Express", "SuperCat 2GO", "OceanJet", "Montenegro Lines"],
        "cost": {"min": 128, "max": 380},  # ✅ Montenegro ₱128 / FastCat ₱240 / OceanJet/Weesam ₱250-255 / SuperCat ₱380
        "frequency": "multiple daily (hourly)",
        "has_ferry": True,
        "scenic": False,
        "notes": "Very frequent inter-island crossing. Multiple operators, prices vary.",
    },
    
    "Iloilo-Guimaras": {
        "distance": 12,
        "travel_time": 0.3,
        "modes": ["ferry"],
        "operators": ["Starlite Ferries", "Jordan Wharf"],
        "cost": {"min": 14, "max": 260},  # ✅ Starlite ₱260 (tourist), Local ferries ~₱14
        "frequency": "every 30 mins",
        "has_ferry": True,
        "scenic": True,
        "notes": "Very short crossing to mango island. Local bangka ferries cheaper (~₱14).",
    },
    
    # ========== BACOLOD FERRY ROUTES ==========
    # See Iloilo-Bacolod (bidirectional)
    
    # ========== NEGROS FERRY ROUTES ==========
    "Negros-Toledo": {
        "distance": 25,
        "travel_time": 0.8,
        "modes": ["ferry"],
        "operators": ["Lite Ferries", "FastCat"],
        "cost": {"min": 195, "max": 220},  # ✅ Lite/FastCat ₱195
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": False,
        "notes": "San Carlos (Negros) to Toledo (Cebu)",
    },
    
    # ========== BOHOL FERRY ROUTES ==========
    "Tagbilaran-Dumaguete": {
        "distance": 90,
        "travel_time": 2,
        "modes": ["ferry"],
        "operators": ["OceanJet"],
        "cost": {"min": 595, "max": 650},  # ✅ OceanJet ₱595
        "frequency": "daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Bohol to Negros Oriental",
    },
    
    "Tagbilaran-Siquijor": {
        "distance": 110,
        "travel_time": 2.5,
        "modes": ["ferry"],
        "operators": ["OceanJet", "Lite Ferries"],
        "cost": {"min": 260, "max": 595},  # ✅ Lite ₱260 / OceanJet ₱595
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Mystical island connection",
    },
    
    "Tagbilaran-Misamis": {
        "distance": 180,
        "travel_time": 5,
        "modes": ["ferry"],
        "operators": ["Lite Ferries"],
        "cost": {"min": 605, "max": 700},  # ✅ Lite ₱605
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Bohol to Misamis Occidental, Mindanao",
    },
    
    "Jagna-Nasipit": {
        "distance": 120,
        "travel_time": 3,
        "modes": ["ferry"],
        "operators": ["Lite Ferries"],
        "cost": {"min": 700, "max": 800},  # ✅ Lite ₱700
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Eastern Bohol to Agusan del Norte (Butuan area)",
    },
    
    "Cagayan de Oro-Bohol": {
        "distance": 160,
        "travel_time": 4,
        "modes": ["ferry"],
        "operators": ["Lite Ferries"],
        "cost": {"min": 700, "max": 800},  # ✅ Lite ₱700
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Northern Mindanao to Bohol (various ports)",
    },
    
    "Misamis-Bohol": {
        "distance": 170,
        "travel_time": 4.5,
        "modes": ["ferry"],
        "operators": ["Lite Ferries", "OceanJet"],
        "cost": {"min": 605, "max": 850},  # ✅ Lite ₱605 / OceanJet ₱850
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Misamis Occidental (Mindanao) to Bohol",
    },
    
    # ========== LEYTE/SAMAR FERRY ROUTES ==========
    "Ormoc-Mandaue": {
        "distance": 120,
        "travel_time": 2.5,
        "modes": ["ferry"],
        "operators": ["Lite Ferries"],
        "cost": {"min": 300, "max": 350},  # ✅ Lite ₱300
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": False,
        "notes": "Leyte to Cebu Metro",
    },
    
    "Leyte-Surigao": {
        "distance": 80,
        "travel_time": 2,
        "modes": ["ferry"],
        "operators": ["FastCat"],
        "cost": {"min": 140, "max": 180},  # ✅ FastCat ₱140
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": False,
        "notes": "Liloan (Southern Leyte) to Surigao del Norte",
    },
    
    "Matnog-Samar": {
        "distance": 12,
        "travel_time": 0.5,
        "modes": ["ferry", "roro"],
        "operators": ["FastCat", "local operators"],
        "cost": {"min": 140, "max": 200},  # ✅ FastCat ₱140/₱200
        "frequency": "every 30 mins",
        "has_ferry": True,
        "scenic": False,
        "notes": "Bicol to Eastern Visayas connection. Dapdap port.",
    },
    
    "Matnog-Dapdap": {
        "distance": 12,
        "travel_time": 0.5,
        "modes": ["ferry", "roro"],
        "operators": ["FastCat", "local RORO"],
        "cost": {"min": 140, "max": 180},  # ✅ FastCat ₱140
        "frequency": "continuous",
        "has_ferry": True,
        "scenic": False,
        "notes": "Main RORO crossing, Sorsogon to Samar",
    },
    
    # ========== SIQUIJOR FERRY ROUTES ==========
    "Siquijor-Dumaguete": {
        "distance": 45,
        "travel_time": 1,
        "modes": ["ferry"],
        "operators": ["OceanJet"],
        "cost": {"min": 213, "max": 250},  # ✅ OceanJet ₱213
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Popular island hopping route",
    },
    
    "Siquijor-Misamis": {
        "distance": 220,
        "travel_time": 6,
        "modes": ["ferry"],
        "operators": ["Lite Ferries"],
        "cost": {"min": 400, "max": 500},  # ✅ Lite ₱400
        "frequency": "limited weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Siquijor to Misamis Occidental, Mindanao",
    },
    
    # ========== DUMAGUETE FERRY ROUTES ==========
    "Dumaguete-Dapitan": {
        "distance": 180,
        "travel_time": 5,
        "modes": ["ferry"],
        "operators": ["FastCat", "Montenegro Lines"],
        "cost": {"min": 440, "max": 500},  # ✅ Montenegro ₱440 / FastCat ₱450
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Negros Oriental to Zamboanga del Norte",
    },
    
    "Oslob-Dipolog": {
        "distance": 200,
        "travel_time": 6,
        "modes": ["ferry"],
        "operators": ["Lite Ferries"],
        "cost": {"min": 300, "max": 400},  # ✅ Lite ₱300
        "frequency": "limited weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Southern Cebu to Zamboanga del Norte (Note: Check if active)",
    },
    
    # ========== PALAWAN FERRY ROUTES ==========
    "El Nido-Coron": {
        "distance": 60,
        "travel_time": 4,
        "modes": ["ferry"],
        "operators": ["Montenegro Lines", "Jomalia Shipping"],
        "cost": {"min": 1760, "max": 1800},  # ✅ Montenegro ₱1,760 / Jomalia ₱1,800
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Island-hopping paradise. Travel time varies by weather/waves.",
    },
    
    "Coron-Cullion": {
        "distance": 30,
        "travel_time": 2,
        "modes": ["ferry"],
        "operators": ["Montenegro Lines"],
        "cost": {"min": 390, "max": 450},  # ✅ Montenegro ₱390
        "frequency": "several weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Northern Palawan inter-island",
    },
    
    # ========== MINDANAO FERRY ROUTES ==========
    "Surigao-Siargao": {
        "distance": 65,
        "travel_time": 2,
        "modes": ["ferry"],
        "operators": ["Montenegro Lines", "Starlite Ferries"],
        "cost": {"min": 288, "max": 350},  # ✅ Montenegro ₱288 / Starlite varies
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Gateway to surfing paradise. Very frequent service.",
    },
    
    "Zamboanga-Jolo": {
        "distance": 160,
        "travel_time": 6,
        "modes": ["ferry"],
        "operators": ["Weesam Express"],
        "cost": {"min": 800, "max": 1000},  # ✅ Weesam ₱800
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": False,
        "notes": "To Sulu province. Check travel advisories before booking.",
    },
    
    "Isabela-Zamboanga": {
        "distance": 80,
        "travel_time": 3,
        "modes": ["ferry"],
        "operators": ["Weesam Express"],
        "cost": {"min": 150, "max": 200},  # ✅ Weesam ₱150
        "frequency": "several weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Basilan to Zamboanga. Check travel advisories.",
    },
    
    # ========== INTER-VISAYAS FERRY ROUTES ==========
    "Roxas-Caticlan": {
        "distance": 70,
        "travel_time": 2,
        "modes": ["ferry"],
        "operators": ["Montenegro Lines", "Starlite Ferries"],
        "cost": {"min": 460, "max": 500},  # ✅ Montenegro/Starlite ₱460-500
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Roxas (Mindoro/Panay) to Boracay gateway",
    },
    
    "Lucena-Marinduque": {
        "distance": 85,
        "travel_time": 3,
        "modes": ["ferry"],
        "operators": ["Montenegro Lines"],
        "cost": {"min": 570, "max": 650},  # ✅ Montenegro ₱570
        "frequency": "daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Quezon to Marinduque island",
    },
    
    # ========== CAMOTES ISLANDS FERRY ROUTES (Cebu area) ==========
    "Mactan-Consuelo": {
        "distance": 55,
        "travel_time": 2,
        "modes": ["ferry"],
        "operators": ["Jomalia Shipping"],
        "cost": {"min": 500, "max": 600},  # ✅ Jomalia ₱500
        "frequency": "several daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Cebu Mactan to Camotes Islands (San Francisco port)",
    },
    
    "Danao-Consuelo": {
        "distance": 40,
        "travel_time": 1.5,
        "modes": ["ferry"],
        "operators": ["Jomalia Shipping"],
        "cost": {"min": 220, "max": 250},  # ✅ Jomalia ₱220
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Northern Cebu to Camotes Islands. More frequent than Mactan route.",
    },
    
    "Danao-Poro": {
        "distance": 35,
        "travel_time": 1.2,
        "modes": ["ferry"],
        "operators": ["Jomalia Shipping"],
        "cost": {"min": 200, "max": 220},  # ✅ Jomalia ₱200
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Northern Cebu to Camotes Islands (Poro port)",
    },
    
    "Danao-Pilar": {
        "distance": 42,
        "travel_time": 1.5,
        "modes": ["ferry"],
        "operators": ["Jomalia Shipping"],
        "cost": {"min": 150, "max": 180},  # ✅ Jomalia ₱150
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Northern Cebu to Camotes Islands (Pilar port)",
    },
    
    # ==================== MINDANAO ROUTES ====================
    
    # Western Mindanao Corridor (Zamboanga Peninsula)
    # ✅ VERIFIED with multiple operators (Nov 2025)
    # Note: Fares vary by operator and service class
    "Zamboanga-Pagadian": {
        "distance": 135,
        "travel_time": 6.5,  # ✅ UPDATED: 6.5-7 hours actual travel time (hourly departures)
        "modes": ["bus", "van"],
        "operators": ["Rural Transit of Mindanao Inc", "Ceres Liner", "Bachelor Express"],
        "cost": {"min": 510, "max": 641},  # ✅ Rural Transit ₱510 / Bachelor Express ₱641
        "frequency": "hourly (6am-4pm)",
        "practical": True,  # ✅ Override: Very frequent service makes this practical despite 6.5hr duration
        "scenic": True,
        "notes": "Coastal highway with scenic views. Hourly departures, 6.5-7 hour journey. Multiple operators with varying fares.",
    },
    
    "Zamboanga-Dipolog": {
        "distance": 210,
        "travel_time": 5,
        "modes": ["bus", "van"],
        "operators": ["Rural Transit of Mindanao Inc", "Ceres Liner", "Bachelor Express"],
        "cost": {"min": 620, "max": 755},  # ✅ Rural Transit ₱620 / Bachelor Express ₱755
        "frequency": "several daily",
        "scenic": True,
        "notes": "Western Mindanao corridor, coastal route. Fares vary by operator and service class.",
    },
    
    "Pagadian-Dipolog": {
        "distance": 95,
        "travel_time": 2.5,
        "modes": ["bus", "van"],
        "operators": ["Ceres Liner", "Rural Transit"],
        "cost": {"min": 180, "max": 300},
        "frequency": "hourly",
        "scenic": True,
        "notes": "Continues along coastal highway",
    },
    
    "Dipolog-Ozamis": {
        "distance": 100,
        "travel_time": 2,
        "modes": ["bus", "van"],
        "operators": ["Ceres Liner", "Rural Transit"],
        "cost": {"min": 150, "max": 250},
        "frequency": "frequent",
        "scenic": False,
    },
    
    # ✅ NEW: Additional Zamboanga Peninsula routes (VERIFIED Nov 2025)
    "Zamboanga-Ipil": {
        "distance": 70,
        "travel_time": 1.5,
        "modes": ["bus", "van"],
        "operators": ["Rural Transit of Mindanao Inc", "Bachelor Express"],
        "cost": {"min": 255, "max": 330},  # ✅ Rural Transit ₱255 / Bachelor Express ₱330
        "frequency": "several daily",
        "scenic": False,
        "notes": "Gateway to Zamboanga Sibugay province. Multiple operators with different fares.",
    },
    
    "Zamboanga-Olutanga": {
        "distance": 95,
        "travel_time": 2,
        "modes": ["bus", "van"],
        "operators": ["Lizamay Express Inc", "Alga Transport", "Din Transit", "SSG Liner"],
        "cost": {"min": 300, "max": 600},  # ✅ ₱300-600 depending on operator
        "frequency": "several daily",
        "scenic": True,
        "notes": "Coastal route to Zamboanga Sibugay. Liza May ₱600. Port entrance fees may apply (~₱25-50).",
    },
    
    "Zamboanga-Siocon": {
        "distance": 80,
        "travel_time": 2,
        "modes": ["bus", "van"],
        "operators": ["Lizamay Express Inc", "Alga Transport", "Din Transit", "SSG Liner"],
        "cost": {"min": 250, "max": 600},  # ✅ ₱250-600 depending on operator
        "frequency": "several daily",
        "scenic": True,
        "notes": "Zamboanga del Norte destination. Liza May ₱600. Coastal route.",
    },
    
    "Zamboanga-Malangas": {
        "distance": 65,
        "travel_time": 1.5,
        "modes": ["bus", "van"],
        "operators": ["Lizamay Express Inc"],
        "cost": {"min": 475, "max": 500},  # ✅ Liza May ₱475
        "frequency": "several daily",
        "scenic": True,
        "notes": "Zamboanga Sibugay destination, coastal route",
    },
    
    "Zamboanga-Gutalac": {
        "distance": 75,
        "travel_time": 1.8,
        "modes": ["bus", "van"],
        "operators": ["Din Transit", "SSG Liner"],
        "cost": {"min": 240, "max": 260},  # ✅ VERIFIED: Din Transit/SSG ₱240
        "frequency": "daily",
        "scenic": False,
        "notes": "Zamboanga del Norte municipality",
    },
    
    # ✅ NEW: Zamboanga to Visayas (Ferry + Bus combinations - VERIFIED Nov 2025)
    "Zamboanga-Cebu": {
        "distance": 520,
        "travel_time": 18,
        "modes": ["bus+ferry"],
        "operators": ["Ceres Liner"],
        "cost": {"min": 1315, "max": 2010},  # ✅ Ceres ₱1,315-2,010 (varies by route/class)
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Bus to Dapitan port, ferry to Cebu. Fares vary by route and service class (₱1,315-2,010). Long journey - flight recommended.",
        "impractical": True,
    },
    
    "Zamboanga-Bacolod": {
        "distance": 580,
        "travel_time": 20,
        "modes": ["bus+ferry"],
        "operators": ["Ceres Liner"],
        "cost": {"min": 1605, "max": 2100},  # ✅ Ceres ₱1,605-2,100 (varies by class)
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Bus to Dapitan port, ferry to Negros. Fares vary by service class. Very long journey - flight strongly recommended.",
        "impractical": True,
    },
    
    "Zamboanga-Dumaguete": {
        "distance": 500,
        "travel_time": 16,
        "modes": ["bus+ferry"],
        "operators": ["Ceres Liner"],
        "cost": {"min": 1095, "max": 1580},  # ✅ Ceres ₱1,095-1,580 (varies by route)
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Bus to Dapitan port, ferry to Dumaguete. Multiple route options with varying fares. Long journey - consider flying.",
        "impractical": True,
    },
    
    "Zamboanga-Manila": {
        "distance": 900,
        "travel_time": 36,
        "modes": ["bus+ferry"],
        "operators": ["Ceres Liner"],
        "cost": {"min": 4700, "max": 5000},  # ✅ Ceres ₱4,700
        "frequency": "very limited",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": False,
        "notes": "❌ EXTREMELY LONG JOURNEY (1.5+ days). Bus + multiple ferries. FLIGHT STRONGLY RECOMMENDED - much faster and similar cost.",
        "impractical": True,
    },
    
    # ❌ IMPRACTICAL LONG-DISTANCE ROUTES (documented for awareness)
    # ✅ VERIFIED with multiple operators (Nov 2025)
    "Zamboanga-Cagayan de Oro": {
        "distance": 450,
        "travel_time": 11,
        "modes": ["bus"],
        "operators": ["Rural Transit of Mindanao Inc", "Bachelor Express", "Mindanao Star"],
        "cost": {"min": 1000, "max": 1190},  # ✅ Rural Transit ₱1,000 / Bachelor Express ₱1,190
        "frequency": "few daily (evening departures)",
        "has_overnight_option": True,
        "scenic": False,
        "notes": "❌ Overnight bus travel, NOT recommended for tourists - flight strongly advised. Fares vary by operator.",
        "impractical": True,
    },
    
    "Zamboanga-Cotabato": {
        "distance": 380,
        "travel_time": 9,
        "modes": ["bus"],
        "operators": ["Bachelor Express", "Weena Express"],
        "cost": {"min": 1100, "max": 1200},  # ✅ Bachelor Express ₱1,100
        "frequency": "few daily",
        "has_overnight_option": True,
        "scenic": False,
        "notes": "❌ Long overnight journey - flight recommended. Check travel advisories for current security conditions.",
        "impractical": True,
    },
    
    # Southern Mindanao Corridor (Davao Region)
    "Davao-General Santos": {
        "distance": 150,
        "travel_time": 3.5,
        "modes": ["bus", "van"],
        "operators": ["Yellow Bus Line", "Philtranco", "Ecoland"],
        "cost": {"min": 300, "max": 500},
        "frequency": "hourly",
        "scenic": False,
        "notes": "Well-maintained highway, comfortable journey",
    },
    
    "Davao-Tagum": {
        "distance": 55,
        "travel_time": 1.5,
        "modes": ["bus", "van"],
        "operators": ["Davao Metro Shuttle", "Bachelor Express"],
        "cost": {"min": 100, "max": 200},
        "frequency": "every 20 mins",
        "scenic": False,
        "notes": "Frequent service, very practical",
    },
    
    "Davao-Digos": {
        "distance": 60,
        "travel_time": 1.5,
        "modes": ["bus", "van"],
        "operators": ["Yellow Bus Line", "Bachelor Express"],
        "cost": {"min": 120, "max": 200},
        "frequency": "every 30 mins",
        "scenic": False,
    },
    
    # Northern Mindanao Corridor (Cagayan de Oro Region)
    "Cagayan de Oro-Iligan": {
        "distance": 90,
        "travel_time": 2,
        "modes": ["bus", "van"],
        "operators": ["Super Five Transport", "Pelaez Transport", "Rural Transit"],
        "cost": {"min": 150, "max": 250},
        "frequency": "every 30 mins",
        "scenic": False,
        "notes": "Very frequent service, well-connected cities",
    },
    
    "Cagayan de Oro-Valencia": {
        "distance": 50,
        "travel_time": 1.5,
        "modes": ["bus", "van"],
        "operators": ["Rural Transit", "Bachelor Express"],
        "cost": {"min": 100, "max": 180},
        "frequency": "hourly",
        "scenic": True,
        "notes": "Gateway to Bukidnon highlands",
    },
    
    "Cagayan de Oro-Butuan": {
        "distance": 180,
        "travel_time": 4,
        "modes": ["bus", "van"],
        "operators": ["Bachelor Express", "Super Five Transport"],
        "cost": {"min": 350, "max": 500},
        "frequency": "several daily",
        "scenic": False,
    },
    
    # ==================== FERRY ROUTES ====================
    # ✅ VERIFIED with actual operator fares (Nov 2025)
    # Organized by origin port for easy reference
    
    # ========== MANILA FERRY ROUTES (2GO Travel) ==========
    "Manila-Cagayan de Oro": {
        "distance": 950,
        "travel_time": 28,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 1361, "max": 1500},  # ✅ 2GO ₱1,361
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Multi-day sea voyage (1+ days). Budget option but very long - flight recommended for time savings.",
        "impractical": True,
    },
    
    "Manila-Bacolod": {
        "distance": 680,
        "travel_time": 18,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 749, "max": 900},  # ✅ 2GO ₱749
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Overnight sea voyage. Budget option but flight is much faster.",
        "impractical": True,
    },
    
    "Manila-Cebu": {
        "distance": 700,
        "travel_time": 22,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 1367, "max": 1500},  # ✅ 2GO ₱1,367
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Multi-day sea voyage. Budget option but flight is much faster and similar cost.",
        "impractical": True,
    },
    
    "Manila-Butuan": {
        "distance": 1000,
        "travel_time": 30,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 1635, "max": 1800},  # ✅ 2GO ₱1,635 (Nasipit port)
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Very long sea voyage (1+ days) to Nasipit port. Flight strongly recommended.",
        "impractical": True,
    },
    
    "Manila-Dumaguete": {
        "distance": 750,
        "travel_time": 24,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 1706, "max": 1900},  # ✅ 2GO ₱1,706
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Multi-day sea voyage. Flight recommended for time savings.",
        "impractical": True,
    },
    
    "Manila-Dipolog": {
        "distance": 850,
        "travel_time": 32,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 2376, "max": 2500},  # ✅ 2GO ₱2,376
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Very long sea voyage (1+ days). Flight strongly recommended - much faster.",
        "impractical": True,
    },
    
    "Manila-Iligan": {
        "distance": 900,
        "travel_time": 30,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 2067, "max": 2200},  # ✅ 2GO ₱2,067
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Very long sea voyage (1+ days). Flight strongly recommended.",
        "impractical": True,
    },
    
    "Manila-Iloilo": {
        "distance": 580,
        "travel_time": 18,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 945, "max": 1100},  # ✅ 2GO ₱945
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Overnight sea voyage. Budget option but flight is much faster.",
        "impractical": True,
    },
    
    "Manila-Ozamiz": {
        "distance": 880,
        "travel_time": 32,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 2192, "max": 2400},  # ✅ 2GO ₱2,192
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Very long sea voyage (1+ days). Flight strongly recommended.",
        "impractical": True,
    },
    
    "Manila-Puerto Princesa": {
        "distance": 600,
        "travel_time": 20,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 1306, "max": 1500},  # ✅ 2GO ₱1,306
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Overnight sea voyage to Palawan. Flight recommended for time savings.",
        "impractical": True,
    },
    
    "Manila-Coron": {
        "distance": 650,
        "travel_time": 22,
        "modes": ["ferry"],
        "operators": ["2GO Travel", "Atienza Shipping"],
        "cost": {"min": 1000, "max": 1579},  # ✅ Atienza ₱1,000 / 2GO ₱1,579
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Multi-day sea voyage to Palawan. Flight strongly recommended.",
        "impractical": True,
    },
    
    "Manila-Zamboanga": {
        "distance": 850,
        "travel_time": 32,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 2157, "max": 2300},  # ✅ 2GO ₱2,157
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Very long sea voyage (1+ days). Flight strongly recommended.",
        "impractical": True,
    },
    
    "Manila-El Nido": {
        "distance": 700,
        "travel_time": 24,
        "modes": ["ferry"],
        "operators": ["Atienza Shipping"],
        "cost": {"min": 1000, "max": 1200},  # ✅ Atienza ₱1,000
        "frequency": "limited weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Multi-day sea voyage to Palawan. Flight recommended.",
        "impractical": True,
    },
    
    # ========== BATANGAS FERRY ROUTES ==========
    "Batangas-Calapan": {
        "distance": 55,
        "travel_time": 2,
        "modes": ["roro", "ferry"],
        "operators": ["Starlite Ferries", "Montenegro Lines", "OceanJet", "FastCat", "SuperCat 2GO"],
        "cost": {"min": 240, "max": 360},  # ✅ FastCat ₱240 / Starlite ₱250 / OceanJet ₱255 / SuperCat ₱360
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": False,
        "notes": "RORO ferry, gateway to Mindoro Oriental. Multiple operators, frequent service.",
    },
    
    "Batangas-Puerto Galera": {
        "distance": 60,
        "travel_time": 1.5,
        "modes": ["ferry"],
        "operators": ["Starlite Ferries", "Montenegro Lines", "Si-Kat", "Minolo Shipping"],
        "cost": {"min": 225, "max": 340},  # ✅ Starlite ₱225 / Montenegro ₱260 / ₱340
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Beach resort destination, White Beach. Popular tourist route.",
    },
    
    "Batangas-Abra": {
        "distance": 45,
        "travel_time": 1.5,
        "modes": ["ferry"],
        "operators": ["Montenegro Lines"],
        "cost": {"min": 260, "max": 300},  # ✅ Montenegro ₱260
        "frequency": "daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Mindoro Occidental destination",
    },
    
    "Batangas-Caticlan": {
        "distance": 350,
        "travel_time": 10,
        "modes": ["ferry"],
        "operators": ["Starlite Ferries", "2GO Travel"],
        "cost": {"min": 959, "max": 1000},  # ✅ 2GO ₱959 / Starlite ₱1,000
        "frequency": "few daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Gateway to Boracay. Long sea voyage - flight to Kalibo recommended.",
        "impractical": True,
    },
    
    "Batangas-Romblon": {
        "distance": 220,
        "travel_time": 7,
        "modes": ["ferry"],
        "operators": ["Starlite Ferries", "2GO Travel"],
        "cost": {"min": 957, "max": 1000},  # ✅ 2GO ₱957 / Starlite ₱1,000
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Marble capital of the Philippines. Long journey.",
    },
    
    "Batangas-Roxas": {
        "distance": 380,
        "travel_time": 11,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 979, "max": 1100},  # ✅ 2GO ₱979
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Palawan destination. Very long journey - flight recommended.",
        "impractical": True,
    },
    
    "Batangas-Odiongan": {
        "distance": 200,
        "travel_time": 6,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 780, "max": 900},  # ✅ 2GO ₱780
        "frequency": "few weekly",
        "has_ferry": True,
        "scenic": True,
        "notes": "Romblon province, Tablas Island",
    },
    
    "Batangas-Cebu": {
        "distance": 550,
        "travel_time": 16,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 700, "max": 850},  # ✅ 2GO ₱700
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Long overnight journey. Flight recommended.",
        "impractical": True,
    },
    
    "Batangas-Cagayan de Oro": {
        "distance": 800,
        "travel_time": 22,
        "modes": ["ferry"],
        "operators": ["2GO Travel"],
        "cost": {"min": 700, "max": 900},  # ✅ 2GO ₱700
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "scenic": True,
        "notes": "Multi-day sea voyage. Flight strongly recommended.",
        "impractical": True,
    },
    
    # ==================== ADDITIONAL LUZON ROUTES ====================
    
    # Southern Luzon
    "Manila-Naga": {
        "distance": 380,
        "travel_time": 8,
        "modes": ["bus"],
        "operators": ["Philtranco", "Isarog Line", "Penafrancia Tours"],
        "cost": {"min": 500, "max": 800},
        "frequency": "hourly",
        "has_overnight_option": True,
        "scenic": False,
        "notes": "Bicol region gateway, overnight bus available",
    },
    
    "Manila-Legazpi": {
        "distance": 500,
        "travel_time": 10,
        "modes": ["bus"],
        "operators": ["Philtranco", "Isarog Line", "DLTB Co"],
        "cost": {"min": 700, "max": 1100},
        "frequency": "several daily",
        "has_overnight_option": True,
        "scenic": False,
        "notes": "❌ Long journey, overnight bus recommended or consider flying",
        "impractical": True,
    },
    
    "Manila-Daet": {
        "distance": 320,
        "travel_time": 7,
        "modes": ["bus"],
        "operators": ["Philtranco", "Superlines"],
        "cost": {"min": 450, "max": 700},
        "frequency": "several daily",
        "scenic": False,
        "notes": "Gateway to Camarines Norte beaches",
    },
    
    "Naga-Legazpi": {
        "distance": 120,
        "travel_time": 2.5,
        "modes": ["bus", "van"],
        "operators": ["Isarog Line", "Philtranco", "Penafrancia Tours"],
        "cost": {"min": 200, "max": 350},
        "frequency": "hourly",
        "scenic": True,
        "notes": "Bicol corridor, view of Mayon Volcano",
    },
    
    "Legazpi-Sorsogon": {
        "distance": 65,
        "travel_time": 1.5,
        "modes": ["bus", "van"],
        "operators": ["Philtranco", "Isarog Line"],
        "cost": {"min": 100, "max": 200},
        "frequency": "hourly",
        "scenic": True,
        "notes": "Gateway to Donsol (whale sharks)",
    },
    
    # Central Luzon
    "Manila-Angeles": {
        "distance": 80,
        "travel_time": 2,
        "modes": ["bus"],
        "operators": ["Five Star Bus", "Genesis Transport", "Philtranco"],
        "cost": {"min": 150, "max": 250},
        "frequency": "every 30 mins",
        "scenic": False,
        "notes": "Clark gateway, frequent service",
    },
    
    "Manila-Baler": {
        "distance": 230,
        "travel_time": 5,
        "modes": ["bus", "van"],
        "operators": ["Genesis Transport", "Lizardo Trans"],
        "cost": {"min": 400, "max": 600},
        "frequency": "several daily",
        "scenic": True,
        "notes": "Surfing destination, coastal route",
    },
    
    "Manila-Tarlac": {
        "distance": 125,
        "travel_time": 2.5,
        "modes": ["bus"],
        "operators": ["Five Star Bus", "Victory Liner", "Genesis"],
        "cost": {"min": 200, "max": 350},
        "frequency": "hourly",
        "scenic": False,
    },
    
    # Northern Luzon Extensions
    "Manila-Laoag": {
        "distance": 480,
        "travel_time": 10,
        "modes": ["bus"],
        "operators": ["Partas", "Farinas Trans", "Florida Bus"],
        "cost": {"min": 700, "max": 1000},
        "frequency": "several daily",
        "has_overnight_option": True,
        "scenic": False,
        "notes": "❌ Very long journey, overnight bus or flight recommended",
        "impractical": True,
    },
    
    "Manila-Tuguegarao": {
        "distance": 480,
        "travel_time": 10,
        "modes": ["bus"],
        "operators": ["Victory Liner", "Florida Bus"],
        "cost": {"min": 650, "max": 950},
        "frequency": "several daily",
        "has_overnight_option": True,
        "scenic": False,
        "notes": "❌ Cagayan Valley, very long trip - flight advised",
        "impractical": True,
    },
    
    "Baguio-Vigan": {
        "distance": 180,
        "travel_time": 4,
        "modes": ["bus"],
        "operators": ["Partas", "Viron Transit"],
        "cost": {"min": 300, "max": 500},
        "frequency": "several daily",
        "scenic": True,
        "notes": "Mountain roads, scenic Ilocos route",
    },
    
    "Vigan-Laoag": {
        "distance": 80,
        "travel_time": 2,
        "modes": ["bus", "van"],
        "operators": ["Partas", "Farinas Trans"],
        "cost": {"min": 150, "max": 250},
        "frequency": "hourly",
        "scenic": True,
        "notes": "Ilocos coastal route",
    },
    
    # ==================== ADDITIONAL VISAYAS ROUTES ====================
    
    # Panay Island
    "Iloilo-Kalibo": {
        "distance": 130,
        "travel_time": 3,
        "modes": ["bus", "van"],
        "operators": ["Ceres Liner", "CBC"],
        "cost": {"min": 200, "max": 350},
        "frequency": "hourly",
        "scenic": False,
        "notes": "Gateway to Boracay via Caticlan",
    },
    
    "Kalibo-Caticlan": {
        "distance": 65,
        "travel_time": 1.5,
        "modes": ["bus", "van"],
        "operators": ["Southwest Tours", "CBC", "Ceres Liner"],
        "cost": {"min": 150, "max": 250},
        "frequency": "every 30 mins",
        "scenic": False,
        "notes": "Boracay gateway, very frequent service",
    },
    
    "Iloilo-Roxas": {
        "distance": 160,
        "travel_time": 3.5,
        "modes": ["bus", "van"],
        "operators": ["Ceres Liner", "Almark Transit"],
        "cost": {"min": 250, "max": 400},
        "frequency": "several daily",
        "scenic": False,
        "notes": "Capiz province, seafood capital",
    },
    
    # Negros Island
    "Bacolod-Dumaguete": {
        "distance": 180,
        "travel_time": 4,
        "modes": ["bus"],
        "operators": ["Ceres Liner"],
        "cost": {"min": 300, "max": 450},
        "frequency": "hourly",
        "scenic": True,
        "notes": "Trans-Negros highway, mountain pass",
    },
    
    "Bacolod-Silay": {
        "distance": 15,
        "travel_time": 0.5,
        "modes": ["bus", "van", "jeepney"],
        "operators": ["Ceres Liner", "local operators"],
        "cost": {"min": 30, "max": 60},
        "frequency": "every 15 mins",
        "scenic": False,
        "notes": "Airport area, very short trip",
    },
    
    # Bohol Island
    "Tagbilaran-Panglao": {
        "distance": 18,
        "travel_time": 0.5,
        "modes": ["tricycle", "van"],
        "operators": ["local transport"],
        "cost": {"min": 100, "max": 200},
        "frequency": "continuous",
        "scenic": True,
        "notes": "Beach resorts, airport nearby",
    },
    
    "Tagbilaran-Carmen": {
        "distance": 55,
        "travel_time": 1.5,
        "modes": ["bus", "van"],
        "operators": ["Island City Express", "Lite Shipping"],
        "cost": {"min": 80, "max": 150},
        "frequency": "hourly",
        "scenic": True,
        "notes": "Chocolate Hills area",
    },
    
    # Leyte & Samar
    "Tacloban-Ormoc": {
        "distance": 110,
        "travel_time": 2.5,
        "modes": ["bus", "van"],
        "operators": ["Van Van Express", "DuPont Transport"],
        "cost": {"min": 200, "max": 300},
        "frequency": "hourly",
        "scenic": True,
        "notes": "Trans-Leyte highway, mountain pass",
    },
    
    "Tacloban-Catbalogan": {
        "distance": 150,
        "travel_time": 3.5,
        "modes": ["bus", "van"],
        "operators": ["Van Van Express", "Philtranco"],
        "cost": {"min": 250, "max": 400},
        "frequency": "several daily",
        "scenic": True,
        "notes": "Leyte-Samar bridge connection",
    },
    
    "Ormoc-Maasin": {
        "distance": 90,
        "travel_time": 2,
        "modes": ["bus", "van"],
        "operators": ["Van Van Express", "DuPont Transport"],
        "cost": {"min": 150, "max": 250},
        "frequency": "hourly",
        "scenic": True,
        "notes": "Southern Leyte gateway",
    },
    
    # Inter-Visayas Ferry Routes
    "Cebu-Leyte": {
        "distance": 120,
        "travel_time": 3,
        "modes": ["ferry"],
        "operators": ["SuperCat", "Roble Shipping"],
        "cost": {"min": 600, "max": 900},
        "frequency": "daily",
        "has_ferry": True,
        "notes": "Multiple ports, schedule varies",
    },
    
    "Manila-Cebu": {
        "distance": 600,
        "travel_time": 24,
        "modes": ["ferry"],
        "operators": ["2GO Travel", "Trans-Asia Shipping"],
        "cost": {"min": 1500, "max": 3000},
        "frequency": "few weekly",
        "has_ferry": True,
        "has_overnight_option": True,
        "notes": "❌ Long sea voyage, flight strongly recommended",
        "impractical": True,
    },
    
    # ==================== ADDITIONAL MINDANAO ROUTES ====================
    
    # Davao Region Extensions
    "Davao-Mati": {
        "distance": 180,
        "travel_time": 4,
        "modes": ["bus", "van"],
        "operators": ["Bachelor Express", "Davao Metro Shuttle"],
        "cost": {"min": 300, "max": 450},
        "frequency": "several daily",
        "scenic": True,
        "notes": "Pacific coast, surfing destination",
    },
    
    "Davao-Cotabato": {
        "distance": 200,
        "travel_time": 4.5,
        "modes": ["bus", "van"],
        "operators": ["Yellow Bus Line", "Weena Express"],
        "cost": {"min": 350, "max": 550},
        "frequency": "several daily",
        "scenic": False,
        "notes": "Central Mindanao route",
    },
    
    "General Santos-Koronadal": {
        "distance": 25,
        "travel_time": 0.5,
        "modes": ["bus", "van", "jeepney"],
        "operators": ["Yellow Bus Line", "local operators"],
        "cost": {"min": 50, "max": 100},
        "frequency": "every 15 mins",
        "scenic": False,
        "notes": "South Cotabato, very short trip",
    },
    
    "General Santos-Tacurong": {
        "distance": 90,
        "travel_time": 2,
        "modes": ["bus", "van"],
        "operators": ["Yellow Bus Line", "Bachelor Express"],
        "cost": {"min": 150, "max": 250},
        "frequency": "hourly",
        "scenic": False,
        "notes": "Sultan Kudarat province",
    },
    
    # Northern Mindanao Extensions
    "Cagayan de Oro-Malaybalay": {
        "distance": 95,
        "travel_time": 2,
        "modes": ["bus", "van"],
        "operators": ["Rural Transit", "Bachelor Express"],
        "cost": {"min": 150, "max": 250},
        "frequency": "hourly",
        "scenic": True,
        "notes": "Bukidnon highlands, cooler climate",
    },
    
    "Iligan-Marawi": {
        "distance": 38,
        "travel_time": 1,
        "modes": ["bus", "van"],
        "operators": ["Rural Transit", "local vans"],
        "cost": {"min": 80, "max": 150},
        "frequency": "frequent",
        "scenic": True,
        "notes": "Lake Lanao area, check travel advisories",
    },
    
    "Butuan-Surigao": {
        "distance": 120,
        "travel_time": 2.5,
        "modes": ["bus", "van"],
        "operators": ["Bachelor Express", "Philtranco"],
        "cost": {"min": 200, "max": 350},
        "frequency": "hourly",
        "scenic": True,
        "notes": "Gateway to Siargao via ferry",
    },
    
    "Surigao-Siargao": {
        "distance": 50,
        "travel_time": 1.5,
        "modes": ["ferry"],
        "operators": ["Starlite Ferries", "Montenegro Lines"],
        "cost": {"min": 200, "max": 400},
        "frequency": "multiple daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Surfing paradise, island connection",
    },
    
    # Camiguin Island
    "Cagayan de Oro-Camiguin": {
        "distance": 90,
        "travel_time": 4,
        "modes": ["bus+ferry"],
        "operators": ["Bus to Balingoan, ferry operators"],
        "cost": {"min": 300, "max": 500},
        "frequency": "several daily",
        "has_ferry": True,
        "scenic": True,
        "notes": "Bus to Balingoan port, then ferry to Camiguin",
    },
    
    # Zamboanga Peninsula Extensions
    "Zamboanga-Isabela": {
        "distance": 85,
        "travel_time": 2,
        "modes": ["bus", "van"],
        "operators": ["Rural Transit", "Bachelor Express"],
        "cost": {"min": 150, "max": 250},
        "frequency": "several daily",
        "scenic": True,
        "notes": "Basilan connection via ferry",
    },
    
    "Dipolog-Dapitan": {
        "distance": 12,
        "travel_time": 0.3,
        "modes": ["jeepney", "tricycle"],
        "operators": ["local transport"],
        "cost": {"min": 30, "max": 60},
        "frequency": "continuous",
        "scenic": True,
        "notes": "Rizal shrine, very short trip",
    },
    
    # ARMM/BARMM Routes
    "Cotabato-Marawi": {
        "distance": 120,
        "travel_time": 3,
        "modes": ["bus", "van"],
        "operators": ["Weena Express", "local operators"],
        "cost": {"min": 200, "max": 350},
        "frequency": "several daily",
        "scenic": True,
        "notes": "Check current travel advisories before booking",
    },
    
    # Palawan Routes (limited ground transport due to geography)
    "Puerto Princesa-El Nido": {
        "distance": 230,
        "travel_time": 6,
        "modes": ["bus", "van"],
        "operators": ["Cherry Bus", "Roro Bus", "Lexus Shuttle"],
        "cost": {"min": 500, "max": 800},
        "frequency": "several daily",
        "scenic": True,
        "notes": "Long but scenic coastal route, popular tourist route",
    },
    
    "Puerto Princesa-Sabang": {
        "distance": 80,
        "travel_time": 2,
        "modes": ["van"],
        "operators": ["Lexus Shuttle", "Bunk House vans"],
        "cost": {"min": 300, "max": 500},
        "frequency": "several daily",
        "scenic": True,
        "notes": "Underground River gateway",
    },
    
    "Puerto Princesa-San Vicente": {
        "distance": 180,
        "travel_time": 4.5,
        "modes": ["bus", "van"],
        "operators": ["Roro Bus", "local vans"],
        "cost": {"min": 400, "max": 600},
        "frequency": "few daily",
        "scenic": True,
        "notes": "Long Beach destination, limited service",
    },
}


def find_ground_route(city1: str, city2: str) -> Optional[Dict[str, Any]]:
    """
    Find ground transport route between two cities
    
    Args:
        city1: First city name
        city2: Second city name
        
    Returns:
        Route data dict or None if not found
    """
    if not city1 or not city2:
        return None
    
    # Normalize city names
    def normalize_city(city):
        # ✅ FIX: Extract city name before comma (handles "Pagadian City, Zamboanga del Sur")
        city_part = city.split(',')[0].strip() if ',' in city else city.strip()
        normalized = city_part.lower().replace("  ", " ")
        # Handle common city name variations
        normalized = normalized.replace(" city", "").replace(" municipality", "")
        return normalized
    
    norm_city1 = normalize_city(city1)
    norm_city2 = normalize_city(city2)
    
    # Try both directions
    for route_key, route_data in GROUND_TRANSPORT_ROUTES.items():
        start, end = route_key.split("-")
        start = normalize_city(start)
        end = normalize_city(end)
        
        if (norm_city1 == start and norm_city2 == end) or \
           (norm_city1 == end and norm_city2 == start):
            return {
                **route_data,
                "route_key": route_key,
                "bidirectional": True,
            }
    
    return None


def has_ground_route(city1: str, city2: str) -> bool:
    """
    Check if ground transport exists for a route
    
    Args:
        city1: First city
        city2: Second city
        
    Returns:
        True if route exists
    """
    return find_ground_route(city1, city2) is not None


def get_routes_from_city(city: str) -> List[Dict[str, Any]]:
    """
    Get all available ground routes from a city
    
    Args:
        city: City name
        
    Returns:
        List of available routes
    """
    if not city:
        return []
    
    def normalize_city(c):
        # ✅ FIX: Extract city name before comma
        city_part = c.split(',')[0].strip() if ',' in c else c.strip()
        normalized = city_part.lower().replace("  ", " ")
        # Handle common city name variations
        normalized = normalized.replace(" city", "").replace(" municipality", "")
        return normalized
    
    norm_city = normalize_city(city)
    routes = []
    
    for route_key, route_data in GROUND_TRANSPORT_ROUTES.items():
        start, end = route_key.split("-")
        start_norm = normalize_city(start)
        end_norm = normalize_city(end)
        
        if norm_city == start_norm:
            routes.append({"destination": end, **route_data, "route_key": route_key})
        elif norm_city == end_norm:
            routes.append({"destination": start, **route_data, "route_key": route_key})
    
    return routes
