import { NewMatch, NotificationActivity } from './types';

export const newMatches: NewMatch[] = [
{ id: '1', name: 'Elena', avatar: { uri: 'https://i.pravatar.cc/150?img=32' } },
{ id: '2', name: 'Marcus', avatar: { uri: 'https://i.pravatar.cc/150?img=12' } },
{ id: '3', name: 'Sophia', avatar: { uri: 'https://i.pravatar.cc/150?img=47' } },
{ id: '4', name: 'Leo', avatar: { uri: 'https://i.pravatar.cc/150?img=15' } },
];

export const recentActivities: NotificationActivity[] = [
{
id: '1',
type: 'like',
name: 'Marcus',
message: 'liked your profile. Send a message!',
time: '2 MINS AGO',
avatar: { uri: 'https://i.pravatar.cc/150?img=12' },
},
{
id: '2',
type: 'match',
name: 'You and Elena',
message: 'matched! Say hello!',
time: '45 MINS AGO',
avatar: { uri: 'https://i.pravatar.cc/150?img=32' },
},
{
id: '3',
type: 'message',
name: 'Sophia',
message: 'sent you a message: "I love your photos!"',
time: '3 HOURS AGO',
avatar: { uri: 'https://i.pravatar.cc/150?img=47' },
},
{
id: '4',
type: 'like',
name: 'Leo',
message: 'liked your profile.',
time: 'YESTERDAY',
avatar: { uri: 'https://i.pravatar.cc/150?img=15' },
},
];