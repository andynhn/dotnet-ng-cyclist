// class used for pagination of Admin Panel's user management tab.
export class UserManageParams {
    pageNumber = 1;
    pageSize = 15;
    usernameSearch = '';
    roles = [];
    orderBy = 'aToZ';
    // directly modify how many messages appear on each page of pagination module
}
