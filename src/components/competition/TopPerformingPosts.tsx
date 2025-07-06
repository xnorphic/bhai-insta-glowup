
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Eye } from "lucide-react";

interface PostData {
  id: string;
  thumbnail: string;
  caption: string;
  likes: number;
  comments: number;
  views: number;
  type: 'post' | 'carousel' | 'reel';
  date: string;
}

interface TopPostsProps {
  profileName: string;
  posts: PostData[];
}

export const TopPerformingPosts = ({ profileName, posts }: TopPostsProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-[#333333] mb-4">
        Top 5 Posts - {profileName}
      </h3>
      
      <div className="space-y-4">
        {posts.map((post, index) => (
          <div key={post.id} className="flex items-start space-x-4 p-3 border rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold">
                #{index + 1}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  post.type === 'reel' ? 'bg-red-100 text-red-800' :
                  post.type === 'carousel' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {post.type}
                </span>
                <span className="text-xs text-[#666666]">{post.date}</span>
              </div>
              
              <p className="text-sm text-[#333333] line-clamp-2 mb-2">
                {post.caption}
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-[#666666]">
                <span className="flex items-center">
                  <Heart className="w-3 h-3 mr-1 text-red-500" />
                  {post.likes.toLocaleString()}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="w-3 h-3 mr-1 text-blue-500" />
                  {post.comments.toLocaleString()}
                </span>
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1 text-green-500" />
                  {post.views.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
