import React, { memo, useState, useRef } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

const UserMarker = memo(({ user }: any) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const markerRef = useRef<any>(null);

  // Fonction appelée quand l'image (avatar) a fini de charger
  const handleImageLoad = () => {
    setIsImageLoaded(true);
    // Force la carte à redessiner ce marqueur spécifique
    if (markerRef.current && markerRef.current.redraw) {
      markerRef.current.redraw();
    }
  };

  return (
    <Marker
      ref={markerRef}
      coordinate={{ latitude: user.latitude, longitude: user.longitude }}
      // On garde tracksViewChanges true TANT QUE l'image n'est pas chargée
      tracksViewChanges={!isImageLoaded} 
      anchor={{ x: 0.5, y: 1 }}
      onPress={() => console.log("Profil de:", user.id)}
    >
      {/* On encapsule tout dans une View transparente sans styles complexes */}
      <View style={styles.container}>
        
        {/* LE ROND DU PIN */}
        <View style={styles.pinBody}>
          <Image
            source={user.avatarSource}
            style={styles.avatar}
            onLoad={handleImageLoad} // Déclenche le redraw
          />
        </View>

        {/* LA POINTE DU PIN */}
        <View style={styles.pinPointer} />
        
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
 container: {
  width: 100,
  height: 100,
  alignItems: 'center',
  justifyContent: 'flex-start',
  backgroundColor: 'transparent',
  overflow: 'visible',
},
  pinBody: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#FFFFFF',
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 5,
},
  avatar: {
    width: 42, // Légèrement plus petit que le body pour faire la bordure blanche
    height: 42,
    borderRadius: 21,
    backgroundColor: '#C44A93',
  },
  pinPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    marginTop: -2, // Colle le triangle au rond
  },
});

export default UserMarker;