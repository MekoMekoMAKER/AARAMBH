import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  ArrowBigUp, 
  ArrowBigDown,
  Clock,
  Filter,
  X,
  Send,
  User as UserIcon
} from 'lucide-react';
import { forumService, auth } from '../services/firebaseService';
import { ForumPost } from '../types';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function ForumView() {
  const isOnline = useOnlineStatus();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await forumService.getPosts(filter === 'All' ? undefined : filter);
      setPosts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    await forumService.createPost(newTitle, newContent, newCategory);
    setNewTitle('');
    setNewContent('');
    setShowCreate(false);
    loadPosts();
  };

  const handleUpvote = async (post: ForumPost) => {
    if (!auth.currentUser) return;
    const isUpvoted = post.upvotes.includes(auth.currentUser.uid);
    await forumService.toggleUpvote(post.id, isUpvoted);
    loadPosts(); // Simple refresh
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <MessageSquare className="text-indigo-400" /> Community Forum
        </h2>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-500/20"
        >
          {showCreate ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['All', 'Current Affairs', 'Strategy', 'Subject Doubts', 'General'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              filter === cat ? "bg-indigo-500 text-white border-indigo-400" : "bg-white/5 text-slate-500 border-white/5 hover:border-white/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-3xl p-6 border-white/10 space-y-4"
          >
            <input 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Post Title..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-indigo-500/50 transition-colors"
            />
            <select 
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold outline-none appearance-none"
            >
              <option value="Current Affairs">Current Affairs</option>
              <option value="Strategy">Strategy</option>
              <option value="Subject Doubts">Subject Doubts</option>
              <option value="General">General</option>
            </select>
            <textarea 
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Share your thoughts or ask a doubt..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500/50 transition-colors resize-none"
            />
            <button 
              onClick={handleCreate}
              disabled={!isOnline}
              className={cn(
                "w-full font-black py-3 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all",
                isOnline ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500 cursor-not-allowed"
              )}
            >
              <Send size={18} /> {isOnline ? 'Post to Community' : 'Connect to Post'}
            </button>
            {!isOnline && (
              <p className="text-[10px] text-center font-bold text-rose-400 mt-2">
                Internet connection required to share posts.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center opacity-20">Loading discussions...</div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center glass rounded-3xl opacity-40 italic">No discussions found in this category yet.</div>
        ) : (
          posts.map(post => (
            <motion.div 
              key={post.id}
              layout
              className="glass p-5 rounded-3xl border-white/5 hover:border-white/10 transition-all flex gap-4"
            >
              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => handleUpvote(post)}
                  className={cn(
                    "p-1 rounded-lg transition-colors",
                    post.upvotes.includes(auth.currentUser?.uid || '') ? "text-indigo-400 bg-indigo-400/10" : "text-slate-500 hover:text-white"
                  )}
                >
                  <ArrowBigUp size={24} fill={post.upvotes.includes(auth.currentUser?.uid || '') ? "currentColor" : "none"} />
                </button>
                <span className="text-xs font-black text-white">{post.upvotes.length}</span>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest",
                    post.category === 'Current Affairs' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    post.category === 'Strategy' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    post.category === 'Subject Doubts' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  )}>
                    {post.category}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock size={10} /> {formatDistanceToNow(new Date(post.createdAt))} ago
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white">{post.title}</h3>
                <p className="text-sm text-slate-400 line-clamp-2">{post.content}</p>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="w-5 h-5 bg-white/5 rounded-full flex items-center justify-center text-[10px]">
                      <UserIcon size={12} />
                    </div>
                    <span className="text-[10px] font-bold">{post.authorName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">
                    <MessageSquare size={12} /> {post.commentCount} Comments
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
