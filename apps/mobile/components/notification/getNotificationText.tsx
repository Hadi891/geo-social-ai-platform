import React from 'react';
import { Text } from 'react-native';
import { NotificationActivity } from './types';

export function getNotificationText(item: NotificationActivity) {
  if (item.type === 'match') {
    return (
      <Text>
        <Text style={{ fontWeight: '700' }}>{`You and ${item.name}`}</Text>
        {' matched! Say hello!'}
      </Text>
    );
  }

  if (item.type === 'comment') {
      return (
        <Text>
          <Text style={{ fontWeight: '700' }}>{item.name} </Text>
          {'commented on your post: '}
          <Text style={{ fontWeight: '700' }}>{`"${item.comment ?? ''}"`}</Text>
        </Text>
      );
  }

  if (item.type === 'like') {
    if (item.likeTarget === 'post') {
      return (
        <Text>
          <Text style={{ fontWeight: '700' }}>{item.name} </Text>
          {'liked your post!'}
        </Text>
      );
    }

    return (
      <Text>
        <Text style={{ fontWeight: '700' }}>{item.name} </Text>
        {'liked your profile. Consider Matching?'}
      </Text>
    );
  }

  return null;
}