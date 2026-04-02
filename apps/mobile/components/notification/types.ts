import { ImageSourcePropType } from 'react-native';

export type NewMatch = {
id: string;
name: string;
avatar: ImageSourcePropType;
};

export type NotificationType = 'like' | 'match' | 'message';

export type NotificationActivity = {
id: string;
type: NotificationType;
name: string;
message: string;
time: string;
avatar: ImageSourcePropType;
};