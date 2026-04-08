import React, { useCallback, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Dimensions,
  PanResponder,
  Animated
} from 'react-native';
import SuggestionCard, { SuggestedUser, CARD_WIDTH } from './SuggestionCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Precise heights for our 3 stages
const STAGE_COLLAPSED = 80;
const STAGE_PEEK = 300;
const STAGE_EXPANDED = SCREEN_HEIGHT * 0.8;

interface MapBottomSheetProps {
  users: SuggestedUser[];
}

export default function MapBottomSheet({ users }: MapBottomSheetProps) {
  // 1. Current stage tracker
  const [stage, setStage] = useState<'COLLAPSED' | 'PEEK' | 'EXPANDED'>('PEEK');
  
  // 2. Animated height value
  const animatedHeight = useRef(new Animated.Value(STAGE_PEEK)).current;

  // 3. Logic to move between stages
  const transitionTo = (nextStage: 'COLLAPSED' | 'PEEK' | 'EXPANDED') => {
    let toValue = STAGE_PEEK;
    if (nextStage === 'COLLAPSED') toValue = STAGE_COLLAPSED;
    if (nextStage === 'EXPANDED') toValue = STAGE_EXPANDED;

    Animated.spring(animatedHeight, {
      toValue,
      useNativeDriver: false,
      friction: 9,
      tension: 50,
    }).start();

    setStage(nextStage);
  };

  // 4. Gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 15,
      onPanResponderRelease: (_, gestureState) => {
        const { dy } = gestureState;

        if (dy < -30) { // SWIPE UP
          if (stage === 'COLLAPSED') transitionTo('PEEK');
          else if (stage === 'PEEK') transitionTo('EXPANDED');
        } 
        else if (dy > 30) { // SWIPE DOWN
          if (stage === 'EXPANDED') transitionTo('PEEK');
          else if (stage === 'PEEK') transitionTo('COLLAPSED');
        }
      },
    })
  ).current;

  const renderCard = useCallback(({ item }: { item: SuggestedUser }) => (
    <View style={stage === 'EXPANDED' ? styles.fullCardWrapper : styles.peekCardWrapper}>
      <SuggestionCard 
        user={item} 
        onPass={() => {}} 
        onMatch={() => {}} 
      />
    </View>
  ), [stage]);

  return (
    <Animated.View style={[styles.bottomSheet, { height: animatedHeight }]}>
      {/* HEADER AREA - DRAG HERE */}
      <View {...panResponder.panHandlers}>
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => {
            if (stage === 'COLLAPSED') transitionTo('PEEK');
          }}
          style={styles.sheetHeader}
        >
          <View style={styles.handleBar} />
          <Text style={styles.sheetTitle}>People Minglin' Nearby</Text>
          {stage !== 'COLLAPSED' && (
             <Text style={styles.sheetSubtitle}>{users.length} ACTIVE CONNECTIONS</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* HORIZONTAL CARDS */}
      {stage !== 'COLLAPSED' && (
        <View style={styles.content}>
          <FlatList
            data={users}
            renderItem={renderCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            snapToInterval={CARD_WIDTH + 16} 
            decelerationRate="fast"
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute', 
    bottom: 0, left: 0, right: 0, 
    backgroundColor: '#FEFEFE',
    borderTopLeftRadius: 36, borderTopRightRadius: 36, 
    borderWidth: 1, borderColor: '#EFE7EC',
    shadowColor: '#000', shadowOpacity: 0.1, elevation: 20,
    zIndex: 999,
  },
  sheetHeader: { alignItems: 'center', paddingTop: 10, paddingBottom: 15 },
  handleBar: { width: 50, height: 5, borderRadius: 3, backgroundColor: '#E6E1E6', marginBottom: 15 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#2F2632' },
  sheetSubtitle: { fontSize: 12, fontWeight: '700', color: '#8E8291', marginTop: 4 },
  
  content: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 10 },
  
  // These wrappers control how much of the card is visible in each mode
  peekCardWrapper: { 
    height: 450, // Let it clip significantly so it looks like a "peek"
  },
  fullCardWrapper: { 
    height: SCREEN_HEIGHT * 0.7, // Show the full card when expanded
  }
});