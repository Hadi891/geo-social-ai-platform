import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Text,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '@/components/TopBar';
import MapBottomSheet from '@/components/map/MapBottomSheet';
import FilterModal from '@/components/map/FilterModal';
import UserMarker from '@/components/map/UserMarker';

const LOGO_IMAGE = require('@/assets/images/logo.png');

const pinkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry", "stylers": [{ "color": "#fce4ec" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#f8bbd0" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] }
];

const MAP_FILTERS = [
  { id: '1', icon: 'pin-outline', label: 'Within 5km' },
  { id: '2', icon: 'calendar-clear-outline', label: 'All Ages' },
  { id: '3', icon: 'options-outline', label: 'Interests' },
];

const FILTER_OPTIONS: Record<string, string[]> = {
  'Within 5km': ['1km', '2km', '5km', '10km', '25km'],
  'All Ages': ['18-25', '25-35', '35-50', '50+'],
  'Interests': ['Gaming', 'CrossFit', 'Algebra', 'Music', 'Tech'],
};

const suggestedUsers = [
  { id: '1', name: 'Sarah', age: 24, distance: '0.5 MILES AWAY', image: LOGO_IMAGE },
  { id: '2', name: 'Marcus', age: 26, distance: '1.2 MILES AWAY', image: LOGO_IMAGE },
];

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    'Within 5km': [],
    'All Ages': [],
    'Interests': [],
  });

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc);

      // Mock users near you
      const mockUsers = [
        { 
          id: 'u1', 
          name: 'Jessica', 
          age: 23,
          latitude: loc.coords.latitude + 0.002, 
          longitude: loc.coords.longitude + 0.002, 
          avatarSource: LOGO_IMAGE,
          distance: '0.4 miles away'
        },
        { 
          id: 'u2', 
          name: 'David', 
          age: 27,
          latitude: loc.coords.latitude - 0.003, 
          longitude: loc.coords.longitude + 0.004, 
          avatarSource: LOGO_IMAGE,
          distance: '0.8 miles away'
        },
        { 
          id: 'u3', 
          name: 'Sophie', 
          age: 25,
          latitude: loc.coords.latitude + 0.005, 
          longitude: loc.coords.longitude - 0.002, 
          avatarSource: LOGO_IMAGE,
          distance: '1.1 miles away'
        },
      ];
      setNearbyUsers(mockUsers);
    })();
  }, []);

  const handleSelectOption = (option: string | null) => {
    if (!activeFilter) return;
    setSelectedFilters(prev => {
      const currentSelections = prev[activeFilter];
      if (option === null) return { ...prev, [activeFilter]: [] };
      if (activeFilter === 'Within 5km') return { ...prev, [activeFilter]: [option] };
      
      const isAlreadySelected = currentSelections.includes(option);
      const newSelections = isAlreadySelected
        ? currentSelections.filter(item => item !== option)
        : [...currentSelections, option];
      return { ...prev, [activeFilter]: newSelections };
    });
  };

  const goToMyLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const centerOnUser = (user: any) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: user.latitude,
        longitude: user.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 800);
    }
  };

  const handleMarkerPress = (user: any) => {
    setSelectedUser(user);
    centerOnUser(user);
  };

  return (
    <View style={styles.container}>
      <TopBar title="Mingle Map" />

      <View style={styles.mapArea}>
        {location ? (
          <>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              provider={PROVIDER_GOOGLE}
              customMapStyle={pinkMapStyle}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
              onPress={() => setSelectedUser(null)}
            >

              <Marker
                coordinate={{ 
                  latitude: location.coords.latitude, 
                  longitude: location.coords.longitude 
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={10}
              >
               
                <View style={styles.cssDotOuter}>
                  <View style={styles.cssDotInner} />
                </View>
              </Marker>

              {/* Nearby Users */}
              {nearbyUsers.map((user) => (
                <UserMarker 
                  key={user.id} 
                  user={user} 
                  onPress={() => handleMarkerPress(user)}
                />
              ))}
            </MapView>

            {/* Filters */}
            <View style={styles.filterOverlayContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {MAP_FILTERS.map((filter) => {
                  const selections = selectedFilters[filter.label];
                  const isSelected = selections.length > 0;
                  return (
                    <Pressable
                      key={filter.id}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => setActiveFilter(filter.label)}
                    >
                      <Ionicons name={filter.icon as any} size={16} color={isSelected ? "#FFFFFF" : "#2F2632"} />
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {isSelected 
                          ? `${selections[0]}${selections.length > 1 ? ` +${selections.length - 1}` : ''}` 
                          : filter.label}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={isSelected ? "#FFFFFF" : "#8E8291"} style={{ marginLeft: 4 }} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Go to my location button */}
            <TouchableOpacity style={styles.locationButton} onPress={goToMyLocation}>
              <Ionicons name="navigate" size={24} color="#C44A93" />
            </TouchableOpacity>

            {/* Selected User Info Card */}
            {selectedUser && (
              <View style={styles.userInfoCard}>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => setSelectedUser(null)}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>

                <View style={styles.cardContent}>
                  <Image 
                    source={selectedUser.avatarSource} 
                    style={styles.cardAvatar} 
                  />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>
                      {selectedUser.name}, {selectedUser.age}
                    </Text>
                    <Text style={styles.cardDistance}>
                      {selectedUser.distance}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.messageButton}>
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#C44A93" />
          </View>
        )}

        <MapBottomSheet users={suggestedUsers} />
        
        <FilterModal
          isVisible={!!activeFilter}
          onClose={() => setActiveFilter(null)}
          title={activeFilter || ""}
          options={activeFilter ? FILTER_OPTIONS[activeFilter] : []}
          onSelect={handleSelectOption}
          currentSelections={activeFilter ? selectedFilters[activeFilter] : []}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCF9FC' },
  mapArea: { flex: 1 },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  filterOverlayContainer: { 
    position: 'absolute', 
    top: 15, 
    left: 0, 
    right: 0, 
    zIndex: 10 
  },
  pillRow: { 
    flexDirection: 'row', 
    paddingHorizontal: 15, 
    paddingVertical: 5, 
    gap: 10 
  },
  pill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#EFE7EC', 
    elevation: 3 
  },
  pillSelected: { 
    backgroundColor: '#C44A93', 
    borderColor: '#C44A93' 
  },
  pillText: { 
    marginLeft: 6, 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#2F2632' 
  },
  pillTextSelected: { color: '#FFFFFF' },

  locationButton: { 
    position: 'absolute', 
    right: 20, 
    bottom: 310, 
    backgroundColor: 'white', 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 8, 
    zIndex: 20 
  },


  imageDotContainer: { 
    width: 36, 
    height: 36, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  imageDot: { 
    width: 20, 
    height: 20 
  },

  cssDotOuter: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: 'rgba(196, 74, 147, 0.25)', // Halo translucide
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  cssDotInner: { 
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    backgroundColor: '#C44A93', 
    borderWidth: 2, 
    borderColor: '#FFFFFF', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, 
  },

 

  userInfoCard: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    paddingTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 30,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 31,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2632',
  },
  cardDistance: {
    fontSize: 14,
    color: '#8E8291',
    marginTop: 2,
  },
  messageButton: {
    backgroundColor: '#C44A93',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginLeft: 10,
  },
  messageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});