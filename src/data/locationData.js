// Location data for Philippines regions and cities
// Simplified structure since this app is Philippines-focused
export const philippines = {
  code: 'PH',
  name: 'Philippines',
  regions: [
    {
      code: 'NCR',
      name: 'National Capital Region (NCR)',
      cities: [
          'Caloocan',
          'Las Piñas',
          'Makati',
          'Malabon',
          'Mandaluyong',
          'Manila',
          'Marikina',
          'Muntinlupa',
          'Navotas',
          'Parañaque',
          'Pasay',
          'Pasig',
          'Quezon City',
          'San Juan',
          'Taguig',
          'Valenzuela'
        ]
      },
      {
        code: 'CAR',
        name: 'Cordillera Administrative Region (CAR)',
        cities: [
          'Baguio',
          'Tabuk'
        ]
      },
      {
        code: 'R01',
        name: 'Ilocos Region (Region I)',
        cities: [
          'Alaminos',
          'Batac',
          'Candon',
          'Dagupan',
          'Laoag',
          'San Carlos',
          'San Fernando',
          'Urdaneta',
          'Vigan'
        ]
      },
      {
        code: 'R02',
        name: 'Cagayan Valley (Region II)',
        cities: [
          'Cauayan',
          'Ilagan',
          'Santiago',
          'Tuguegarao'
        ]
      },
      {
        code: 'R03',
        name: 'Central Luzon (Region III)',
        cities: [
          'Angeles',
          'Balanga',
          'Cabanatuan',
          'Gapan',
          'Mabalacat',
          'Malolos',
          'Meycauayan',
          'Muñoz',
          'Olongapo',
          'Palayan',
          'San Fernando',
          'San Jose',
          'San Jose del Monte',
          'Tarlac'
        ]
      },
      {
        code: 'R04A',
        name: 'CALABARZON (Region IV-A)',
        cities: [
          'Antipolo',
          'Bacoor',
          'Batangas',
          'Biñan',
          'Cabuyao',
          'Calamba',
          'Cavite City',
          'Dasmariñas',
          'General Trias',
          'Imus',
          'Lipa',
          'Lucena',
          'San Pablo',
          'San Pedro',
          'Santa Rosa',
          'Tagaytay',
          'Tanauan',
          'Tayabas',
          'Trece Martires'
        ]
      },
      {
        code: 'R04B',
        name: 'MIMAROPA (Region IV-B)',
        cities: [
          'Calapan',
          'Puerto Princesa'
        ]
      },
      {
        code: 'R05',
        name: 'Bicol Region (Region V)',
        cities: [
          'Iriga',
          'Legazpi',
          'Ligao',
          'Masbate City',
          'Naga',
          'Sorsogon City',
          'Tabaco'
        ]
      },
      {
        code: 'R06',
        name: 'Western Visayas (Region VI)',
        cities: [
          'Bacolod',
          'Bago',
          'Cadiz',
          'Escalante',
          'Himamaylan',
          'Iloilo City',
          'Kabankalan',
          'La Carlota',
          'Passi',
          'Roxas',
          'Sagay',
          'San Carlos',
          'Silay',
          'Sipalay',
          'Talisay',
          'Victorias'
        ]
      },
      {
        code: 'R07',
        name: 'Central Visayas (Region VII)',
        cities: [
          'Bais',
          'Bayawan',
          'Bogo',
          'Canlaon',
          'Carcar',
          'Cebu City',
          'Danao',
          'Dumaguete',
          'Guihulngan',
          'Lapu-Lapu',
          'Mandaue',
          'Naga',
          'Tagbilaran',
          'Talisay',
          'Tanjay',
          'Toledo',
          'Tomohon'
        ]
      },
      {
        code: 'R08',
        name: 'Eastern Visayas (Region VIII)',
        cities: [
          'Baybay',
          'Borongan',
          'Calbayog',
          'Catbalogan',
          'Maasin',
          'Ormoc',
          'Tacloban'
        ]
      },
      {
        code: 'R09',
        name: 'Zamboanga Peninsula (Region IX)',
        cities: [
          'Dapitan',
          'Dipolog',
          'Isabela',
          'Pagadian',
          'Zamboanga City'
        ]
      },
      {
        code: 'R10',
        name: 'Northern Mindanao (Region X)',
        cities: [
          'Cagayan de Oro',
          'El Salvador',
          'Gingoog',
          'Iligan',
          'Malaybalay',
          'Oroquieta',
          'Ozamiz',
          'Tangub',
          'Valencia'
        ]
      },
      {
        code: 'R11',
        name: 'Davao Region (Region XI)',
        cities: [
          'Davao City',
          'Digos',
          'Mati',
          'Panabo',
          'Samal',
          'Tagum'
        ]
      },
      {
        code: 'R12',
        name: 'SOCCSKSARGEN (Region XII)',
        cities: [
          'General Santos',
          'Kidapawan',
          'Koronadal',
          'Tacurong'
        ]
      },
      {
        code: 'R13',
        name: 'Caraga (Region XIII)',
        cities: [
          'Bayugan',
          'Bislig',
          'Butuan',
          'Cabadbaran',
          'Surigao City',
          'Tandag'
        ]
      },
      {
        code: 'BARMM',
        name: 'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)',
        cities: [
          'Cotabato City',
          'Lamitan',
          'Marawi'
        ]
      }
    ]
};

// Helper functions - Simplified for Philippines-only app
export const getPhilippines = () => philippines;

// Get all regions (no need for country code since it's always Philippines)
export const getRegions = () => philippines.regions;

// Backward compatibility: Keep old function names for existing code
export const getRegionsByCountry = (countryCode) => {
  // Always return Philippines regions regardless of country code
  return philippines.regions;
};

export const getCitiesByRegion = (countryCode, regionCode) => {
  // Country code not needed since we only have Philippines
  const region = philippines.regions.find(r => r.code === regionCode);
  return region ? region.cities : [];
};

export const getCountryName = (countryCode) => {
  // Always return Philippines
  return philippines.name;
};

export const getRegionName = (countryCode, regionCode) => {
  const region = philippines.regions.find(r => r.code === regionCode);
  return region ? region.name : '';
};