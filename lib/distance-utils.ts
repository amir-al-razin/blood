// Distance calculation utilities for donor matching

interface Coordinates {
  lat: number
  lng: number
}

// Major cities and areas in Bangladesh with approximate coordinates
const locationCoordinates: Record<string, Coordinates> = {
  // Dhaka Division
  'Dhaka': { lat: 23.8103, lng: 90.4125 },
  'Dhaka - Dhanmondi': { lat: 23.7461, lng: 90.3742 },
  'Dhaka - Gulshan': { lat: 23.7925, lng: 90.4078 },
  'Dhaka - Uttara': { lat: 23.8759, lng: 90.3795 },
  'Dhaka - Old Dhaka': { lat: 23.7104, lng: 90.4074 },
  'Dhaka - Mirpur': { lat: 23.8223, lng: 90.3654 },
  'Dhaka - Wari': { lat: 23.7104, lng: 90.4074 },
  'Gazipur': { lat: 24.0022, lng: 90.4264 },
  'Narayanganj': { lat: 23.6238, lng: 90.4993 },
  'Savar': { lat: 23.8583, lng: 90.2667 },
  
  // Chittagong Division
  'Chittagong': { lat: 22.3569, lng: 91.7832 },
  'Chittagong - Agrabad': { lat: 22.3311, lng: 91.8206 },
  'Chittagong - Halishahar': { lat: 22.3311, lng: 91.8206 },
  'Cox\'s Bazar': { lat: 21.4272, lng: 92.0058 },
  'Comilla': { lat: 23.4607, lng: 91.1809 },
  
  // Sylhet Division
  'Sylhet': { lat: 24.8949, lng: 91.8687 },
  'Moulvibazar': { lat: 24.4829, lng: 91.7774 },
  
  // Rajshahi Division
  'Rajshahi': { lat: 24.3745, lng: 88.6042 },
  'Rangpur': { lat: 25.7439, lng: 89.2752 },
  'Bogura': { lat: 24.8465, lng: 89.3772 },
  
  // Khulna Division
  'Khulna': { lat: 22.8456, lng: 89.5403 },
  'Jessore': { lat: 23.1634, lng: 89.2182 },
  
  // Barisal Division
  'Barisal': { lat: 22.7010, lng: 90.3535 },
  'Patuakhali': { lat: 22.3596, lng: 90.3298 },
  
  // Mymensingh Division
  'Mymensingh': { lat: 24.7471, lng: 90.4203 }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate distance between two locations by name
 * @param location1 First location name
 * @param location2 Second location name
 * @returns Distance in kilometers, or estimated distance if coordinates not found
 */
export function calculateLocationDistance(location1: string, location2: string): number {
  // Normalize location names
  const loc1 = normalizeLocationName(location1)
  const loc2 = normalizeLocationName(location2)
  
  const coords1 = locationCoordinates[loc1]
  const coords2 = locationCoordinates[loc2]
  
  if (coords1 && coords2) {
    return Math.round(calculateHaversineDistance(
      coords1.lat, coords1.lng, 
      coords2.lat, coords2.lng
    ))
  }
  
  // Fallback to estimated distances if coordinates not available
  return getEstimatedDistance(loc1, loc2)
}

/**
 * Normalize location names for consistent matching
 */
function normalizeLocationName(location: string): string {
  // Remove extra spaces and convert to title case
  const normalized = location.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  // Check if it's already in our coordinates list
  if (locationCoordinates[normalized]) {
    return normalized
  }
  
  // Try to match main city (before hyphen)
  const mainCity = normalized.split(' - ')[0]
  if (locationCoordinates[mainCity]) {
    return mainCity
  }
  
  return normalized
}

/**
 * Fallback distance estimation based on known city distances
 */
function getEstimatedDistance(loc1: string, loc2: string): number {
  // Simple distance matrix for major cities
  const cityDistances: Record<string, Record<string, number>> = {
    'Dhaka': { 
      'Dhaka': 0, 'Chittagong': 244, 'Sylhet': 198, 'Rajshahi': 256, 
      'Khulna': 169, 'Barisal': 174, 'Rangpur': 330, 'Mymensingh': 120 
    },
    'Chittagong': { 
      'Dhaka': 244, 'Chittagong': 0, 'Sylhet': 168, 'Rajshahi': 500, 
      'Khulna': 413, 'Barisal': 418, 'Rangpur': 574, 'Mymensingh': 364 
    },
    'Sylhet': { 
      'Dhaka': 198, 'Chittagong': 168, 'Sylhet': 0, 'Rajshahi': 454, 
      'Khulna': 367, 'Barisal': 372, 'Rangpur': 528, 'Mymensingh': 318 
    },
    'Rajshahi': { 
      'Dhaka': 256, 'Chittagong': 500, 'Sylhet': 454, 'Rajshahi': 0, 
      'Khulna': 425, 'Barisal': 430, 'Rangpur': 274, 'Mymensingh': 376 
    },
    'Khulna': { 
      'Dhaka': 169, 'Chittagong': 413, 'Sylhet': 367, 'Rajshahi': 425, 
      'Khulna': 0, 'Barisal': 243, 'Rangpur': 499, 'Mymensingh': 289 
    },
    'Barisal': { 
      'Dhaka': 174, 'Chittagong': 418, 'Sylhet': 372, 'Rajshahi': 430, 
      'Khulna': 243, 'Barisal': 0, 'Rangpur': 504, 'Mymensingh': 294 
    },
    'Rangpur': { 
      'Dhaka': 330, 'Chittagong': 574, 'Sylhet': 528, 'Rajshahi': 274, 
      'Khulna': 499, 'Barisal': 504, 'Rangpur': 0, 'Mymensingh': 450 
    },
    'Mymensingh': { 
      'Dhaka': 120, 'Chittagong': 364, 'Sylhet': 318, 'Rajshahi': 376, 
      'Khulna': 289, 'Barisal': 294, 'Rangpur': 450, 'Mymensingh': 0 
    }
  }
  
  // Extract main cities
  const city1 = loc1.split(' - ')[0]
  const city2 = loc2.split(' - ')[0]
  
  // Same city/area - assume close distance
  if (city1 === city2) {
    return loc1 === loc2 ? 0 : 15 // Same area = 0km, same city = 15km
  }
  
  // Look up in distance matrix
  const distance = cityDistances[city1]?.[city2]
  if (distance !== undefined) {
    return distance
  }
  
  // Default fallback distance
  return 100
}

/**
 * Get all locations within a certain distance
 * @param centerLocation The center location
 * @param maxDistance Maximum distance in kilometers
 * @returns Array of location names within the distance
 */
export function getLocationsWithinDistance(
  centerLocation: string, 
  maxDistance: number
): string[] {
  const center = normalizeLocationName(centerLocation)
  const withinDistance: string[] = []
  
  Object.keys(locationCoordinates).forEach(location => {
    const distance = calculateLocationDistance(center, location)
    if (distance <= maxDistance) {
      withinDistance.push(location)
    }
  })
  
  return withinDistance
}

/**
 * Blood type compatibility matrix
 */
export const bloodCompatibility: Record<string, string[]> = {
  'O_NEGATIVE': ['O_NEGATIVE', 'O_POSITIVE', 'A_NEGATIVE', 'A_POSITIVE', 'B_NEGATIVE', 'B_POSITIVE', 'AB_NEGATIVE', 'AB_POSITIVE'],
  'O_POSITIVE': ['O_POSITIVE', 'A_POSITIVE', 'B_POSITIVE', 'AB_POSITIVE'],
  'A_NEGATIVE': ['A_NEGATIVE', 'A_POSITIVE', 'AB_NEGATIVE', 'AB_POSITIVE'],
  'A_POSITIVE': ['A_POSITIVE', 'AB_POSITIVE'],
  'B_NEGATIVE': ['B_NEGATIVE', 'B_POSITIVE', 'AB_NEGATIVE', 'AB_POSITIVE'],
  'B_POSITIVE': ['B_POSITIVE', 'AB_POSITIVE'],
  'AB_NEGATIVE': ['AB_NEGATIVE', 'AB_POSITIVE'],
  'AB_POSITIVE': ['AB_POSITIVE']
}

/**
 * Check if donor blood type is compatible with recipient
 * @param donorBloodType Donor's blood type
 * @param recipientBloodType Recipient's blood type
 * @returns True if compatible
 */
export function isBloodTypeCompatible(
  donorBloodType: string, 
  recipientBloodType: string
): boolean {
  const compatibleTypes = bloodCompatibility[donorBloodType] || []
  return compatibleTypes.includes(recipientBloodType)
}