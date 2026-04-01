import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

interface UserLocation {
  user_id: string;
  latitude: number;
  longitude: number;
}

interface Props {
  users: UserLocation[];
}

const UsersMarkers = ({ users }: Props) => {
  return (
    <>
      {users.map((user) => (
        <Marker
          key={user.user_id}
          coordinate={{ latitude: user.latitude, longitude: user.longitude }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false} // Optimisation de performance
        >
          <View style={styles.otherUserDot} />
        </Marker>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  otherUserDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C44A93',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 5,
  },
});

export default memo(UsersMarkers); // Utilise memo pour éviter les re-rendus inutiles