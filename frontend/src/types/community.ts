export interface Post {
  id: string;
  display_name: string;
  title: string;
  content: string;
  content_labels: string[];
  is_anonymous: boolean;
  moderation_status: string;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  display_name: string;
  content: string;
  is_anonymous: boolean;
  moderation_status: string;
  created_at: string;
}

export interface PostDetail extends Post {
  comments: Comment[];
}

export interface PostList {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
}
