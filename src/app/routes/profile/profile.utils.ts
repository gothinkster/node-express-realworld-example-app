import { User } from '../auth/user.model';
import { Profile } from './profile.model';

const profileMapper = (user: any, username: string | undefined): Profile => ({
  username: user.username,
  bio: user.bio,
  image: user.image,
  following: username
    ? user?.followedBy.some((followingUser: Partial<User>) => followingUser.username === username)
    : false,
});

export default profileMapper;
