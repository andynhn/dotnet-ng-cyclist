import { Photo } from './photo';

export interface Member {
    id: number;
    username: string;
    photoUrl: string;
    age: number;
    firstName: string;
    lastName: string;
    createdAt: Date;
    updatedAt: Date;
    lastActive: Date;
    gender: string;
    introduction: string;
    interests: string;
    cyclingFrequency: string;
    cyclingCategory: string;
    skillLevel: string;
    city: string;
    country: string;
    photos: Photo[];
}