import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterChat'
})

/**
 * Custom pipe that allows for dynamic filtering from a text input.
 * Value is the value within an array of data. For the chat component, it's the array of memberDtos fetched for that user's chat page.
 * Input is the user input from the search box.
 * When there is an input, this pipe filters and returns all matches.
 * When there is no input, it displays all data.
 * Used in the HTML as follows:
 * <input type="search" [(ngModel)]="nameSearch" placeholder="Search name" class="form-control form-control-sm">
 * <tr *ngFor="let member of otherMembers | filterChat: nameSearch"  ..............> {{member.firstName}} ........ </tr>
 */
export class FilterChatPipe implements PipeTransform {
  transform(value: any, input: any): any {
    if (input) {
      // ...indexOf(input) will be > 0 if the value is in the string. Otherwise, it's -1.
      // Filter the value by searching indexOf the member's combined first and lastname, ignoring white space
      return value.filter(val => (val.firstName + val.lastName).indexOf(input.toLowerCase().replace(/ /g, '')) >= 0);
    } else {
      return value;
    }
  }

}
