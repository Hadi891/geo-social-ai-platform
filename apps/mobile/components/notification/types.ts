import { ImageSourcePropType } from 'react-native';

export type NewMatch = {
id: string;
name: string;
avatar: ImageSourcePropType;
};

export type NotificationType = 'like' | 'match' | 'comment';
export type LikeTarget = 'profile' | 'post';


export type NotificationActivity = {
id: string;
type: NotificationType;
name: string;
comment?: string;
likeTarget?: LikeTarget;
createdAt: string;
avatar: ImageSourcePropType;
};