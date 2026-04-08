import React from 'react';
import { Marker } from 'react-native-maps';

const UserMarker = ({ user, onPress }: { user: any; onPress: () => void }) => {
  return (
    <Marker
      coordinate={{ latitude: user.latitude, longitude: user.longitude }}
      image={require('@/assets/images/custom-pin.png')}
      anchor={{ x: 0.5, y: 1.0 }}          
      onPress={onPress}
      title={user.name}
      tracksViewChanges={false}
    />
  );
};

export default UserMarker;