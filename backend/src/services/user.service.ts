import User, { IUser } from '../models/user.model';

export class UserService {
  // Obtener todos los usuarios
  public async getAllUsers(): Promise<IUser[]> {
    return await User.find().select('-password');
  }

  // Obtener un usuario por ID
  public async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id).select('-password');
  }

  // Crear un nuevo usuario
  public async createUser(userData: Partial<IUser>): Promise<IUser> {
    // Aquí podrías agregar hashing de contraseña en el futuro
    const user = new User(userData);
    return await user.save();
  }

  // Actualizar un usuario
  public async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');
  }

  // Eliminar un usuario
  public async deleteUser(id: string): Promise<IUser | null> {
    return await User.findByIdAndDelete(id);
  }
}

export const userService = new UserService();
