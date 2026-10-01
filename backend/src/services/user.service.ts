import User, { IUser } from '../models/user.model';
import { invalidateUserCache } from '../middlewares/auth.middleware';

export class UserService {
  
  public async getAllUsers(limit: number = 100): Promise<IUser[]> {
    return await User.find().select('-password').limit(limit);
  }

  
  public async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id).select('-password');
  }

  
  public async createUser(userData: Partial<IUser>): Promise<IUser> {
    
    const user = new User(userData);
    return await user.save();
  }

  
  public async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    invalidateUserCache(id);
    return await User.findByIdAndUpdate(id, updateData, { returnDocument: 'after', runValidators: true }).select('-password');
  }

  
  public async deleteUser(id: string): Promise<IUser | null> {
    invalidateUserCache(id);
    return await User.findByIdAndDelete(id);
  }
}

export const userService = new UserService();
