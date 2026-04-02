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
likeTarget: 'profile',
createdAt: '02/04/2026 13:58',
avatar: { uri: 'https://i.pravatar.cc/150?img=12' },
},
{
id: '2',
type: 'match',
name: 'Elena',
createdAt: '02/04/2026 12:20',
avatar: { uri: 'https://i.pravatar.cc/150?img=32' },
},
{
id: '3',
type: 'message',
name: 'Sophia',
message: 'I love your photos!',
createdAt: '01/04/2026 21:10',
avatar: { uri: 'https://i.pravatar.cc/150?img=47' },
},
{
id: '4',
type: 'like',
name: 'Leo',
likeTarget: 'post',
createdAt: '28/03/2026 10:45',
avatar: { uri: 'https://i.pravatar.cc/150?img=15' },
},
{
id: '5',
type: 'message',
messageTarget: 'direct',
name: 'Sophia',
message: 'I love your photos!',
createdAt: '25/03/2026 21:10',
avatar: { uri: 'https://i.pravatar.cc/150?img=47' },
},
{
id: '6',
type: 'message',
messageTarget: 'comment',
name: 'Leo',
message: 'This place looks amazing',
createdAt: '25/03/2026 18:40',
avatar: { uri: 'https://i.pravatar.cc/150?img=15' },
},
];