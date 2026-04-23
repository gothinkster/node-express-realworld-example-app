import { Comment } from './comment.model';

export interface Article {
  id: number;
  title: string;
  slug: string;
  description: string;
  comments: Comment[];
  favorited: boolean;
}

//Helper to calculate reading time
export function calculateReadingTime(bodyText: string): number {
  if(!bodyText) return 0;
  return Math.ceil(bodyText.split(' ').length / 200);
}