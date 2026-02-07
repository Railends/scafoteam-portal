import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default leaflet icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Custom Site Icon (Blue/Navy)
const siteIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom Residence Icon (Orange/Gold)
const residenceIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle map center/zoom changes smoothly
function ChangeView({ center, zoom }) {
    const map = useMap();
    React.useEffect(() => {
        if (center) {
            map.setView(center, zoom, { animate: true, duration: 1 });
        }
    }, [center, zoom, map]);
    return null;
}

export const ProjectMap = ({ site, residences }) => {
    const lat = parseFloat(site?.lat);
    const lng = parseFloat(site?.lng);

    if (isNaN(lat) || isNaN(lng)) return null;

    const sitePos = [lat, lng];

    // Calculate bounds or center
    // For now, we center on the site and maybe auto-zoom

    return (
        <div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-100 shadow-sm relative z-0">
            <MapContainer
                center={sitePos}
                zoom={12}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <ChangeView center={sitePos} zoom={12} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Main Site Marker */}
                <Marker position={sitePos} icon={siteIcon}>
                    <Popup>
                        <div className="font-bold text-scafoteam-navy">OBJEKTS: {site.name}</div>
                        <div className="text-xs text-gray-500">{site.address}</div>
                    </Popup>
                </Marker>

                {/* Residence Markers */}
                {residences.map((res, idx) => {
                    const rLat = parseFloat(res.lat);
                    const rLng = parseFloat(res.lng);
                    if (isNaN(rLat) || isNaN(rLng)) return null;

                    return (
                        <Marker
                            key={res.id || idx}
                            position={[rLat, rLng]}
                            icon={residenceIcon}
                        >
                            <Popup>
                                <div className="font-bold text-scafoteam-accent">DZĪVESVIETA</div>
                                <div className="text-xs">{res.address}</div>
                                {res.distance && (
                                    <div className="text-[10px] mt-1 font-black text-blue-600 uppercase">
                                        {res.distance.toFixed(1)} KM līdz objektam
                                    </div>
                                )}
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};
