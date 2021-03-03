import { Component, OnDestroy, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { RolesModalComponent } from 'src/app/modals/roles-modal/roles-modal.component';
import { Pagination } from 'src/app/_models/pagination';
import { User } from 'src/app/_models/user';
import { UserManageParams } from 'src/app/_models/userManageParams';
import { AdminService } from 'src/app/_services/admin.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: Partial<User[]>; // Partial because only has part of the parameters for a User object.
  bsModalRef: BsModalRef;
  pagination: Pagination;
  userManageParams: UserManageParams;
  loading = false;
  rolesList = [
    {value: 'Admin', display: 'Admin', isChecked: false },
    {value: 'Moderator', display: 'Moderator', isChecked: false },
    {value: 'Member', display: 'Member', isChecked: false }
  ];
  selectedRoles = [];
  selectedRoleValues = [];


  constructor(private adminService: AdminService,
              private modalService: BsModalService,
              private toastr: ToastrService) {
                this.userManageParams = this.adminService.getUserManageParams();
              }

  ngOnInit(): void {
    this.getUsersWithRoles();
    this.getSelectedRoles();
  }

  changeSelection() {
    this.getSelectedRoles();
  }
  getSelectedRoles() {
    this.selectedRoleValues = [];
    this.selectedRoles = this.rolesList.filter((value, index) => {
      return value.isChecked;
    });
    for (const role of this.selectedRoles) {
      this.selectedRoleValues.push(role.value);
    }
    this.userManageParams.roles = this.selectedRoleValues;
  }


  /**
   * Method for getting users with roles from the service.
   * Called each time an admin submits Search Filter form.
   * This should only be used for the initial load of users from a given search query.
   * This should NOT be used within the pageChanged() method for loading members for a new page of the same search.
   * Pagination relies on unique logic that tracks pageNumber given the previous number, etc.
   * Using this method to load users for page change will cause issues.
   */
  getUsersWithRoles() {
    this.loading = true;
    // set to 1 here for when user makes a new search but while on a different page of an existing search
    // Pagination logic is set to skip (currentPage - 1 * pageSize) of the total query results.
    // If user makes new search while on a page > 1, pagination will have issues and return faulty data
    this.userManageParams.pageNumber = 1;
    this.adminService.setUserManageParams(this.userManageParams);
    this.adminService.getUsersWithRoles(this.userManageParams).subscribe(response => {
      this.users = response.result;
      this.pagination = response.pagination;
      this.loading = false;
    });
  }

  pageChanged(event: any) {
    this.loading = true;
    console.log(event);
    this.userManageParams.pageNumber = event.page;
    this.adminService.setUserManageParams(this.userManageParams);
    // get users with roles with the new parameters. Only changed parameter should be pageNumber.
    // server logic gets all results from the query, but uses pageNumber to "Skip" results in
    // the list depending on the pageNumber passed in.
    this.adminService.getUsersWithRoles(this.userManageParams).subscribe(response => {
      this.users = response.result;
      this.pagination = response.pagination;
      this.loading = false;
    });
  }

  openRolesModal(user: User) {
    const config = {
      class: 'modal-dialog-centered',
      initialState: {
        user,
        roles: this.getRolesArray(user)
      }
    };
    this.bsModalRef = this.modalService.show(RolesModalComponent, config);
    this.bsModalRef.content.updateSelectedRoles.subscribe(values => {
      const rolesToUpdate = {
        roles: [...values.filter(el => el.checked === true).map(el => el.name)]
      };
      if (rolesToUpdate) {
        this.adminService.updateUserRoles(user.username, rolesToUpdate.roles).subscribe(response => {
          user.roles = [...rolesToUpdate.roles];
          this.toastr.success('Successfully updated user roles');
        }, error => {
          this.toastr.error(error, 'Encountered an error while updating roles');
        });
      }
    });
  }

  private getRolesArray(user) {
    const roles = [];
    const userRoles = user.roles;
    const availableRoles: any[] = [
      {name: 'Admin', value: 'Admin'},
      {name: 'Moderator', value: 'Moderator'},
      {name: 'Member', value: 'Member'}
    ];

    // populates the modal roles checkbox with roles that the user has, based on the given user.
    availableRoles.forEach(role => {
      let isMatch = false;
      for (const userRole of userRoles) {
        if (role.name === userRole) {
          isMatch = true;
          role.checked = true;
          roles.push(role);
          break;
        }
      }
      if (!isMatch) {
        role.checked = false;
        roles.push(role);
      }
    });
    return roles;
  }

  /**
   * method to reset filters on the user management page.
   * pass in this.user so that it gets set to what the page was initialized at.
   * then loadMembers again.
   */
  resetFilters() {
    console.log('reset filters');
    // reset the userManageParms in this component with fresh params from the service.
    this.userManageParams = this.adminService.resetUserManageParams();
    // need to reset these 'isChecked' to false.
    this.rolesList = [
      {value: 'Admin', display: 'Admin', isChecked: false },
      {value: 'Moderator', display: 'Moderator', isChecked: false },
      {value: 'Member', display: 'Member', isChecked: false }
    ];
    this.getUsersWithRoles();
  }

  ngOnDestroy() {
    this.adminService.resetUsersWithRolesCache();
    this.adminService.resetUserManageParams();
  }
}
