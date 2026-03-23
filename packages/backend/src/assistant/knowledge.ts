/**
 * App knowledge base for the in-app AI assistant.
 * Written in plain user-facing language — no API routes or technical details.
 * Each section carries keywords used for lightweight retrieval.
 * Update this file as the app evolves.
 */

export type KnowledgeSection = {
  id: string;
  title: string;
  keywords: string[];
  content: string;
};

export const KNOWLEDGE_BASE: KnowledgeSection[] = [
  {
    id: "profile",
    title: "Your Profile",
    keywords: [
      "profile", "name", "age", "bio", "gender", "orientation", "sexual orientation",
      "interests", "introversion", "introversion score", "photo", "picture", "avatar",
      "create profile", "update profile", "edit profile", "complete profile",
    ],
    content: `
Your profile is how other users discover and learn about you.
You can set your name, age, a short bio, gender, sexual orientation, a list of interests
(hobbies and things you enjoy), and an introversion score from 0 (very outgoing) to 100 (very introverted).
You can also upload a profile photo to make your profile stand out.
A complete profile — with a bio, interests filled in, and a photo — makes a much better
first impression and improves how well the app can match you with compatible people.
Your interests directly affect your compatibility score, so the more honest and specific they are,
the better your recommendations will be.
    `.trim(),
  },

  {
    id: "discovery_nearby",
    title: "Discovering Nearby People",
    keywords: [
      "nearby", "discover", "discovery", "find people", "find users", "around me",
      "location", "distance", "radius", "map", "who is near", "people near me",
      "explore", "set location", "no one showing up", "empty feed",
    ],
    content: `
The discovery feed shows you people who are nearby and potentially compatible with you.
To use it, you need to share your current location with the app first.
The app searches within a radius you can adjust — by default it looks within 5 km,
but you can expand it up to 50 km if you want to see more people.
People you have already liked, who have already liked you, or who you are already matched
with are automatically hidden — so you always see fresh profiles.
Each profile shows the person's name, age, bio, interests, distance, and photo if they have one.
    `.trim(),
  },

  {
    id: "compatibility_scoring",
    title: "Compatibility Score",
    keywords: [
      "compatibility", "score", "match score", "ranking", "algorithm", "ranked",
      "interest score", "distance score", "introversion similarity", "final score",
      "why ranked", "how ranking works", "who appears first", "order",
    ],
    content: `
The app ranks nearby people using a compatibility score based on three things:
  - Shared interests: the more interests you have in common, the higher they rank. This is the most important factor.
  - Distance: people who are closer to you rank a bit higher.
  - Introversion similarity: people with a similar introversion level to yours rank slightly higher.
People with the highest combined score appear at the top of your feed.
You can turn off compatibility ranking if you prefer to simply see people sorted by distance instead.
    `.trim(),
  },

  {
    id: "discovery_filters",
    title: "Discovery Filters",
    keywords: [
      "filter", "filters", "age filter", "age range", "gender filter",
      "orientation filter", "sexual orientation filter", "search radius",
      "clear filter", "disable filter", "change filter", "turn off compatibility",
      "no compatibility", "distance only",
    ],
    content: `
You can customize who appears in your discovery feed using filters:
  - Age range: set a minimum and/or maximum age to only see people in that range.
  - Gender: choose which gender to show, or clear the filter to see everyone.
  - Sexual orientation: filter by the orientation of the people shown.
  - Search radius: adjust how far away you want to look.
  - Compatibility mode: turn it off to sort results purely by distance instead of compatibility score.
By default, the app infers sensible values from your own gender and orientation,
so you do not have to set anything manually unless you want to customize.
You can clear any filter on its own without affecting the others.
    `.trim(),
  },

  {
    id: "likes_matches",
    title: "Liking People and Getting Matches",
    keywords: [
      "like", "likes", "match", "matches", "mutual like", "how to match",
      "matched", "get matches", "list matches", "new match",
      "how matching works", "who liked me",
    ],
    content: `
When you see someone you like in the discovery feed, you can like their profile.
If they like you back, the app automatically creates a match between you two.
You can see all your current matches in the Matches section of the app, where each match
shows the other person's profile and when you matched.
Once you are matched, you can open a chat and start talking.
You cannot message someone before you are matched with them.
    `.trim(),
  },

  {
    id: "chat_basics",
    title: "Chatting with Your Matches",
    keywords: [
      "chat", "message", "send message", "conversation",
      "talk", "text", "messaging", "how to chat", "open chat", "start chat",
      "message history", "load messages", "past messages",
    ],
    content: `
Once you match with someone, you can open a chat and start a conversation.
You can send text messages or share images.
Your full message history is saved, so you can always scroll back through past conversations.
Messages are shown oldest to newest so the conversation flows naturally.
Chat is only available between matched users.
    `.trim(),
  },

  {
    id: "chat_features",
    title: "Read Receipts, Typing Indicator, Editing and Deleting Messages",
    keywords: [
      "read receipt", "read", "seen", "typing", "typing indicator", "is typing",
      "edit message", "delete message", "unsend", "update message",
      "mark read", "last read",
    ],
    content: `
The chat includes a few extra features:
  - Read receipts: you can see when someone has read your messages, and mark a conversation as read yourself.
  - Typing indicator: a small indicator shows when the other person is currently typing a reply.
  - Edit a message: you can edit a text message you already sent, as long as it has not been deleted.
  - Delete a message: you can delete any of your own messages. A small placeholder remains visible
    to both people so they know something was there, but the content is hidden.
    `.trim(),
  },

  {
    id: "ai_suggestions",
    title: "AI Chat Suggestions",
    keywords: [
      "ai suggestion", "ai suggestions", "suggestion", "suggestions",
      "help me reply", "what to say", "conversation help", "chat help",
      "ai chat", "message idea", "reply idea", "opener", "icebreaker",
      "conversation starter", "ai button",
    ],
    content: `
The AI Suggestions button in chat gives you three short, natural message ideas when you are
not sure what to say next.
At the very start of a conversation it generates icebreakers and openers based on interests
you share with your match.
Mid-conversation it reads the recent messages and infers one of five conversation modes:
  - Discovery: the conversation is just starting
  - Flow: the conversation is going well naturally
  - Stalled: the conversation is slowing down or stuck
  - Tension: the conversation feels awkward, cold, or negative
  - Inactive: the conversation has been silent for a long time (more than 24 hours)
Suggestions are tailored to the detected mode.
The AI only runs when you tap the button — it does not watch your chat automatically.
Suggestions are friendly and non-pushy. Use them as-is or just for inspiration.
    `.trim(),
  },

  {
    id: "posts",
    title: "Posts, Comments, and Likes",
    keywords: [
      "post", "posts", "create post", "feed", "comment", "comments",
      "like post", "unlike post", "post like", "post feed", "write post", "share something",
    ],
    content: `
Posts let you share something with the whole community — a thought, a photo, or anything you want.
Everyone on the app can see posts in the feed, not just your matches.
You can like a post to show appreciation, or leave a comment to start a conversation around it.
You can remove your like at any time. Comments are visible to everyone who views the post.
    `.trim(),
  },

  {
    id: "stories",
    title: "Stories",
    keywords: [
      "story", "stories", "create story", "story feed", "view story",
      "delete story", "story expire", "24 hours", "story views", "who viewed",
      "how long do stories last",
    ],
    content: `
Stories are short visual moments you can share — they last 24 hours and then disappear automatically.
You can post an image with an optional caption. Other users can view your story in the stories feed.
You can see how many people have viewed your story.
If you want to remove a story before it expires, you can delete it at any time.
Your own stories are managed separately from the stories feed, which shows stories from other users.
    `.trim(),
  },

  {
    id: "media_upload",
    title: "Uploading Photos and Images",
    keywords: [
      "upload", "photo", "image", "picture", "media",
      "profile photo", "upload image", "how to upload", "attach photo",
      "add photo", "change photo",
    ],
    content: `
You can upload photos for your profile, posts, and chat messages.
The upload is handled securely and directly — the app takes care of everything behind the scenes.
For your profile photo: use the photo upload option in your profile settings.
For posts: attach an image when writing a new post.
For chat: send an image directly in a conversation with a match.
Having a profile photo is strongly recommended — profiles with photos get significantly more attention.
    `.trim(),
  },

  {
    id: "dating_tips",
    title: "Dating Conversation Tips",
    keywords: [
      "how to start", "conversation tip", "what to say", "first message",
      "advice", "dating advice", "talk to someone", "break the ice",
      "keep conversation going", "reply", "respond", "awkward", "nervous",
      "respectful", "communication", "connection",
      "no response", "ghosted", "not replying",
    ],
    content: `
Some practical tips for dating conversations in the app:
  - Reference something specific from their profile — a shared interest is a great starting point.
  - Ask open-ended questions that invite more than a yes or no answer.
  - Keep early messages light and curious rather than intense or overly complimentary.
  - Match the other person's energy and pace of replies.
  - If a conversation goes quiet, re-open it with a fresh topic rather than repeating yourself.
  - Use the AI Suggestions button in chat when you need inspiration — it tailors ideas to your shared context.
  - Be genuine — people respond much better to authenticity than rehearsed lines.
  - Very generic openers rarely work well; something specific always lands better.
    `.trim(),
  },

  {
    id: "scope",
    title: "What the Assistant Can Help With",
    keywords: [
      "what can you do", "what can you help", "what do you know",
      "out of scope", "can you help with", "assistant", "help",
    ],
    content: `
This assistant can help you with:
  - Understanding how any feature of the app works.
  - Tips on starting or continuing conversations with your matches.
  - Questions about discovery, filters, compatibility, stories, posts, and chat.
  - Using the AI suggestions feature.
  - General respectful dating-communication guidance.
It cannot help with things outside the app — such as coding, schoolwork, medical questions, or general trivia.
    `.trim(),
  },
];
