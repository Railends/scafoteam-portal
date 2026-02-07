/**
 * Geolocation utilities for Scafoteam Portal
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Geocode an address string to { lat, lng }
 * @param {string} address 
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export const geocodeAddress = async (address) => {
    if (!address) return null;

    try {
        // We request addressdetails=1 to get individual components
        // We add accept-language=en,lv to avoid Cyrillic/local variants if possible
        const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&accept-language=lv,en,fi`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ScafoteamPortal/1.0 (contact@scafoteam.lv)'
            }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            const raw = data[0];
            const addr = raw.address || {};

            // Format: Road HouseNumber, Postcode City, Country
            const street = addr.road || addr.pedestrian || addr.cycleway || addr.path || '';
            // Sometimes the house number is in 'house_number', sometimes in 'name', sometimes in 'house_name'
            let house = addr.house_number || addr.house_name || '';
            if (!house && raw.name && raw.name !== street && /^\d+/.test(raw.name)) {
                house = raw.name;
            }

            const postcode = addr.postcode || '';
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || '';
            const country = addr.country || '';

            // Clean Display Address: Street House, City
            let cleanAddress = '';
            if (street) {
                cleanAddress += street;
                if (house) cleanAddress += ` ${house}`;
                if (city) cleanAddress += `, ${city}`;
            }

            // If we couldn't find a street but have a display name, fallback carefully
            if (!cleanAddress && raw.display_name) {
                const parts = raw.display_name.split(',');
                cleanAddress = parts.slice(0, 2).join(',').trim();
            }

            return {
                lat: parseFloat(raw.lat),
                lng: parseFloat(raw.lon),
                address: cleanAddress || raw.display_name,
                city: city,
                postcode: postcode,
                country: country
            };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    return null;
};

/**
 * Calculate straight line distance between two points (Haversine formula)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Get road distance using OSRM (Open Source Routing Machine)
 * @returns {Promise<number | null>} distance in KM
 */
export const getRoadDistance = async (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            return data.routes[0].distance / 1000; // convert meters to km
        }
    } catch (error) {
        console.error('Routing error:', error);
    }

    // Fallback to straight line if road distance fails
    return calculateDistance(lat1, lon1, lat2, lon2);
};
