export type ProfileResponseType = {
    message: string;
    data: {
      email: string;
      username: string;
      name: string;
      birthday: string;
      horoscope: string;
      zodiac: string;
      height: number;
      weight: number;
      interests: string[];
    };
}
