import * as jwt from 'jsonwebtoken';
import { jwtSecret } from '../../config';

const generateToken = (id: number): string =>
  jwt.sign({ user: { id } }, jwtSecret(), {
    expiresIn: '60d',
  });

export default generateToken;
