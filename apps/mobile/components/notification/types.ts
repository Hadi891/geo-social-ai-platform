import { ImageSourcePropType } from 'react-native';

export type NewMatch = {
id: string;
name: string;
avatar: ImageSourcePropType;
};

export type NotificationType = 'like' | 'match' | 'message';
export type LikeTarget = 'profile' | 'post';
export type MessageTarget = 'direct' | 'comment';

export type NotificationActivity = {
id: string;
type: NotificationType;
name: string;
message?: string;
likeTarget?: LikeTarget;
messageTarget?: MessageTarget;
createdAt: string; // DD/MM/YYYY hh:mm
avatar: ImageSourcePropType;
};