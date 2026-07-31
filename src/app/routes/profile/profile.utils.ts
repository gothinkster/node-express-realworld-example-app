import { User } from '../auth/user.model';
import { Profile } from './profile.model';

const profileMapper = (user: any, id?: number) => {
  return {
    username: user.username,
    bio: user.bio,
    // Add this fallback logic:
    image: user.image || `https://ui-avatars.com/api/?name=${user.username}&size=64&background=random`,
    following: id ? user.followedBy.some((follow: any) => follow.id === id) : false,
  };
};

export default profileMapper;
