export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ProfileDto {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  refCode?: string;
}

export interface UserDto {
  id: string;
  email: string;
  roles: string[];
  profile?: ProfileDto;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}
