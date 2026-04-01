import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // For the location icon
import TopBar from '@/components/TopBar';
import MapBottomSheet from '@/components/map/MapBottomSheet';

const LOGO_IMAGE = require('@/assets/images/logo.png');

const pinkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry", "stylers": [{ "color": "#fce4ec" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#f8bbd0" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] }
];

const suggestedUsers = [
  { id: '1', name: 'Sarah', age: 24, distance: '0.5 MILES AWAY', image: LOGO_IMAGE },
  { id: '2', name: 'Marcus', age: 26, distance: '1.2 MILES AWAY', image: LOGO_IMAGE },
];

export default function MapScreen() {
  const [location, setLocation] = useState<any>(null);
  const mapRef = useRef<MapView>(null); // Reference to control the map

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc);
    })();
  }, []);

  // Function to snap back to your location
  const goToMyLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000); // 1 second animation
    }
  };

  return (
    <View style={styles.container}>
      <TopBar title="Mingle Map" />
      
      <View style={styles.mapArea}>
        {location ? (
          <>
            <MapView
              ref={mapRef}
              key={`pink-map-${location.coords.latitude}`} 
              style={StyleSheet.absoluteFillObject}
              provider={PROVIDER_GOOGLE}
              customMapStyle={pinkMapStyle}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
            >
              <Marker 
                coordinate={{ 
                  latitude: location.coords.latitude, 
                  longitude: location.coords.longitude 
                }} 
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.pulseContainer}>
                  <View style={styles.pulseRingOuter} /><View style={styles.pulseRingInner} /><View style={styles.pulseCenter} />
                </View>
              </Marker>
            </MapView>

            {/* FLOATING LOCATION BUTTON */}
            <TouchableOpacity 
              style={styles.locationButton} 
              onPress={goToMyLocation}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate" size={24} color="#C44A93" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#C44A93" />
          </View>
        )}

        {/* Dynamic Suggestions Sheet */}
        <MapBottomSheet users={suggestedUsers} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCF9FC' },
  mapArea: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Location Button Positioning
  locationButton: {
    position: 'absolute',
    right: 20,
    bottom: 300, // Positioned right above the Peek sheet (which is 280 high)
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20, // Ensure it's above the map
  },

  pulseContainer: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  pulseCenter: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#C44A93', borderWidth: 2, borderColor: 'white', position: 'absolute' },
  pulseRingInner: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: 'rgba(196, 74, 147, 0.25)', position: 'absolute' },
  pulseRingOuter: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: 'rgba(196, 74, 147, 0.12)', position: 'absolute' },
});