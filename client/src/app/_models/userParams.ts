import { User } from './user';

export class UserParams {
    gender: string;
    minAge = 18;
    maxAge = 99;
    pageNumber = 1;
    pageSize = 12;
    cyclingFrequency = 'all';
    cyclingCategory = 'all';
    skillLevel = 'all';
    nameSearch = '';
    state = '';
    city = '';
    orderBy = 'lastActive';

    constructor(user: User) {
        // userParams are for filtering user lists by the provided properties. If they don't provide male/female as a filter,
        // set gender to 'all' and server will recognize to not filter by gender.
        if (user.gender !== 'female' && user.gender !== 'male') {
            this.gender = 'all';
        }
    }
}
