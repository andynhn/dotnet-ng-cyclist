/**
 * Model used for pagination of Admin Panel's user management tab.
 */
export class PhotoManageParams {
    pageNumber = 1;
    pageSize = 15;          // directly modify how many messages appear on each page of pagination module
    usernameSearch = '';
    state = '';
    city = '';
    orderBy = 'lastActive'; // sort by lastActive by default (initial page load) because those are the most recent photos to be uploaded.
}
