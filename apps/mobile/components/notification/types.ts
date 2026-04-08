import { ImageSourcePropType } from 'react-native';

export type NewMatch = {
  id: string;        // match_id
  user_id: string;   // the other user's id
  name: string;
  avatar: ImageSourcePropType;
};

export type ActivityType = 'like_profile' | 'like_post' | 'comment' | 'match';

export type NotificationActivity = {
  id: string;
  type: ActivityType;
  actor_id: string;
  name: string;
  message?: string;      // extra_text (comment content)
  ref_id?: string;       // match_id for match type, post_id for post types
  createdAt: string;     // ISO timestamp
  avatar: ImageSourcePropType;
};
