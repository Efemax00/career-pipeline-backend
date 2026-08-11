

export class AuthResponseDto {
  accessToken: string;
  user: {
    uid: string;
    email: string;
    name?: string;
    picture?: string;
  };
}